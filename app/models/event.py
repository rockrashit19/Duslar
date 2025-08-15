import enum
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    all = "all"
    
class EventStatus(str, enum.Enum):
    open = "open"
    closed = "closed"
    past = "past"

class Event(Base):
    __tablename__ = "events"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    creator_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(Text, nullable=False)
    
    date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    gender_restriction: Mapped[Gender] = mapped_column(
        Enum(Gender, name="gender_restriction", nullable=False, default=Gender.all)
    )
    max_participants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status"), nullable=False, default=EventStatus.open
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    creator = relationship("User", lazy="joined")