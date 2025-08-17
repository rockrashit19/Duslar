from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.users import GenderUpdateIn, MeOut

router = APIRouter()

@router.get("/me", response_model=MeOut)
def get_me(current: User = Depends(get_current_user)) -> MeOut:
    return MeOut(
        id=current.id,
        username=current.username,
        full_name=current.full_name,
        city=current.city,
        role=current.role.value,
        gender=current.gender,
    )

@router.post("/me/gender", response_model=MeOut)
def set_gender(
    payload: GenderUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user)
) -> MeOut:
    current.gender = payload.gender
    db.add(current)
    db.commit()
    db.refresh(current)
    return MeOut(
        id=current.id,
        username=current.username,
        full_name=current.full_name,
        city=current.city,
        role=current.role.value,
        gender=current.gender,
    )