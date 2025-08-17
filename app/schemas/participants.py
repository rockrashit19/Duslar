from pydantic import BaseModel

class VisibilityUpdateIn(BaseModel):
    is_visible: bool

class VisibilityOut(BaseModel):
    event_id: int
    user_id: int
    is_visible: bool
    status: str
    
class ParticipantOut(BaseModel):
    id: int
    username: str | None = None
    full_name: str
    is_visible: bool