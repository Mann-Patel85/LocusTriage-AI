import os
import uuid
import io
import csv
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

import sys
from pathlib import Path

# Ensure backend directory and project root are on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
for p in [str(BASE_DIR), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.database import engine, Base, get_db
    from backend.models import CivicIssue
    from backend.schemas import (
        CivicIssueCreate,
        CivicIssueUpdate,
        CivicIssueResponse,
        TriageAnalysisResponse,
        DashboardStatsResponse,
    )
    from backend.ai_service import analyze_civic_image
    from backend.seed_data import seed_historical_data
except ImportError:
    from database import engine, Base, get_db
    from models import CivicIssue
    from schemas import (
        CivicIssueCreate,
        CivicIssueUpdate,
        CivicIssueResponse,
        TriageAnalysisResponse,
        DashboardStatsResponse,
    )
    from ai_service import analyze_civic_image
    from seed_data import seed_historical_data

# Create database tables
Base.metadata.create_all(bind=engine)

# Create uploads directory if missing
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run seed data migration if needed
    seed_historical_data()
    yield

app = FastAPI(
    title="LocusTriage AI API",
    description="Intelligent Civic Hazard Triage and Urban Asset Management System",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/triage", response_model=CivicIssueResponse)
async def triage_uploaded_image(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    custom_description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload an image of a civic hazard.
    Gemini 2.5 Flash analyzes it, determines urgency, extracts EXIF GPS if available,
    and logs the issue directly into the database.
    """
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image uploaded")

    # Run AI Analysis & EXIF extraction
    ai_result = analyze_civic_image(image_bytes)

    # Resolve coordinates
    resolved_lat = latitude or ai_result.get("latitude")
    resolved_lon = longitude or ai_result.get("longitude")

    # If still no coordinates, default to Ahmedabad city center for demo realism
    if resolved_lat is None or resolved_lon is None:
        resolved_lat = 23.0225 + (uuid.uuid4().int % 100) * 0.0003
        resolved_lon = 72.5714 + (uuid.uuid4().int % 100) * 0.0003

    # Save image to uploads folder
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex[:12]}{file_ext}"
    saved_filepath = os.path.join(UPLOAD_DIR, unique_filename)
    with open(saved_filepath, "wb") as f:
        f.write(image_bytes)

    image_url = f"/uploads/{unique_filename}"
    issue_id = f"LOCUS-{uuid.uuid4().hex[:6].upper()}"

    description = custom_description or ai_result.get("summary", "Civic issue detected.")

    new_issue = CivicIssue(
        issue_id=issue_id,
        category=ai_result.get("category", "General Issue"),
        urgency_score=ai_result.get("urgency_score", 5),
        description=description,
        latitude=resolved_lat,
        longitude=resolved_lon,
        status="Pending",
        image_url=image_url,
        upvotes=1,
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    return new_issue


@app.get("/api/issues", response_model=List[CivicIssueResponse])
def get_issues(
    category: Optional[str] = None,
    status: Optional[str] = None,
    min_urgency: Optional[int] = Query(None, ge=1, le=10),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve civic issues with flexible filtering."""
    query = db.query(CivicIssue)
    if category:
        query = query.filter(CivicIssue.category == category)
    if status:
        query = query.filter(CivicIssue.status == status)
    if min_urgency:
        query = query.filter(CivicIssue.urgency_score >= min_urgency)

    return query.order_by(CivicIssue.created_at.desc(), CivicIssue.urgency_score.desc()).offset(offset).limit(limit).all()


@app.get("/api/issues/{issue_id}", response_model=CivicIssueResponse)
def get_issue(issue_id: str, db: Session = Depends(get_db)):
    """Retrieve single issue by its issue_id."""
    issue = db.query(CivicIssue).filter(CivicIssue.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@app.patch("/api/issues/{issue_id}", response_model=CivicIssueResponse)
def update_issue(issue_id: str, payload: CivicIssueUpdate, db: Session = Depends(get_db)):
    """Update issue status or urgency score."""
    issue = db.query(CivicIssue).filter(CivicIssue.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if payload.status is not None:
        issue.status = payload.status
    if payload.urgency_score is not None:
        issue.urgency_score = payload.urgency_score
    if payload.upvotes is not None:
        issue.upvotes = payload.upvotes

    db.commit()
    db.refresh(issue)
    return issue


@app.get("/api/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Calculates live analytics for municipal officials."""
    total = db.query(CivicIssue).count()
    if total == 0:
        return {
            "total_issues": 0,
            "avg_urgency": 0.0,
            "pending_count": 0,
            "in_progress_count": 0,
            "resolved_count": 0,
            "category_counts": {},
            "urgency_distribution": {},
        }

    avg_urgency = db.query(func.avg(CivicIssue.urgency_score)).scalar() or 0.0
    pending = db.query(CivicIssue).filter(CivicIssue.status == "Pending").count()
    in_progress = db.query(CivicIssue).filter(CivicIssue.status == "In Progress").count()
    resolved = db.query(CivicIssue).filter(CivicIssue.status == "Resolved").count()

    # Category counts
    cat_results = (
        db.query(CivicIssue.category, func.count(CivicIssue.id))
        .group_by(CivicIssue.category)
        .all()
    )
    category_counts = {cat: count for cat, count in cat_results}

    # Urgency distribution (Low: 1-3, Medium: 4-6, High: 7-8, Critical: 9-10)
    urgency_dist = {
        "Low (1-3)": db.query(CivicIssue).filter(CivicIssue.urgency_score <= 3).count(),
        "Medium (4-6)": db.query(CivicIssue).filter(CivicIssue.urgency_score.between(4, 6)).count(),
        "High (7-8)": db.query(CivicIssue).filter(CivicIssue.urgency_score.between(7, 8)).count(),
        "Critical (9-10)": db.query(CivicIssue).filter(CivicIssue.urgency_score >= 9).count(),
    }

    return {
        "total_issues": total,
        "avg_urgency": round(float(avg_urgency), 2),
        "pending_count": pending,
        "in_progress_count": in_progress,
        "resolved_count": resolved,
        "category_counts": category_counts,
        "urgency_distribution": urgency_dist,
    }


@app.get("/api/export")
def export_database_csv(db: Session = Depends(get_db)):
    """Streams full database as a downloadable CSV."""
    issues = db.query(CivicIssue).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Issue_ID",
        "Category",
        "Urgency_Score",
        "Status",
        "Description",
        "Latitude",
        "Longitude",
        "Upvotes",
        "Created_At",
    ])

    for row in issues:
        writer.writerow([
            row.issue_id,
            row.category,
            row.urgency_score,
            row.status,
            row.description,
            row.latitude,
            row.longitude,
            row.upvotes,
            row.created_at.isoformat() if row.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=civic_issues_export.csv"},
    )
