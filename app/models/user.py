import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class UserRole(str, enum.Enum):
    user = "user"
    organizer = "organizer"
    admin = "admin"

class UserGender(str, enum.Enum):
    male = "male"
    female = "female"
    unknown = "unknown"

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    
    username: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gender: Mapped[UserGender] = mapped_column(
        Enum(UserGender, name="user_gender"),
        nullable=False,
        default=UserGender.unknown
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.user
    )
    
    trust_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )