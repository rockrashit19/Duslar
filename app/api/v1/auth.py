from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.schemas.auth import TelegramInintIn, TokenOut, UserOut
from app.services.telegram_auth import validate_init_data, InitDataError

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@router.post("/auth/telegram/init", response_model=TokenOut)
def telegram_init(payload: TelegramInintIn, db: Session = Depends(get_db)):
    bot_token = settings.telegram_bot_token.get_secret_value()
    try:
        user_data = validate_init_data(payload.init_data, bot_token)
    except InitDataError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    
    try:
        tg_id = int(user_data["id"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=400, detail="bad user.id")
    username = user_data.get("username")
    first_name = user_data.get("first_name") or ""
    last_name = user_data.get("last_name") or ""
    full_name = (first_name + " " + last_name).strip() or username or str(tg_id)
    photo_url = (user_data.get("photo_url") or "").strip() or None
    
    user = db.get(User, tg_id)
    if user is None:
        user = User(id=tg_id, username=username, full_name=full_name, role=UserRole.user, avatar_url=photo_url)
        db.add(user)
    else:
        user.username = username
        user.full_name = full_name
        if photo_url and user.avatar_url != photo_url:  
            user.avatar_url = photo_url
    
    db.commit(); db.refresh(user)
    
    token = create_access_token(sub=str(user.id), role=user.role.value)
    return TokenOut(
        token=token,
        user=UserOut(
            id=user.id, username=username, full_name=user.full_name,
            city=user.city, role=user.role.value, avatar_url=user.avatar_url
        ),
    )