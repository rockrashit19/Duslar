from pydantic import BaseModel
from app.models.user import UserGender

class GenderUpdateIn(BaseModel):
    gender: UserGender

class MeOut(BaseModel):
    id: int
    username: str | None = None
    full_name: str
    city: str | None = None
    role: str
    gender: UserGender