import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Resolve absolute path to data/civic_issues.db regardless of CWD
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = f"sqlite:///{BASE_DIR / 'data' / 'civic_issues.db'}"

DB_URL = os.getenv("DATABASE_URL", DEFAULT_DB_PATH)

# For SQLite, check_same_thread needs to be False for FastAPI concurrent requests
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

engine = create_engine(DB_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
