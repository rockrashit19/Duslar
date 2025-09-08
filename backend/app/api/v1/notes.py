from datetime import datetime, timezone
from fastapi import HTTPException, Depends, APIRouter, status
from sqlalchemy.orm import Session, aliased
from sqlalchemy import and_, select, func
from app.api.deps import get_db, get_current_user
from app.models import (
    User, Event, EventParticipant, ParticipationStatus, UserNote
)
from app.schemas.notes import NoteIn, NoteOut

router = APIRouter()

def _now_utc(): return datetime.now(timezone.utc)

def _met_before(db: Session, me_id: int, other_id: int) -> bool:
    e = Event
    ep_me = aliased(EventParticipant)
    ep_other = aliased(EventParticipant)
    stmt = (
        select(func.count())
        .select_from(e)
        .join(ep_me, ep_me.event_id == e.id)
        .join(ep_other, ep_other.event_id == e.id)
        .where(
            and_(
                ep_me.user_id == me_id,
                ep_me.status == ParticipationStatus.joined,
                ep_other.user_id == other_id,
                ep_other.status == ParticipationStatus.joined,
                e.date_time < _now_utc(),
            )
        )
    )
    return bool(db.scalar(stmt))

@router.get("/users/{target_user_id}/note", response_model=NoteOut)
def get_my_note(
    target_user_id: int,
    db: Session = Depends(get_db),
    current = Depends(get_current_user),
):
    if target_user_id == current.id:
        raise HTTPException(400, "cannot note yourself")
    
    note = db.execute(
        select(UserNote).where(
            and_(UserNote.owner_id == current.id, UserNote.target_user_id == target_user_id)
        )
    ).scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="note not found")

    return NoteOut(target_user_id=target_user_id, text=note.text, updated_at=note.updated_at)

@router.put("/users/{target_user_id}/note", response_model=NoteOut)
def upsert_my_note(
    target_user_id: int,
    payload: NoteIn,
    db: Session = Depends(get_db),
    current = Depends(get_current_user),
):
    if target_user_id == current.id:
        raise HTTPException(400, "cannot note yourself")

    other = db.get(User, target_user_id)
    if not other:
        raise HTTPException(404, "user not found")

    # if not _met_before(db, current.id, target_user_id):
    #     raise HTTPException(403, "no past events together")

    note = db.execute(
        select(UserNote).where(
            and_(UserNote.owner_id == current.id, UserNote.target_user_id == target_user_id)
        )
    ).scalar_one_or_none()

    if note is None:
        note = UserNote(
            owner_id=current.id,
            target_user_id=target_user_id,
            text=payload.text.strip(),
            created_at=_now_utc(),
            updated_at=_now_utc(),
        )
        db.add(note)
    else:
        note.text = payload.text.strip()
        note.updated_at = _now_utc()

    db.commit()
    db.refresh(note)
    return NoteOut(target_user_id=target_user_id, text=note.text, updated_at=note.updated_at)


@router.delete("/users/{target_user_id}/note", status_code=204)
def delete_my_note(
    target_user_id: int,
    db: Session = Depends(get_db),
    current = Depends(get_current_user)
):
    if target_user_id == current.id:
        raise HTTPException(400, "cannot note yourself")
    
    note = db.execute(
        select(UserNote).where(
            and_(UserNote.owner_id == current.id, UserNote.target_user_id == target_user_id)
        )
    ).scalar_one_or_none()
    if not note:
        return
    
    db.delete(note)
    db.commit()