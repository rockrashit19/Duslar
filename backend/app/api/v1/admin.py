# --- app/api/v1/admin_users.py ---

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, constr
from sqlalchemy.orm import Session
from sqlalchemy import func, update

from app.core.security import require_admin
from app.db.session import SessionLocal
from app.models.user import User  # проверьте путь к модели

router = APIRouter(prefix="/admin/users", tags=["admin:users"])

class RoleUpdate(BaseModel):
    role: constr(strip_whitespace=True, min_length=3, max_length=32)

def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.patch("/by-username/{username}/role", dependencies=[Depends(require_admin)])
def set_role_by_username(username: str, payload: RoleUpdate, db: Session = Depends(get_session)):
    uname = username.lstrip("@").strip()
    if not uname:
        raise HTTPException(status_code=400, detail="empty username")

    # 1) найдём пользователя (для ответа и валидаций)
    user = (
        db.query(User)
        .filter(func.lower(User.username) == uname.lower())
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2) жёсткий UPDATE — чтобы точно дошло до БД
    stmt = (
        update(User)
        .where(func.lower(User.username) == uname.lower())
        .values(role=payload.role)
    )
    res = db.execute(stmt)
    db.commit()

    if res.rowcount == 0:
        # Такое бывает, если поле называется иначе (например, user_role)
        raise HTTPException(status_code=500, detail="Update did not modify any row")

    # перечитаем пользователя, чтобы вернуть актуальные данные
    db.refresh(user)
    return {"ok": True, "id": user.id, "username": user.username, "role": user.role}
