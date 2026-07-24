import os
import logging
import requests
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.candidate import Candidate

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


def send_status_email(candidate_email, candidate_name, new_status):
    try:
        api_key = os.getenv("BREVO_API_KEY")

        logger.info(f"Attempting to send email to {candidate_email} via Brevo")

        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json"
        }
        payload = {
            "sender": {
                "name": "Sneha Mittal",
                "email": "snehamittle15@gmail.com"
            },
            "to": [{"email": candidate_email, "name": candidate_name}],
            "subject": "Application Status Updated",
            "textContent": f"""Dear {candidate_name},

Your application status has been updated.

Current Status: {new_status.upper()}

Thank you for your interest in our recruitment process.

Regards,
AI Recruitment Team
"""
        }

        response = requests.post(url, json=payload, headers=headers, timeout=10)

        if response.status_code in (200, 201):
            logger.info("Email sent successfully via Brevo")
        else:
            logger.error(f"Brevo Error: {response.status_code} - {response.text}")

    except Exception as e:
        logger.error(f"Email Error: {e}")


@router.get("/")
def get_all_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).order_by(Candidate.ats_score.desc()).all()


@router.get("/{candidate_id}")
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


# View / Download resume
@router.get("/{candidate_id}/resume")
def get_resume(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not candidate.resume_url:
        raise HTTPException(status_code=404, detail="Resume not uploaded")
    return {"resume_url": candidate.resume_url}


@router.put("/{candidate_id}/status")
def update_status(
    candidate_id: str,
    status: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
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

    background_tasks.add_task(
        send_status_email,
        candidate.email,
        candidate.full_name,
        status
    )

    return {"message": f"Status updated to {status}", "candidate": candidate}


@router.get("/status/{status}")
def get_by_status(status: str, db: Session = Depends(get_db)):
    return db.query(Candidate).filter(Candidate.status == status).all()