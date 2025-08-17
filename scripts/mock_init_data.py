# scripts/mock_init_data.py
import os, json, time, hashlib, hmac
from urllib.parse import quote_plus

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
assert BOT_TOKEN, "TELEGRAM_BOT_TOKEN not set"

def derive_secret(token: str) -> bytes:
    return hmac.new(b"WebAppData", token.encode("utf-8"), hashlib.sha256).digest()

def hmac_hex(key: bytes, msg: str) -> str:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).hexdigest()

def build_init_data(user: dict, auth_date: int) -> str:
    # 1) Формируем НЕкодированный JSON пользователя (без пробелов)
    user_json = json.dumps(user, separators=(",", ":"), ensure_ascii=False)

    # 2) Строим data_check_string по ДЕКОДИРОВАННЫМ значениям
    #    (как у тебя на бэке после parse_qsl)
    pairs_for_dcs = [("auth_date", str(auth_date)), ("user", user_json)]
    dcs = "\n".join(f"{k}={v}" for k, v in sorted(pairs_for_dcs, key=lambda kv: kv[0]))

    # 3) Считаем hash
    calc = hmac_hex(derive_secret(BOT_TOKEN), dcs) # type: ignore

    # 4) Собираем init_data для отправки: ТУТ user уже URL-кодируем
    user_enc = quote_plus(user_json)
    return f"auth_date={auth_date}&user={user_enc}&hash={calc}"

if __name__ == "__main__":
    now = int(time.time())
    mock_user = {"id": 123456788, "username": "testuser", "first_name": "Test", "last_name": "User"}
    print(build_init_data(mock_user, now))
