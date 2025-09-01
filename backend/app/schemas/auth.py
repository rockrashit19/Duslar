from pydantic import BaseModel

class TelegramInintIn(BaseModel):
    init_data: str
    
class UserOut(BaseModel):
    id: int
    username: str | None = None
    full_name: str
    city: str | None = None
    role: str
    avatar_url: str | None = None
    
class TokenOut(BaseModel):
    token: str
    user: UserOut