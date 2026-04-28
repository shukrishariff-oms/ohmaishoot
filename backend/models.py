from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base
import datetime

class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    cover_image = Column(String, index=False)
    event_name = Column(String, index=True)
    event_date = Column(String)  # Stored as string 'YYYY-MM-DD' for simplicity
    location = Column(String)
    album_url = Column(String)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
