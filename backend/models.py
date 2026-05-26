from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
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


class AlbumClick(Base):
    """Tracks clicks on album_url from the public site (proxy for buyer demand)."""
    __tablename__ = "album_clicks"

    id = Column(Integer, primary_key=True, index=True)
    album_id = Column(Integer, ForeignKey("albums.id", ondelete="CASCADE"), index=True)
    clicked_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    referrer = Column(String, nullable=True)       # e.g. hero / list / direct
    user_agent = Column(String, nullable=True)
    ip_hash = Column(String, nullable=True, index=True)  # SHA256(ip+salt) — for unique counts, not reverse-lookup

Index("ix_album_clicks_album_clicked", AlbumClick.album_id, AlbumClick.clicked_at)
