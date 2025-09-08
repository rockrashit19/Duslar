from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, literal
from sqlalchemy.orm import Session, aliased

from app.api.deps import get_db, get_current_user, assert_can_manage_roles
from app.models.user import User, UserGender, UserRole
from app.models.event_participant import EventParticipant, ParticipationStatus
from app.models.event import Event
from app.schemas.users import GenderUpdateIn, MeOut, UserUpdateIn, UserPublicOut, CityUpdateIn, RoleUpdateIn
from app.schemas.events import EventCardOut

router = APIRouter()

def _tg_avatar(username: Optional[str]) -> Optional[str]:
    return f"https://t.me/i/userpic/320/{username}.jpg" if username else None

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

@router.get("/me", response_model=MeOut)
def get_me(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user)
) -> MeOut:
    ep = EventParticipant
    total = db.scalar(
        select(func.count()).select_from(ep).where(
            and_(ep.user_id == current.id, ep.status == ParticipationStatus.joined)
        )
    ) or 0
    return MeOut(
        id=current.id,
        username=current.username,
        full_name=current.full_name,
        city=current.city,
        role=current.role.value,
        gender=current.gender,
        avatar_url=_tg_avatar(current.username),
        events_total=total,
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
    return get_me(db, current)

@router.post("/me/city", response_model=MeOut)
def set_city(
    payload: CityUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user)
) -> MeOut:
    current.city = payload.city
    db.add(current)
    db.commit()
    db.refresh(current)
    return get_me(db, current)

@router.put("/users/me", response_model=MeOut)
def update_me(
    payload: UserUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user)
) -> MeOut:
    changed = False
    if payload.city is not None:
        current.city = (payload.city or "").strip() or None
        changed = True
    if payload.gender is not None:
        if payload.gender not in (UserGender.male, UserGender.female, UserGender.unknown):
            raise HTTPException(status_code=400, detail="invalid gender")
        current.gender = payload.gender
        changed = True
    if changed:
        db.add(current)
        db.commit()
        db.refresh(current)
    return get_me(db, current)

@router.get("/users/me/events", response_model=list[EventCardOut])
def my_events(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    status: Optional[str] = Query(None, regex="^(past|future|all)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    ep = EventParticipant

    sub_count = (
        select(func.count())
        .where(and_(ep.event_id == Event.id, ep.status == ParticipationStatus.joined))
        .correlate(Event).scalar_subquery()
    )
    is_joined = (
        select(literal(True))
        .where(and_(ep.event_id == Event.id, ep.user_id == current.id, ep.status == ParticipationStatus.joined))
        .correlate(Event).exists()
    )

    stmt = (
        select(
            Event.id, Event.title, Event.location, Event.city, Event.date_time,
            Event.gender_restriction, Event.creator_id, Event.photo_url,
            Event.status, Event.max_participants,
            sub_count.label("participants_count"),
            is_joined.label("is_user_joined"),
        )
        .join(ep, ep.event_id == Event.id)
        .where(and_(ep.user_id == current.id, ep.status == ParticipationStatus.joined))
    )

    now = datetime.now(timezone.utc)
    if status == "past":
        stmt = stmt.where(Event.date_time < now)
    elif status == "future":
        stmt = stmt.where(Event.date_time >= now)

    stmt = stmt.order_by(Event.date_time.desc()).limit(limit).offset(offset)

    rows = db.execute(stmt).all()
    return [
        EventCardOut(
            id=r.id, title=r.title, location=r.location, city=r.city, date_time=r.date_time,
            gender_restriction=r.gender_restriction, creator_id=r.creator_id,
            participants_count=r.participants_count, is_user_joined=bool(r.is_user_joined),
            photo_url=r.photo_url, status=r.status, max_participants=r.max_participants,
        )
        for r in rows
    ]

@router.get("/users/{user_id}", response_model=UserPublicOut)
def get_public_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="user not found")
    if target.id == current.id:
        pass

    ep1 = aliased(EventParticipant)
    ep2 = aliased(EventParticipant)

    events_together = db.scalar(
        select(func.count(func.distinct(Event.id)))
        .join(ep1, ep1.event_id == Event.id)
        .join(ep2, ep2.event_id == Event.id)
        .where(
            and_(
                ep1.user_id == current.id,
                ep1.status == ParticipationStatus.joined,
                ep1.is_visible == True,  
                ep2.user_id == target.id,
                ep2.status == ParticipationStatus.joined,
                ep2.is_visible == True,  
                Event.date_time < _now_utc(),  
            )
        )
    ) or 0

    return UserPublicOut(
        id=target.id,
        username=target.username,
        full_name=target.full_name,
        avatar_url=target.avatar_url,
        city=target.city,
        events_together=events_together,
    )
    

@router.patch("/users/{user_id}/role", response_model=MeOut)
def update_role(
    user_id: int,
    payload: RoleUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> MeOut:
    assert_can_manage_roles(current)

    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="user not found")

    # Полезное правило: не давать «не-админам» поднимать кого-то в admin
    if current.role != UserRole.admin and payload.role == "admin":
        raise HTTPException(status_code=403, detail="only admin can assign admin")

    target.role = UserRole(payload.role)
    db.add(target)
    db.commit()
    db.refresh(target)
    
    ep = EventParticipant
    total = db.scalar(
        select(func.count()).select_from(ep).where(
            and_(ep.user_id == current.id, ep.status == ParticipationStatus.joined)
        )
    ) or 0
    
    return MeOut(
        id=current.id,
        username=current.username,
        full_name=current.full_name,
        city=current.city,
        role=current.role.value,
        gender=current.gender,
        avatar_url=_tg_avatar(current.username),
        events_total=total,
    )