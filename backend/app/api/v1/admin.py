from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
import logging

from app.api.deps import get_db            
from app.core.config import settings
from app.core.deps import require_admin  
from app.models import User               

log = logging.getLogger("admin-users")
router = APIRouter(prefix="/admin/users", tags=["admin"])

@router.patch("/by-username/{username}/role")
def change_role(username: str, payload: dict, db: Session = Depends(get_db), admin=Depends(require_admin)):
    new_role = (payload.get("role") or "").lower().strip()
    if new_role not in {"user", "organizer", "admin"}:
        raise HTTPException(400, detail="Неправильная роль \n Возможные роли: user, organizer, admin")

    stmt = select(User).where(User.username.ilike(username))
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(404, detail="not found")

    before = getattr(user, "role", None)
    setattr(user, "role", new_role)
    db.add(user)
    db.commit()          
    db.refresh(user)     

    log.info("role change: %s (%s) %s -> %s by admin=%s",
             user.username, user.id, before, user.role, getattr(admin, "sub", "?"))

    return {"id": user.id, "username": user.username, "role": user.role}

@router.get("/count")
def users_count(
    db: Session = Depends(get_db),
    _ = Depends(require_admin),
):
    total = db.scalar(select(func.count()).select_from(User)) or 0
    return {"count": int(total)}
