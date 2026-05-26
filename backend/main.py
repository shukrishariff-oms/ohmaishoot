import os
import shutil
import uuid
import hashlib
from typing import List, Optional
from datetime import datetime, timedelta, date

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, desc
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import BaseModel

from database import engine, Base, get_db
import models
import schemas

# Create tables
Base.metadata.create_all(bind=engine)

# Ensure storage directory exists
STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage", "covers")
os.makedirs(STORAGE_DIR, exist_ok=True)

app = FastAPI(title="OhMaiShoot API")

# Configure CORS
origins_env = os.getenv("CORS_ORIGINS", "")
origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
if not origins:
    origins = ["http://localhost:5173", "http://localhost:3000"]  # Fallback for local

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for covers
app.mount("/covers", StaticFiles(directory=STORAGE_DIR), name="covers")

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "ohmaishoot-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
IP_HASH_SALT = os.getenv("IP_HASH_SALT", "ohmaishoot-ip-salt")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    if username != ADMIN_USERNAME:
        raise credentials_exception
    return username


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else ""


def _hash_ip(ip: str) -> str:
    if not ip:
        return ""
    return hashlib.sha256(f"{IP_HASH_SALT}|{ip}".encode("utf-8")).hexdigest()[:32]


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != ADMIN_USERNAME or form_data.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ── Public endpoints ──────────────────────────────────────────────
@app.get("/albums", response_model=List[schemas.Album])
def get_published_albums(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    albums = (
        db.query(models.Album)
        .filter(models.Album.is_published == True)
        .order_by(models.Album.event_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return albums


class ClickIn(BaseModel):
    source: Optional[str] = None  # 'hero' | 'list' | 'direct' | etc.


@app.post("/albums/{album_id}/click", status_code=204)
def track_album_click(
    album_id: int,
    payload: Optional[ClickIn] = None,
    request: Request = None,
    db: Session = Depends(get_db),
):
    """Public click tracker. Fire-and-forget — never blocks the redirect."""
    album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not album:
        return  # silently ignore — don't leak album existence

    ip = _client_ip(request) if request else ""
    ua = (request.headers.get("user-agent") if request else "") or ""
    src = (payload.source if payload else None) or "direct"

    click = models.AlbumClick(
        album_id=album_id,
        referrer=src[:64],
        user_agent=ua[:255],
        ip_hash=_hash_ip(ip),
    )
    db.add(click)
    db.commit()
    return


# ── Admin: album CRUD ─────────────────────────────────────────────
@app.get("/admin/albums", response_model=List[schemas.Album])
def get_all_albums(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    albums = db.query(models.Album).order_by(models.Album.event_date.desc()).offset(skip).limit(limit).all()
    return albums


@app.post("/admin/albums", response_model=schemas.Album)
async def create_album(
    event_name: str = Form(...),
    event_date: str = Form(...),
    location: str = Form(...),
    album_url: str = Form(...),
    is_published: bool = Form(False),
    cover_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    file_extension = cover_image.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(STORAGE_DIR, file_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(cover_image.file, buffer)

    db_album = models.Album(
        event_name=event_name,
        event_date=event_date,
        location=location,
        album_url=album_url,
        is_published=is_published,
        cover_image=file_name,
    )
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    return db_album


@app.put("/admin/albums/{album_id}", response_model=schemas.Album)
async def update_album(
    album_id: int,
    event_name: str = Form(...),
    event_date: str = Form(...),
    location: str = Form(...),
    album_url: str = Form(...),
    is_published: bool = Form(...),
    cover_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    db_album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not db_album:
        raise HTTPException(status_code=404, detail="Album not found")

    if cover_image:
        old_cover_path = os.path.join(STORAGE_DIR, db_album.cover_image)
        if os.path.exists(old_cover_path):
            os.remove(old_cover_path)
        file_extension = cover_image.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(STORAGE_DIR, file_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(cover_image.file, buffer)
        db_album.cover_image = file_name

    db_album.event_name = event_name
    db_album.event_date = event_date
    db_album.location = location
    db_album.album_url = album_url
    db_album.is_published = (str(is_published).lower() == 'true')

    db.commit()
    db.refresh(db_album)
    return db_album


@app.delete("/admin/albums/{album_id}", status_code=204)
def delete_album(album_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    db_album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not db_album:
        raise HTTPException(status_code=404, detail="Album not found")

    cover_path = os.path.join(STORAGE_DIR, db_album.cover_image)
    if os.path.exists(cover_path):
        os.remove(cover_path)

    db.delete(db_album)
    db.commit()
    return


@app.patch("/admin/albums/{album_id}/publish", response_model=schemas.Album)
def toggle_publish_album(album_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    db_album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not db_album:
        raise HTTPException(status_code=404, detail="Album not found")

    db_album.is_published = not db_album.is_published
    db.commit()
    db.refresh(db_album)
    return db_album


# ── Admin: stats ──────────────────────────────────────────────────
@app.get("/admin/stats/overview")
def stats_overview(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    now = datetime.utcnow()
    today = date.today()
    d7 = now - timedelta(days=7)
    d30 = now - timedelta(days=30)

    total_events = db.query(func.count(models.Album.id)).scalar() or 0
    published = db.query(func.count(models.Album.id)).filter(models.Album.is_published == True).scalar() or 0
    hidden = total_events - published

    # Latest published event date (string YYYY-MM-DD)
    latest_event = (
        db.query(models.Album.event_date)
        .filter(models.Album.is_published == True)
        .order_by(models.Album.event_date.desc())
        .first()
    )
    latest_event_date = latest_event[0] if latest_event else None

    # Upcoming = event_date >= today
    today_str = today.isoformat()
    upcoming = (
        db.query(func.count(models.Album.id))
        .filter(models.Album.event_date >= today_str)
        .scalar()
        or 0
    )

    total_clicks = db.query(func.count(models.AlbumClick.id)).scalar() or 0
    clicks_7d = db.query(func.count(models.AlbumClick.id)).filter(models.AlbumClick.clicked_at >= d7).scalar() or 0
    clicks_30d = db.query(func.count(models.AlbumClick.id)).filter(models.AlbumClick.clicked_at >= d30).scalar() or 0
    unique_visitors_30d = (
        db.query(func.count(func.distinct(models.AlbumClick.ip_hash)))
        .filter(models.AlbumClick.clicked_at >= d30, models.AlbumClick.ip_hash != "")
        .scalar()
        or 0
    )

    # Daily clicks last 30d
    daily_rows = (
        db.query(
            func.date(models.AlbumClick.clicked_at).label("d"),
            func.count(models.AlbumClick.id).label("c"),
        )
        .filter(models.AlbumClick.clicked_at >= d30)
        .group_by("d")
        .order_by("d")
        .all()
    )
    daily = {str(r.d): r.c for r in daily_rows}
    series = []
    for i in range(29, -1, -1):
        day = (today - timedelta(days=i)).isoformat()
        series.append({"date": day, "clicks": daily.get(day, 0)})

    # Events per month (last 12 months by event_date)
    months_rows = (
        db.query(
            func.substr(models.Album.event_date, 1, 7).label("ym"),
            func.count(models.Album.id).label("c"),
        )
        .group_by("ym")
        .order_by(desc("ym"))
        .limit(12)
        .all()
    )
    events_per_month = [{"month": r.ym, "events": r.c} for r in reversed(months_rows) if r.ym]

    return {
        "events": {
            "total": total_events,
            "published": published,
            "hidden": hidden,
            "upcoming": upcoming,
            "latest_event_date": latest_event_date,
        },
        "clicks": {
            "total": total_clicks,
            "last_7d": clicks_7d,
            "last_30d": clicks_30d,
            "unique_visitors_30d": unique_visitors_30d,
        },
        "daily_clicks_30d": series,
        "events_per_month": events_per_month,
    }


@app.get("/admin/stats/albums")
def stats_albums(
    days: int = 30,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Per-album click breakdown for the last `days` days."""
    days = max(1, min(365, days))
    since = datetime.utcnow() - timedelta(days=days)

    rows = (
        db.query(
            models.Album.id,
            models.Album.event_name,
            models.Album.event_date,
            models.Album.location,
            models.Album.is_published,
            models.Album.cover_image,
            func.count(models.AlbumClick.id).label("clicks"),
            func.count(func.distinct(models.AlbumClick.ip_hash)).label("unique"),
        )
        .outerjoin(
            models.AlbumClick,
            (models.AlbumClick.album_id == models.Album.id)
            & (models.AlbumClick.clicked_at >= since),
        )
        .group_by(models.Album.id)
        .order_by(desc("clicks"), models.Album.event_date.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": r.id,
            "event_name": r.event_name,
            "event_date": r.event_date,
            "location": r.location,
            "is_published": r.is_published,
            "cover_image": r.cover_image,
            "clicks": r.clicks or 0,
            "unique_visitors": r.unique or 0,
        }
        for r in rows
    ]
