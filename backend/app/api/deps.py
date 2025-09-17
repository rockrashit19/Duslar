from typing import Any, Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.db.session import SessionLocal
from app.core.config import settings
from app.models.user import User, UserRole

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def assert_can_manage_roles(current: User) -> None:
    if current.role == UserRole.admin:
        return
    if current.id in settings.role_managers:
        return
    raise HTTPException(status_code=403, detail="forbidden")

def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db), # type: ignore
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing bearer token")
    token = authorization.split(" ", 1)[1]

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.jwt_secret.get_secret_value(),
            algorithms=["HS256"],
        )
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")

    sub = payload.get("sub")
    if not isinstance(sub, (str, int)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    try:
        uid = int(sub)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")

    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user not found")
    return user