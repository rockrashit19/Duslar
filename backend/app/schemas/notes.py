from datetime import datetime
from pydantic import BaseModel, field_validator

class NoteIn(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("текст заметки пуст")
        if len(v) > 80:
            raise ValueError("слишком длинная заметка")
        return v.strip()

class NoteOut(BaseModel):
    target_user_id: int
    text: str
    updated_at: datetime