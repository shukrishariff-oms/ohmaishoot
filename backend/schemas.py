from pydantic import BaseModel
from typing import Optional
import datetime

class AlbumBase(BaseModel):
    event_name: str
    event_date: str
    location: str
    album_url: str
    is_published: bool = False

class AlbumCreate(AlbumBase):
    pass

class AlbumUpdate(AlbumBase):
    pass

class Album(AlbumBase):
    id: int
    cover_image: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
