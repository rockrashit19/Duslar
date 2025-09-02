# app/api/v1/admin.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, constr
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.deps import require_admin           
from app.db.session import get_session            

router = APIRouter(prefix="/admin", tags=["admin"])

ALLOWED_ROLES = {"user", "organizer", "admin"}      

class RoleIn(BaseModel):
    role: constr(strip_whitespace=True, min_length=1)

@router.patch("/users/{user_id}/role")
def set_user_role_by_id(
    user_id: int,
    payload: RoleIn,
    _ = Depends(require_admin),
    db: Session = Depends(get_session),
):
    role = payload.role.lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(400, f"Неправильная роль: {role} \n Доступные роли: user, organizer, admin")

    row = db.execute(
        text("UPDATE users SET role=:role WHERE id=:uid RETURNING id, username"),
        {"role": role, "uid": user_id},
    ).first()

    if not row:
        raise HTTPException(404, "User not found")

    return {"ok": True, "id": row.id, "username": row.username, "role": role}

@router.patch("/users/by-username/{username}/role")
def set_user_role_by_username(
    username: str,
    payload: RoleIn,
    _ = Depends(require_admin),
    db: Session = Depends(get_session),
):
    """
    Меняем роль по username (без @). Username сравниваем case-insensitive.
    Если в БД колонка не `username`, а, например, `telegram_username`,
    смени имя колонки в SQL ниже.
    """
    role = payload.role.lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(400, f"Role not allowed: {role}")

    uname = username.lstrip("@")

    row = db.execute(
        text("""
            UPDATE users
            SET role = :role
            WHERE lower(username) = lower(:uname)
            RETURNING id, username
        """),
        {"role": role, "uname": uname},
    ).first()

    if not row:
        # Если у тебя в таблице колонка называется НЕ `username`, раскомментируй этот блок и закомментируй UPDATE выше:
        #
        # row = db.execute(
        #     text("""
        #         UPDATE users
        #         SET role = :role
        #         WHERE lower(telegram_username) = lower(:uname)
        #         RETURNING id, telegram_username AS username
        #     """),
        #     {"role": role, "uname": uname},
        # ).first()
        #
        # if not row:
        raise HTTPException(404, "User not found")

    return {"ok": True, "id": row.id, "username": row.username, "role": role}
