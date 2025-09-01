from pydantic import BaseModel, field_validator
from app.models.user import UserGender
from typing import Optional, Literal


class GenderUpdateIn(BaseModel):
    gender: UserGender

class UserUpdateIn(BaseModel):
    city: Optional[str] = None
    gender: Optional[UserGender] = None
    
class CityUpdateIn(BaseModel):
    city: str | None = None
    
    @field_validator("city")
    @classmethod
    def _norm(cls, v: str | None):
        if v is None:
            return None
        v = v.strip()
        return v or None

class MeOut(BaseModel):
    id: int
    username: str | None = None
    full_name: str
    city: str | None = None
    role: str
    gender: UserGender
    avatar_url: Optional[str] = None
    events_total: int
    
class UserPublicOut(BaseModel):
    id: int
    username: str | None = None
    full_name: str
    avatar_url: str | None = None
    city: str | None = None
    events_together: int
    
class RoleUpdateIn(BaseModel):
    role: Literal["user", "organizer", "admin"]