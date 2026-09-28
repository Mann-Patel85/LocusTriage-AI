from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class CivicIssueBase(BaseModel):
    category: str = Field(..., description="e.g. Pothole, Water Leak, Streetlight, Garbage")
    urgency_score: int = Field(..., ge=1, le=10, description="Urgency rating from 1 to 10")
    description: str = Field(..., description="Concise summary of the civic hazard")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = "Pending"
    image_url: Optional[str] = None
    upvotes: Optional[int] = 0

class CivicIssueCreate(CivicIssueBase):
    pass

class CivicIssueUpdate(BaseModel):
    status: Optional[str] = None
    urgency_score: Optional[int] = None
    upvotes: Optional[int] = None

class CivicIssueResponse(CivicIssueBase):
    id: int
    issue_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TriageAnalysisResponse(BaseModel):
    category: str
    urgency_score: int
    summary: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    issue_id: Optional[str] = None

class DashboardStatsResponse(BaseModel):
    total_issues: int
    avg_urgency: float
    pending_count: int
    in_progress_count: int
    resolved_count: int
    category_counts: Dict[str, int]
    urgency_distribution: Dict[str, int]
