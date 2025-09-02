import os
from typing import Optional
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.core.config import settings
from fastapi import HTTPException, status

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

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ISSUER = os.getenv("JWT_ISSUER", "duslar-bot")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "admin")

class TokenData:
    def __init__(self, sub: str, role: str):
        self.sub = sub
        self.role = role
        
def decode_admin_token(token: str) -> TokenData:
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT secret not configured")

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            audience=JWT_AUDIENCE,
            options={"require_aud": True, "require_exp": True},
        )
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")

    iss = payload.get("iss")
    role = payload.get("role")
    sub = payload.get("sub")
    if iss != JWT_ISSUER or role != "admin" or not sub:
        raise HTTPException(status_code=401, detail="Invalid admin claims")

    return TokenData(sub=str(sub), role=role)