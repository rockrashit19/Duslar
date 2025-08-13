import hashlib, hmac, json
from urllib.parse import parse_qsl, unquote_plus
from datetime import datetime, timezone, timedelta

class InitDataError(Exception):
    pass

def _build_dcs(pairs: list[tuple[str, str]]) -> str:
    filtered = [(k, v) for k, v in pairs if k!="hash"]
    filtered.sort(key=lambda kv: kv[0])
    return "\n".join(f"{k}={v}" for k, v in filtered)

def _derive_secret_key(bot_token: str) -> bytes:
    return hmac.new(b"WebAppData", bot_token.encode("utf_8"), hashlib.sha256).digest()

def _hmac_hex(key: bytes, msg: str) -> str:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).hexdigest()

def validate_init_data(init_data: str, bot_token: str, max_age_hours: int = 24, allow_future_skew: timedelta = timedelta(seconds=120)) -> dict:
    if not init_data:
        raise InitDataError("empty init_data")
    
    pairs = parse_qsl(init_data, keep_blank_values=True)
    got_hash = next((v for k, v in pairs if k == "hash"), None)
    if not got_hash: 
        raise InitDataError("hash missing")
    
    dcs = _build_dcs(pairs)
    calc = _hmac_hex(_derive_secret_key(bot_token), dcs)
    if not hmac.compare_digest(calc, got_hash):
        raise InitDataError("invalid hash")
    
    raw_auth = next((v for k, v in pairs if k == "auth_date"), None)
    if not raw_auth:
        raise InitDataError("auth_date missing")
    try:
        auth_date = datetime.fromtimestamp(int(raw_auth), tz=timezone.utc)
    except Exception:
        raise InitDataError("bad auth_date")
    
    now = datetime.now(timezone.utc)
    
    if auth_date - now > allow_future_skew:
        raise InitDataError("auth_date from future")
    
    if now - auth_date > timedelta(hours=max_age_hours):
        raise InitDataError("stale auth_date")
    
    user_json = next((v for k, v in pairs if k =="user"), None)
    if not user_json:
        raise InitDataError("user missing")
    try:
        user = json.loads(unquote_plus(user_json))
    except Exception: 
        raise InitDataError("bad user json")
    
    if "id" not in user:
        raise InitDataError("user.id missing")
    
    return user