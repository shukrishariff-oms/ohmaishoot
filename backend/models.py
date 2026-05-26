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
    # SEO landing
    slug = Column(String, unique=True, index=True, nullable=True)
    description = Column(String, nullable=True)
    # Trust counter
    photo_count = Column(Integer, default=0)


class AlbumClick(Base):
    """Tracks clicks on album_url from the public site (proxy for buyer demand)."""
    __tablename__ = "album_clicks"

    id = Column(Integer, primary_key=True, index=True)
    album_id = Column(Integer, ForeignKey("albums.id", ondelete="CASCADE"), index=True)
    clicked_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    referrer = Column(String, nullable=True)       # placement: hero / list / event-page / direct
    user_agent = Column(String, nullable=True)
    ip_hash = Column(String, nullable=True, index=True)
    device = Column(String, nullable=True)         # mobile / desktop / tablet
    source = Column(String, nullable=True)         # instagram / google / direct / etc.

class BibSearch(Base):
    """Tracks bib-number searches — proxy for runner intent + popular events."""
    __tablename__ = "bib_searches"

    id = Column(Integer, primary_key=True, index=True)
    album_id = Column(Integer, ForeignKey("albums.id", ondelete="SET NULL"), nullable=True, index=True)
    bib = Column(String, index=True)
    searched_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    ip_hash = Column(String, nullable=True, index=True)
    user_agent = Column(String, nullable=True)


Index("ix_bib_searches_album_at", BibSearch.album_id, BibSearch.searched_at)


class PageView(Base):
    """Public landing tracker — denominator for conversion rate."""
    __tablename__ = "page_views"

    id = Column(Integer, primary_key=True, index=True)
    viewed_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    path = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    ip_hash = Column(String, nullable=True, index=True)
    device = Column(String, nullable=True)
    source = Column(String, nullable=True)


class Lead(Base):
    """Buyer leads — people who want their photos but didn't (yet) go to PhotoHawk.

    Captured via the 'Beritahu saya' form on /e/:slug. Real revenue prep:
    when /shop launches, Syuk has a warm list per event to email.
    """
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    album_id = Column(Integer, ForeignKey("albums.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    bib = Column(String, nullable=True)            # race bib number
    note = Column(String, nullable=True)
    interest = Column(String, nullable=True)       # 'face-search' | 'package' | 'reprint' | etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    ip_hash = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    contacted = Column(Boolean, default=False)
