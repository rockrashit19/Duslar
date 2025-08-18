from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, Text, ForeignKey, UniqueConstraint, Index, TIMESTAMP

from app.db.base import Base 

class UserNote(Base):
    __tablename__ = "user_notes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    text: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        UniqueConstraint("owner_id", "target_user_id", name="ux_user_note_pair"),
        Index("ix_user_notes_owner_target", "owner_id", "target_user_id"),
    )
