import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from jose import jwt

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    Message,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
)

# ===== Настройки из вашего проекта =====
from app.core.config import settings  # <- читает .env через pydantic-settings

# ---------- базовая настройка логов ----------
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s",
)
log = logging.getLogger("duslar-bot")

# ---------- константы / окружение ----------
BOT_TOKEN = settings.telegram_bot_token.get_secret_value()

# Базовый URL API (без /api/v1 в .env)
API_BASE = (settings.backend_base_url or "").rstrip("/")
if not API_BASE:
    raise RuntimeError("BACKEND_BASE_URL is not set")
API_V1 = f"{API_BASE}/api/v1"

# Админские ники из окружения (опционально, через запятую)
# пример: ADMIN_USERNAMES="alice,bob,@Charlie"
ADMIN_USERNAMES = {
    u.strip().lstrip("@").lower()
    for u in os.getenv("ADMIN_USERNAMES", "").split(",")
    if u.strip()
}

# Админские Telegram ID из .env -> ROLE_MANAGERS (ваш Settings уже это парсит)
ADMIN_IDS = set(settings.role_managers or [])

# Разрешённые роли (подставьте свои, если отличаются)
ALLOWED_ROLES = {"user", "organizer", "admin"}

# JWT параметры — должны соответствовать вашему декодеру на бэкенде
JWT_SECRET = settings.jwt_secret.get_secret_value()
JWT_ISSUER = os.getenv("JWT_ISSUER", "duslar-bot")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "admin")
JWT_TTL_DAYS = int(os.getenv("JWT_TTL_DAYS", "14"))


def make_admin_jwt(sub: str) -> str:
    """
    Выпускаем админ-JWT, который пройдёт через ваш require_admin.
    Поля: sub, role=admin, iss, aud, iat, exp.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(sub),
        "role": "admin",
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=JWT_TTL_DAYS)).timestamp()),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token


def is_admin(message: Message) -> bool:
    uid = message.from_user.id
    uname = (message.from_user.username or "").strip().lstrip("@").lower()
    return (uid in ADMIN_IDS) or (uname in ADMIN_USERNAMES)


def clean_username(raw: str) -> str:
    return raw.strip().lstrip("@")


def validate_role(raw: str) -> str:
    role = raw.strip().lower()
    if role not in ALLOWED_ROLES:
        raise ValueError(f"Unknown role '{raw}'. Allowed: {', '.join(sorted(ALLOWED_ROLES))}")
    return role


# ---------- aiogram ----------
bot = Bot(BOT_TOKEN)
dp = Dispatcher()

# общий HTTP клиент (закрываем при остановке)
_http: Optional[httpx.AsyncClient] = None


async def on_startup():
    global _http
    _http = httpx.AsyncClient(timeout=10)
    log.info("Bot started. API=%s", API_V1)
dp.startup.register(on_startup)

async def on_shutdown():
    global _http
    if _http:
        await _http.aclose()
        _http = None
    log.info("Bot stopped")
dp.shutdown.register(on_shutdown)

@dp.message(CommandStart())
async def cmd_start(message: Message):
    app_url = str(settings.frontend_url or "").rstrip("/")
    if app_url:
        # Кнопка, открывающая MiniApp (WebAppInfo) — работает внутри Telegram
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="Открыть приложение",
                        web_app=WebAppInfo(url=app_url),
                    )
                ]
            ]
        )
    else:
        # Фоллбек — просто текст без кнопки
        kb = None

    await message.answer(
        "Мир вам! Это бот Дуслар 👋\n"
        "Нажмите кнопку ниже, чтобы открыть приложение.",
        reply_markup=kb,
    )

@dp.message(Command("count"))
async def cmd_count(message: Message):
    if not is_admin(message):
        await message.answer("⛔ У вас нет прав на эту команду.")
        return

    token = make_admin_jwt(sub=message.from_user.id)
    url = f"{API_V1}/admin/users/count"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        assert _http is not None
        resp = await _http.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            await message.answer(f"👥 Пользователей в базе: {data.get('count', 0)}")
        else:
            await message.answer(f"❌ Ошибка API: {resp.status_code} {resp.text}")
    except Exception as e:
        await message.answer(f"❌ Ошибка запроса: {e}")

@dp.message(Command("ping"))
async def cmd_ping(message: Message):
    await message.answer("pong")

# ---------- /changerole <username> <role> ----------
@dp.message(Command("changerole"))
async def changerole_spaces(message: Message):
    if not is_admin(message):
        await message.answer("⛔ У вас нет прав на эту команду.")
        return

    parts = (message.text or "").split()
    if len(parts) != 3:
        await message.answer("Использование:\n/changerole <username> <role>")
        return

    _, raw_user, raw_role = parts
    await do_change_role(message, raw_user, raw_role)


# ---------- /changerole/<username>/<role> ----------
@dp.message(F.text.regexp(r"^/changerole/([^/\s]+)/([^/\s]+)$"))
async def changerole_slashes(message: Message):
    if not is_admin(message):
        await message.answer("⛔ У вас нет прав на эту команду.")
        return

    import re

    m = re.match(r"^/changerole/([^/\s]+)/([^/\s]+)$", message.text or "")
    raw_user, raw_role = m.group(1), m.group(2)
    await do_change_role(message, raw_user, raw_role)


async def do_change_role(message: Message, raw_username: str, raw_role: str):
    username = clean_username(raw_username)
    try:
        role = validate_role(raw_role)
    except ValueError as e:
        await message.answer(str(e))
        return

    token = make_admin_jwt(sub=message.from_user.id)

    url = f"{API_V1}/admin/users/by-username/{username}/role"
    payload = {"role": role}
    headers = {"Authorization": f"Bearer {token}"}

    try:
        assert _http is not None
        resp = await _http.patch(url, json=payload, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            await message.answer(
                f"✅ Роль изменена: @{data.get('username','?')} → {data.get('role','?')}"
            )
        elif resp.status_code == 404:
            await message.answer("Пользователь не найден")
        else:
            await message.answer(f"❌ Ошибка: {resp.status_code} {resp.text}")
    except Exception as e:
        await message.answer(f"❌ Ошибка запроса: {e}")
        



async def main():
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        pass
