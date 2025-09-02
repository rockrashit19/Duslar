import os
import re
import json
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, CommandObject
from aiogram.utils.keyboard import InlineKeyboardBuilder
from jose import jwt
import httpx

# ========= Конфиг из окружения =========
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
FRONTEND_URL = (os.getenv("FRONTEND_URL") or "https://app.minemduslar.ru").rstrip("/")
BACKEND_BASE_URL = (os.getenv("BACKEND_BASE_URL") or "https://api.minemduslar.ru").rstrip("/")

# Список админов — Telegram user_id: можно JSON или "1,2,3"
ROLE_MANAGERS_ENV = os.getenv("ROLE_MANAGERS", "[]")
try:
    ADMINS = {int(x) for x in json.loads(ROLE_MANAGERS_ENV)}
except Exception:
    ADMINS = {int(x) for x in re.split(r"[,\s]+", ROLE_MANAGERS_ENV.strip()) if x}

# Настройки выпуска JWT (должны совпадать с бэком)
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ISSUER = os.getenv("JWT_ISSUER", "duslar-bot")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "admin")
JWT_TTL_SECONDS = int(os.getenv("JWT_TTL_SECONDS", "300"))  # 5 минут по умолчанию

ALLOWED_ROLES = {"user", "organizer", "admin"}  # подстрой под свои роли

# ========= aiogram =========
bot = Bot(TELEGRAM_BOT_TOKEN)
dp = Dispatcher()
router = types.Router()
dp.include_router(router)

# ========= JWT helpers =========
def make_admin_jwt(tg_id: int) -> str:
    """
    Выпускаем короткоживущий JWT: роль admin, идентификатор — Telegram user_id.
    Бэк будет доверять такому токену, если SECRET/ISS/AUD совпадают.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(tg_id),
        "role": "admin",
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=JWT_TTL_SECONDS)).timestamp()),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

# ========= Вспомогалки =========
def parse_changerole(text: str, args: Optional[str]) -> Tuple[int, str]:
    # поддерживаем: /changerole 123 manager  и  /changerole/123/manager
    if args:
        parts = args.strip().replace(",", " ").split()
    else:
        parts = [p for p in text.split("/") if p]
        parts = parts[1:]  # срезаем 'changerole'
    if len(parts) < 2:
        raise ValueError("Нужно указать user_id и role: /changerole 123 admin")
    user_id = int(parts[0])
    role = parts[1].lower()
    return user_id, role

async def call_set_role(user_id: int, role: str, admin_token: str) -> Tuple[bool, str]:
    """
    PATCH к вашему API. Путь проверьте под свой проект.
    Предполагаем: PATCH /api/v1/admin/users/{user_id}/role  body: {"role": "manager"}
    """
    url = f"{BACKEND_BASE_URL}/api/v1/admin/users/{user_id}/role"
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"role": role}
    timeout = httpx.Timeout(10.0, connect=5.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.patch(url, json=payload, headers=headers)
    if r.status_code // 100 == 2:
        return True, ""
    try:
        detail = r.json()
    except Exception:
        detail = r.text
    return False, f"API {r.status_code}: {detail}"

# ========= Команды =========
@router.message(Command("start"))
async def cmd_start(message: types.Message):
    kb = InlineKeyboardBuilder()
    kb.button(text="Открыть приложение", web_app=types.WebAppInfo(url=f"{FRONTEND_URL}/"))
    kb.button(text="Открыть в браузере", url=f"{FRONTEND_URL}/")
    kb.adjust(1)
    await message.answer(
        "Ассаламу алейкум! 👋\nНажмите кнопку, чтобы открыть приложение.",
        reply_markup=kb.as_markup(),
    )

@router.message(Command("getadminjwt"))
async def cmd_getadminjwt(message: types.Message):
    if message.from_user.id not in ADMINS:
        await message.reply("⛔ Команда только для админов.")
        return
    token = make_admin_jwt(message.from_user.id)
    await message.answer(
        "Вот ваш короткоживущий admin JWT (действует несколько минут):\n\n"
        f"`{token}`\n\n"
        "Используйте в заголовке:\n"
        "`Authorization: Bearer <TOKEN>`",
        parse_mode="Markdown",
    )

@router.message(Command("changerole"))
async def cmd_changerole(message: types.Message, command: CommandObject):
    if message.from_user.id not in ADMINS:
        await message.reply("⛔ Нет прав. Команда только для админов.")
        return
    try:
        user_id, role = parse_changerole(message.text, command.args)
    except Exception as e:
        await message.reply(f"❗ {e}\nПримеры:\n/changerole 123 admin\n/changerole/123/admin")
        return
    if role not in ALLOWED_ROLES:
        await message.reply(f"Недопустимая роль: {role}. Разрешено: {', '.join(sorted(ALLOWED_ROLES))}")
        return

    await message.reply("⏳ Меняю роль…")

    # выпускаем служебный admin-JWT и идём в API
    token = make_admin_jwt(message.from_user.id)
    ok, err = await call_set_role(user_id, role, token)

    if ok:
        await message.reply(f"✅ Роль пользователя {user_id} изменена на **{role}**.")
    else:
        await message.reply(f"❌ Не удалось изменить роль: {err}")

# ========= Запуск =========
async def main():
    if not TELEGRAM_BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN не задан")
    if not (JWT_SECRET and BACKEND_BASE_URL):
        raise RuntimeError("Нужно задать JWT_SECRET и BACKEND_BASE_URL")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
