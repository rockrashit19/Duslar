# app/services/maintenance.py
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.event import Event, EventStatus
from app.models.event_participant import EventParticipant, ParticipationStatus


def sync_event_statuses(session: Session | None = None) -> int:
    """
    Прогон «всё и сразу»:
      1) переводим в past все события, у которых дата в прошлом;
      2) закрываем (closed) переполненные будущие/текущие;
      3) открываем (open) те, где снова есть место.
    Возвращает количество execute-вызовов (3), не количество затронутых строк.
    """
    own_session = False
    if session is None:
        session = SessionLocal()
        own_session = True

    try:
        now = datetime.now(timezone.utc)

        # Подзапрос: текущее число участников на событие
        parts_count = (
            select(func.count())
            .select_from(EventParticipant)
            .where(EventParticipant.event_id == Event.id, EventParticipant.status==ParticipationStatus.joined)
            .scalar_subquery()
        )

        # 1) В прошлое по времени
        session.execute(
            update(Event)
            .where(Event.status != EventStatus.past)
            .where(Event.date_time < now)
            .values(status=EventStatus.past)
        )

        # 2) Закрыть, если мест нет (и событие ещё не прошло)
        session.execute(
            update(Event)
            .where(Event.status == EventStatus.open)
            .where(Event.date_time >= now)
            .where(Event.max_participants.is_not(None))
            .where(parts_count >= Event.max_participants)
            .values(status=EventStatus.closed)
        )

        # 3) Открыть, если место появилось (и событие ещё не прошло)
        session.execute(
            update(Event)
            .where(Event.status == EventStatus.closed)
            .where(Event.date_time >= now)
            .where(Event.max_participants.is_not(None))
            .where(parts_count < Event.max_participants)
            .values(status=EventStatus.open)
        )

        session.commit()
        return 3
    finally:
        if own_session:
            session.close()


def recompute_event_status(event_id: int, session: Session | None = None) -> EventStatus | None:
    """
    Локальный пересчёт статуса для конкретного события (удобно дергать после join/leave).
    Возвращает новый статус (или None, если событие не найдено).
    Правила:
      - если дата в прошлом -> past;
      - если есть max и count >= max -> closed;
      - иначе -> open.
    """
    own_session = False
    if session is None:
        session = SessionLocal()
        own_session = True

    try:
        ev: Event | None = session.get(Event, event_id)
        if not ev:
            return None

        now = datetime.now(timezone.utc)

        # 1) Время прошло — всегда past
        if ev.date_time < now:
            if ev.status != EventStatus.past:
                ev.status = EventStatus.past
                session.commit()
            return ev.status

        # 2) По вместимости (для будущих/текущих)
        if ev.max_participants is not None:
            cnt = session.scalar(
                select(func.count())
                .select_from(EventParticipant)
                .where(
                    EventParticipant.event_id == ev.id,
                    EventParticipant.status == ParticipationStatus.joined,  # ← добавили фильтр
                )
            ) or 0
            desired = EventStatus.closed if cnt >= ev.max_participants else EventStatus.open
        
            if ev.status != desired:
                ev.status = desired
                session.commit()
            return ev.status

        # 3) Если max нет — событие либо open (до наступления), либо past (см. выше)
        if ev.status != EventStatus.open:
            ev.status = EventStatus.open
            session.commit()
        return ev.status
    finally:
        if own_session:
            session.close()
