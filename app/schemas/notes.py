from datetime import datetime
from pydantic import BaseModel, Field

class NoteIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)

class NoteOut(BaseModel):
    target_user_id: int
    text: str
    updated_at: datetime