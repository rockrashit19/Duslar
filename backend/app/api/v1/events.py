from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, literal, exists, and_, or_, text, case
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import re

from app.api.deps import get_db, get_current_user
from app.models import (
    User,
    Event, 
    EventStatus,
    EventParticipant,
    ParticipationStatus,
    Gender,
    UserGender,
    UserRole
)
from app.schemas import (
    EventCreate,
    EventCardOut,
    EventOut,
    VisibilityUpdateIn,
    VisibilityOut,
    ParticipantOut,
)

router = APIRouter()

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _lock_event(db: Session, event_id: int) -> None:
    db.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": event_id})
    
def _norm(dt: Optional[datetime]) -> Optional[datetime]:
    if not dt:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

def _norm_city(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    return " ".join(s.split())

def _query_tokens(s: Optional[str]) -> list[str]:
    if not s:
        return []
    term = " ".join(s.split())
    return [t for t in term.split(" ") if t]

def _like_token(t: str) -> str:
    t = t.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{t}%"

@router.get("/events", response_model=list[EventCardOut])
def list_events(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    city: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None, alias="from"),
    date_to: Optional[datetime] = Query(None, alias="to"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    gender: Optional[str] = Query(None, regex="^(male|female|all)$"),
    q: Optional[str] = Query(None, min_length=1, max_length=120),
):
    conds = []
    df = _norm(date_from)
    dt = _norm(date_to)
    city_norm = _norm_city(city)
    if city_norm:
        conds.append(func.lower(func.trim(Event.city)) == city_norm.lower())
    if df:
        conds.append(Event.date_time >= df)
    else:
        conds.append(Event.date_time >= _now_utc())
    if dt:
        conds.append(Event.date_time <= dt)

    if df and dt and df > dt:
        raise HTTPException(status_code=400, detail="'from' must be <= 'to'")

    if gender:
        conds.append(Event.gender_restriction == gender)
        
    tokens = _query_tokens(q)
    for t in tokens:
        conds.append(Event.title.ilike(_like_token(t), escape="\\"))

    ep = EventParticipant
    count_subq = (
        select(func.count())
        .where(and_(ep.event_id == Event.id, ep.status == ParticipationStatus.joined))
        .correlate(Event)
        .scalar_subquery()
    )
    is_joined_subq = (
        select(literal(True))
        .where(and_(ep.event_id == Event.id, ep.user_id == current.id, ep.status == ParticipationStatus.joined))
        .correlate(Event)
        .exists()
    )
    
    eff_status = case(
        (Event.date_time < func.now(), literal("past")),
        else_=Event.status
    ).label("status")

    stmt = (
        select(
            Event.id, Event.title, Event.location, Event.city, Event.date_time,
            Event.gender_restriction, Event.creator_id,
            Event.photo_url,
            eff_status, Event.max_participants,
            count_subq.label("participants_count"),
            is_joined_subq.label("is_user_joined"),
        )
        .where(and_(*conds))
        .order_by(Event.date_time.asc())
        .limit(limit)
        .offset(offset)
    )
    rows = db.execute(stmt).all()
    return [
        EventCardOut(
            id=r.id, title=r.title, location=r.location, city=r.city, date_time=r.date_time,
            gender_restriction=r.gender_restriction, creator_id=r.creator_id,
            participants_count=r.participants_count, is_user_joined=bool(r.is_user_joined),
            photo_url=r.photo_url,
            status=r.status, max_participants=r.max_participants,
        )
        for r in rows
    ]



@router.get("/events/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    ep = EventParticipant
    count_subq = (
        select(func.count())
        .where(and_(ep.event_id == Event.id, ep.status == ParticipationStatus.joined))
        .correlate(Event)
        .scalar_subquery()
    )
    is_joined_subq = (
        select(literal(True))
        .where(and_(ep.event_id == Event.id, ep.user_id == current.id, ep.status == ParticipationStatus.joined))
        .correlate(Event).exists()
    )
    
    eff_status = case(
        (Event.date_time < func.now(), literal("past")),
        else_=Event.status
    ).label("status")

    stmt = select(
        Event.id, Event.title, Event.description, Event.location, Event.city, Event.date_time,
        Event.gender_restriction, Event.max_participants, Event.creator_id,
        Event.photo_url,
        count_subq.label("participants_count"),
        is_joined_subq.label("is_user_joined"),
        eff_status,
    ).where(Event.id == event_id)

    row = db.execute(stmt).first()
    if not row:
        raise HTTPException(status_code=404, detail="event not found")

    return EventOut(
        id=row.id, title=row.title, description=row.description, location=row.location, city=row.city,
        date_time=row.date_time, gender_restriction=row.gender_restriction, max_participants=row.max_participants,
        status=row.status, creator_id=row.creator_id,
        participants_count=row.participants_count, is_user_joined=bool(row.is_user_joined),
        photo_url=row.photo_url,
    )


@router.post("/events", response_model=EventOut, status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role not in (UserRole.organizer, UserRole.admin):
        raise HTTPException(status_code=403, detail="")
    e = Event(
        title=payload.title,
        description=payload.description,
        location=payload.location,
        city=payload.city,
        date_time=payload.date_time,
        gender_restriction=payload.gender_restriction,        
        max_participants=payload.max_participants,
        photo_url=payload.photo_url,
        creator_id=current.id,
    )
    db.add(e)
    db.commit()
    db.refresh(e)

    ep = EventParticipant
    participants_count = db.scalar(
        select(func.count()).select_from(ep).where(
            and_(ep.event_id == e.id, ep.status == ParticipationStatus.joined)
        )
    ) or 0
    is_user_joined = bool(db.scalar(select(
        exists().where(
            and_(ep.event_id == e.id, ep.user_id == current.id, ep.status == ParticipationStatus.joined)
        )
    )))

    return EventOut(
        id=e.id, title=e.title, description=e.description, location=e.location, city=e.city,
        date_time=e.date_time, gender_restriction=e.gender_restriction, max_participants=e.max_participants,
        status=e.status, creator_id=e.creator_id,
        participants_count=participants_count, is_user_joined=bool(is_user_joined),
        photo_url=e.photo_url,
    )

@router.post("/events/{event_id}/join")
def join_event(
    event_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user)
):
    with db.begin_nested():
        _lock_event(db, event_id)
        
        ev = db.get(Event, event_id)
        if not ev:
            raise HTTPException(status_code=404, detail="event not found")
        if ev.status != EventStatus.open or ev.date_time < _now_utc():
            raise HTTPException(status_code=403, detail="event is not joinable")
        
        ep = EventParticipant
        joined_cnt = db.scalar(
            select(func.count())
            .select_from(ep)
            .where(and_(ep.event_id == event_id, ep.status == ParticipationStatus.joined))
        ) or 0
        
        if ev.max_participants is not None and joined_cnt >= ev.max_participants:
            raise HTTPException(status_code=409, detail="event is full")
        
        if ev.gender_restriction != Gender.all:
            if current.gender == UserGender.unknown:
                raise HTTPException(status_code=409, detail="Заполните свой пол в профиле")
            if ev.gender_restriction.value != current.gender.value:
                if ev.gender_restriction.value == "female":
                    raise HTTPException(status_code=403, detail="Мероприятие для девушек!")
                else:
                    raise HTTPException(status_code=403, detail="Мероприятие для мужчин!")
        
        existing = db.execute(
            select(ep)
            .where(and_(ep.event_id == event_id, ep.user_id == current.id))
            .with_for_update()
        ).scalar_one_or_none()
        
        try:
            if existing is None:
                rec = EventParticipant(
                    event_id=event_id,
                    user_id=current.id,
                    status=ParticipationStatus.joined,
                    is_visible=True,
                )
                db.add(rec)
            else:
                if existing.status != ParticipationStatus.joined:
                    existing.status = ParticipationStatus.joined
                    existing.is_visible = True
                    existing.joined_at = _now_utc()
        except IntegrityError:
            pass
    db.commit()
    return {"event_id": event_id, "joined": True}

@router.post("/events/{event_id}/leave")
def leave_event(
    event_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    with db.begin_nested():
        _lock_event(db, event_id)
        
        ev = db.get(Event, event_id)
        if not ev:
            raise HTTPException(status_code=404, detail="event not found")
        
        ep = EventParticipant
        existing = db.execute(
            select(ep)
            .where(and_(ep.event_id == event_id, ep.user_id == current.id))
            .with_for_update()
        ).scalar_one_or_none()
        
        if existing is None:
            return {"event_id": event_id, "left": True}
        
        if existing.status == ParticipationStatus.joined:
            existing.status = ParticipationStatus.left
    
    db.commit()    
    return {"event_id": event_id, "left": True}

@router.post("/events/{event_id}/visibility", response_model=VisibilityOut)
def set_visibility(
    event_id: int, 
    payload: VisibilityUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    try:
        with db.begin_nested():
            _lock_event(db, event_id)
            
            ev = db.get(Event, event_id)
            if not ev:
                raise HTTPException(status_code=404, detail="event not found")
            
            ep = EventParticipant
            rec = db.execute(
                select(ep)
                .where(and_(ep.event_id == event_id, ep.user_id == current.id))
                .with_for_update()
            ).scalar_one_or_none()
            
            if rec is None:
                raise HTTPException(status_code=409, detail="not joined")
            
            if rec.status != ParticipationStatus.joined:
                raise HTTPException(status_code=409, detail="not joined")
            
            if rec.is_visible != payload.is_visible:
                rec.is_visible = payload.is_visible
        
        db.commit()
    except:
        db.rollback()
        raise
    
    return VisibilityOut(
        event_id=event_id,
        user_id=current.id,
        is_visible=rec.is_visible,
        status=rec.status.value,
    )

@router.get("/events/{event_id}/participants", response_model=list[ParticipantOut])
def list_participants(
    event_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="event not found")
    
    ep = EventParticipant
    
    stmt = (
        select(
            ep.user_id.label("id"),
            User.username,
            User.full_name, 
            ep.is_visible,
            User.avatar_url,
        )
        .join(User, User.id == ep.user_id)
        .where(
            and_(
                ep.event_id == event_id,
                ep.status == ParticipationStatus.joined
            )
        )
        .order_by(ep.joined_at.asc(), ep.user_id.asc())
        .limit(limit)
        .offset(offset)
    )
    
    rows = db.execute(stmt).all()
    
    result: list[ParticipantOut] = []
    for r in rows:
        if not r.is_visible and r.id != current.id:
            result.append(ParticipantOut(
                id=r.id,
                username=None,
                full_name="Скрытый участник",
                avatar_url=None,
                is_visible=False,
            ))
        else:
            result.append(ParticipantOut(
                id=r.id,
                username=r.username,
                full_name=r.full_name,
                avatar_url=r.avatar_url,
                is_visible=r.is_visible,
            ))
    return result