from datetime import datetime
from pydantic import BaseModel

class PeopleHistoryItemOut(BaseModel):
    id: int
    full_name: str
    username: str | None = None
    city: str | None = None
    avatar_url: str | None = None
    events_together: int
    last_seen_at: datetime | None = None
    