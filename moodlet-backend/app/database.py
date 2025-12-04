# app/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

# DB ENGINE
engine = create_engine(
    settings.DB_URL,
    echo=True,
    future=True,      # optional (2.0 스타일)
    pool_pre_ping=True,   # 💡 끊어진 커넥션이면 자동으로 새로 연결
    pool_recycle=1800,
)

# SESSION
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True
)

# BASE
Base = declarative_base()

# DEPENDENCY (FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()