# bot.py
# aiogram v3.x
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from jose import jwt

from aiogram import Bot, Dispatcher, Router, F
from aiogram.filters import Command
from aiogram.types import (
    Message,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
)

# Берём конфиг из вашего FastAPI-проекта
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("duslar-bot")

router = Router()

# ─────────────────────────────────────────────────────────────────────────────
# Конфигурация JWT для админов (должна совпадать с проверкой на бэкенде!)
JWT_SECRET: str = settings.jwt_secret.get_secret_value()
JWT_ALGO = "HS256"
JWT_ISSUER = "duslar-bot"
JWT_AUDIENCE = "admin"
JWT_TTL_HOURS = 24 * 7  # 7 дней

BACKEND_BASE = (settings.backend_base_url or "").rstrip("/")
API_BASE = f"{BACKEND_BASE}/api/v1" if BACKEND_BASE else None

# Админы по Telegram user_id (из .env: ROLE_MANAGERS=...)
ADMIN_IDS = set(int(x) for x in (settings.role_managers or []))


def is_admin(tg_user_id: Optional[int]) -> bool:
    return bool(tg_user_id and tg_user_id in ADMIN_IDS)


def create_admin_jwt(tg_user_id: int, tg_username: Optional[str]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(tg_user_id),
        "username": tg_username or "",
        "role": "admin",
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_TTL_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def call_set_role_by_username(username: str, role: str, admin_token: str) -> tuple[bool, str]:
    """
    PATCH /api/v1/admin/users/by-username/{username}/role  Authorization: Bearer <token>
    payload: {"role": "<role>"}
    """
    if not API_BASE:
        return False, "BACKEND_BASE_URL не задан в конфиге"

    url = f"{API_BASE}/admin/users/by-username/{username.lstrip('@')}/role"
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"role": role}

    timeout = httpx.Timeout(10.0, connect=5.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            r = await client.patch(url, json=payload, headers=headers)
        except httpx.HTTPError as e:
            return False, f"HTTP error: {e!s}"

    if r.status_code == 200:
        return True, "Роль успешно обновлена"
    if r.status_code == 404:
        return False, "Пользователь не найден"
    if r.status_code == 401:
        return False, "Не авторизовано (проверь JWT)"
    return False, f"Ошибка API {r.status_code}: {r.text}"


# ─────────────────────────────────────────────────────────────────────────────
# Команды

@router.message(Command("start"))
async def cmd_start(message: Message):
    """
    Старт: приветствие + кнопка открытия мини-приложения.
    """
    url = str(settings.frontend_url) if settings.frontend_url else "https://app.minemduslar.ru"
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть Дуслар",
                    web_app=WebAppInfo(url=url),  # откроет WebApp внутри Telegram
                )
            ]
        ]
    )
    await message.answer(
        "Ассаламу алейкум! Это бот Дуслар.\nНажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=kb,
    )


@router.message(Command("getadminjwt"))
async def cmd_getadminjwt(message: Message):
    """
    Выдать себе админ-JWT (только для Telegram ID из ROLE_MANAGERS).
    """
    user = message.from_user
    if not user:
        await message.answer("Не удалось определить пользователя.")
        return

    if not is_admin(user.id):
        await message.answer("Доступ запрещён. Вы не админ.")
        return

    token = create_admin_jwt(user.id, user.username)
    await message.answer(
        "Ваш админ-токен (действует ограниченное время):\n"
        f"`{token}`\n\n"
        "Используйте его в заголовке:\n"
        "`Authorization: Bearer <ваш_токен>`",
        parse_mode="Markdown",
    )


@router.message(Command("changerole"))
async def cmd_changerole(message: Message):
    """
    Смена роли по username (только админам).
    Поддерживаем форматы:
      /changerole @username admin
      /changerole username admin
      /changerole/@username/admin
    """
    user = message.from_user
    if not user:
        await message.answer("Не удалось определить пользователя.")
        return

    if not is_admin(user.id):
        await message.answer("Доступ запрещён. Вы не админ.")
        return

    text = (message.text or "").strip()
    args = text.split(maxsplit=1)
    arg_str = args[1] if len(args) > 1 else ""

    username: Optional[str] = None
    role: Optional[str] = None

    if arg_str:
        if " " in arg_str:
            # Формат с пробелом: "/changerole @user admin"
            p = [x for x in arg_str.split(" ") if x]
            if len(p) >= 2:
                username, role = p[0], p[1]
        else:
            # Формат со слэшами: "/changerole/@user/admin"
            p = [x for x in arg_str.split("/") if x and x.lower() != "changerole"]
            if len(p) >= 2:
                username, role = p[0], p[1]

    if not username or not role:
        await message.answer(
            "Неверный формат.\n"
            "Примеры:\n"
            "• `/changerole @username admin`\n"
            "• `/changerole username manager`\n"
            "• `/changerole/@username/admin`",
            parse_mode="Markdown",
        )
        return

    admin_token = create_admin_jwt(user.id, user.username)
    ok, info = await call_set_role_by_username(username, role.lower(), admin_token)
    await message.answer(info if ok else f"Не удалось изменить роль: {info}")


# ─────────────────────────────────────────────────────────────────────────────
# Точка входа

async def main():
    token = settings.telegram_bot_token.get_secret_value()
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN пуст. Проверь .env")

    if not BACKEND_BASE:
        log.warning("BACKEND_BASE_URL не задан — команды, обращающиеся к API, работать не будут.")

    bot = Bot(token=token)
    dp = Dispatcher()
    dp.include_router(router)

    # (необязательно) удобные команды в списке бота
    try:
        await bot.set_my_commands([
            ("start", "Открыть мини-приложение"),
            ("getadminjwt", "Выдать админ-JWT"),
            ("changerole", "Сменить роль: /changerole @username role"),
        ])
    except Exception:
        pass

    log.info("Bot started")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
