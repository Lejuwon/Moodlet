from typing import Optional
from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    name: str
    
    oauth_provider: str
    oauth_subject: str

    # 🔹 프로필 이미지는 안 써도 되니까 옵션
    image_url: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    name: str

    class Config:
        orm_mode = True