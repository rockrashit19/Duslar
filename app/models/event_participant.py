import enum
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, UniqueConstraint, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class ParticipationStatus(str, enum.Enum):
    joined = "joined"
    left = "left"
    no_show = "no_show"
    
class EventParticipant(Base):
    __tablename__ = "event_participants"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    is_visible: Mapped[bool] = mapped_column(default=True, nullable=False)
    status: Mapped[ParticipationStatus] = mapped_column(
        Enum(ParticipationStatus, name="participant_status"),
        nullable=False, default=ParticipationStatus.joined
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user"),
    )