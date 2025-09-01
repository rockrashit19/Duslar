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
from app.schemas.history import PeopleHistoryItemOut

router = APIRouter()

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

@router.get("/history/people", response_model=list[PeopleHistoryItemOut])
def my_people_history(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    ep1 = aliased(EventParticipant)  # я
    ep2 = aliased(EventParticipant)  # другой
    u2  = aliased(User)

    stmt = (
        select(
            u2.id.label("id"),
            u2.full_name.label("full_name"),
            u2.username.label("username"),
            u2.city.label("city"),
            u2.avatar_url.label("avatar_url"),
            func.count(func.distinct(Event.id)).label("events_together"),
            func.max(Event.date_time).label("last_seen_at"),
        )
        .select_from(ep1)
        .join(Event, Event.id == ep1.event_id)
        .join(ep2, and_(ep2.event_id == ep1.event_id, ep2.user_id != ep1.user_id))
        .join(u2, u2.id == ep2.user_id)
        .where(
            and_(
                ep1.user_id == current.id,
                ep1.status == ParticipationStatus.joined,
                ep2.status == ParticipationStatus.joined,
                Event.date_time < _now_utc(),  # только прошедшие
            )
        )
        .group_by(u2.id, u2.full_name, u2.username, u2.city, u2.avatar_url)
        .order_by(func.max(Event.date_time).desc(), func.count(func.distinct(Event.id)).desc(), u2.id.asc())
        .limit(limit)
        .offset(offset)
    )

    rows = db.execute(stmt).all()
    return [
        PeopleHistoryItemOut(
            id=r.id,
            full_name=r.full_name,
            username=r.username,
            city=r.city,
            avatar_url=r.avatar_url,
            events_together=r.events_together,
            last_seen_at=r.last_seen_at,
        )
        for r in rows
    ]