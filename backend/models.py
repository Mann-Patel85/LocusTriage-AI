import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text

try:
    from backend.database import Base
except ImportError:
    from database import Base

class CivicIssue(Base):
    __tablename__ = "civic_issues"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    issue_id = Column(String(64), unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    urgency_score = Column(Integer, nullable=False, default=5)
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="Pending", index=True)
    image_url = Column(String(255), nullable=True)
    upvotes = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
