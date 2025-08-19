from datetime import datetime
from pydantic import BaseModel, field_validator
from typing import Optional
from enum import Enum

class Gender(str, Enum):
    male = "male"
    female = "female"
    all = "all"

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: str
    city: str
    date_time: datetime
    gender_restriction: Gender = Gender.all
    max_participants: Optional[int] = None
    photo_url: str | None = None
    
    @field_validator("title")
    @classmethod
    def title_len(cls, v: str) -> str:
        if len(v) > 120:
            raise ValueError("Название должно быть меньше 120 символов")
        return v
    
class EventCardOut(BaseModel):
    id: int
    title: str
    location: str
    city: str
    date_time: datetime
    gender_restriction: str
    creator_id: int | None
    participants_count: int
    is_user_joined: bool
    photo_url: str | None = None
    
class EventOut(BaseModel):
    id: int
    title: str
    description: str | None
    location: str
    city: str
    date_time: datetime
    gender_restriction: str
    max_participants: int | None
    status: str
    creator_id: int | None
    participants_count: int
    is_user_joined: bool
    photo_url: str | None = None