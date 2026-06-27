from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.interview import Interview
from app.schemas.interview_schema import InterviewCreate, InterviewResponse
from typing import List
import uuid

router = APIRouter()

# Schedule interview
@router.post("/", response_model=InterviewResponse)
def schedule_interview(
    interview: InterviewCreate,
    db: Session = Depends(get_db)
):
    new_interview = Interview(
        id=str(uuid.uuid4()),
        **interview.dict()
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)
    return new_interview

# Get all interviews
@router.get("/", response_model=List[InterviewResponse])
def get_all_interviews(db: Session = Depends(get_db)):
    return db.query(Interview).all()

# Get interview by id
@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(
        Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

# Get interviews by candidate
@router.get("/candidate/{candidate_id}", response_model=List[InterviewResponse])
def get_by_candidate(candidate_id: str, db: Session = Depends(get_db)):
    return db.query(Interview).filter(
        Interview.candidate_id == candidate_id
    ).all()

# Update interview status
@router.put("/{interview_id}/status")
def update_interview_status(
    interview_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    interview.status = status
    db.commit()
    db.refresh(interview)
    return {"message": f"Status updated to {status}", "interview": interview}

# Cancel interview
@router.delete("/{interview_id}")
def cancel_interview(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(
        Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    interview.status = "cancelled"
    db.commit()
    return {"message": "Interview cancelled successfully"}