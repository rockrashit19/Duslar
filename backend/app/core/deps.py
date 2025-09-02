from fastapi import Header, HTTPException
from app.core.security import decode_admin_token, TokenData

def require_admin(authorization: str = Header(default="")) -> TokenData:
    """
    Ждём заголовок Authorization: Bearer <token>
    """
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(None, 1)[1]
    return decode_admin_token(token)
