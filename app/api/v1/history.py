from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, aliased

from app.api.deps import get_current_user, get_db
from app.models import (
    Event,
    EventParticipant, 
    ParticipationStatus,
    User,
)
from app.schemas.history import PersonHistoryOut

router = APIRouter()

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _norm(dt: Optional[datetime]) -> Optional[datetime]:
    if not dt:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

@router.get("/history/people", response_model=list[PersonHistoryOut])
def my_people_history(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    city: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None, alias="from"),
    date_to: Optional[datetime] = Query(None, alias="to"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    df = _norm(date_from)
    dt = _norm(date_to)
    if df and dt and df > dt:
        raise HTTPException(status_code=400, detail="'from' must be <= 'to'")
    
    e = Event
    ep1 = aliased(EventParticipant)
    ep2 = aliased(EventParticipant)
    
    conds = [
        ep1.user_id == current.id,
        ep1.status == ParticipationStatus.joined,
        ep1.event_id == e.id,
        e.date_time < _now_utc(),
        ep2.event_id == ep1.event_id,
        ep2.user_id != current.id,
        ep2.status == ParticipationStatus.joined,
        ep2.is_visible.is_(True),
    ]
    if city:
        conds.append(func.lower(e.city) == func.lower(city))
    if df:
        conds.append(e.date_time >= df)
    if dt:
        conds.append(e.date_time <= dt)
        
    stmt = (
        select(
            User.id.label("id"),
            User.username,
            User.full_name,
            func.count(func.distinct(e.id)).label("events_together"),
            func.max(e.date_time).label("last_seen_at"),
        )
        .select_from(ep1)  
        .join(e, e.id == ep1.event_id)
        .join(ep2, ep2.event_id == ep1.event_id)
        .join(User, User.id == ep2.user_id)
        .where(and_(*conds))
        .group_by(User.id, User.username, User.full_name)
        .order_by(func.max(e.date_time).desc(),
                func.count(func.distinct(e.id)).desc(),
                User.id.asc())
        .limit(limit)
        .offset(offset)
    )
    
    rows = db.execute(stmt).all()
    
    return [
        PersonHistoryOut(
            id=r.id,
            username=r.username,
            full_name=r.full_name,
            events_together=r.events_together,
            last_seen_at=r.last_seen_at,
        )
        for r in rows
    ]