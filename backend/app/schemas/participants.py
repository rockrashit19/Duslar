from pydantic import BaseModel

class VisibilityUpdateIn(BaseModel):
    is_visible: bool

class VisibilityOut(BaseModel):
    event_id: int
    user_id: int
    is_visible: bool
    status: str
    