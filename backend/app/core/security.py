from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings

ALGO = "HS256"
ACCESS_TTL_DAYS = 14

def create_access_token(sub: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=ACCESS_TTL_DAYS)).timestamp()),
    }
    secret = settings.jwt_secret.get_secret_value()
    return jwt.encode(payload, secret, algorithm=ALGO)