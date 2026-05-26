from pydantic import BaseModel
from typing import Optional
import datetime

class AlbumBase(BaseModel):
    event_name: str
    event_date: str
    location: str
    album_url: str
    is_published: bool = False
    face_slug: Optional[str] = None

class AlbumCreate(AlbumBase):
    pass

class AlbumUpdate(AlbumBase):
    pass

class Album(AlbumBase):
    id: int
    cover_image: str
    created_at: datetime.datetime
    slug: Optional[str] = None
    description: Optional[str] = None
    photo_count: Optional[int] = 0
    indexed_count: Optional[int] = 0
    last_synced_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
