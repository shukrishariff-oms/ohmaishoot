import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from database import engine, Base, get_db
import models
import schemas

# Create tables
Base.metadata.create_all(bind=engine)

# Ensure storage directory exists
STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage", "covers")
os.makedirs(STORAGE_DIR, exist_ok=True)

app = FastAPI(title="OhMaiShoot API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for covers
app.mount("/covers", StaticFiles(directory=STORAGE_DIR), name="covers")

# Security configuration
SECRET_KEY = "ohmaishoot-secret-key-change-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Hardcoded Admin credentials (local use)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

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

# Public endpoints
@app.get("/albums", response_model=List[schemas.Album])
def get_published_albums(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Newest event first (ordered by event_date descending)
    albums = db.query(models.Album).filter(models.Album.is_published == True).order_by(models.Album.event_date.desc()).offset(skip).limit(limit).all()
    return albums

# Admin endpoints
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
    current_user: str = Depends(get_current_user)
):
    # Save cover image
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
        cover_image=file_name
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
    current_user: str = Depends(get_current_user)
):
    db_album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not db_album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    if cover_image:
        # Delete old cover
        old_cover_path = os.path.join(STORAGE_DIR, db_album.cover_image)
        if os.path.exists(old_cover_path):
            os.remove(old_cover_path)
            
        # Save new cover
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
        
    # Delete cover
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
