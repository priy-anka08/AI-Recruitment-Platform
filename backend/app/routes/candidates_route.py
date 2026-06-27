from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.candidate import Candidate

router = APIRouter()

# Get all candidates
@router.get("/")
def get_all_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).order_by(
        Candidate.ats_score.desc()
    ).all()
    return candidates

# Get single candidate
@router.get("/{candidate_id}")
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

# Update candidate status
@router.put("/{candidate_id}/status")
def update_status(
    candidate_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    allowed_statuses = [
        "applied", "under_review", "screened", "shortlisted",
        "interview_scheduled", "technical_round", "hr_round",
        "selected", "rejected", "joined"
    ]
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    candidate.status = status
    db.commit()
    db.refresh(candidate)
    return {"message": f"Status updated to {status}", "candidate": candidate}

# Get candidates by status
@router.get("/status/{status}")
def get_by_status(status: str, db: Session = Depends(get_db)):
    candidates = db.query(Candidate).filter(
        Candidate.status == status
    ).all()
    return candidates