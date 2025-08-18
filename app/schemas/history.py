from datetime import datetime
from pydantic import BaseModel

class PersonHistoryOut(BaseModel):
    id: int
    username: str | None = None
    full_name: str
    events_together: int
    last_seen_at: datetime
    