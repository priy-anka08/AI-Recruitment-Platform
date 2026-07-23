import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.candidate import Candidate

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter()


def send_status_email(candidate_email, candidate_name, new_status):
    try:
        sender_email = os.getenv("EMAIL_SENDER")
        sender_password = os.getenv("EMAIL_APP_PASSWORD")

        subject = "Application Status Updated"
        body = f"""
Dear {candidate_name},

Your application status has been updated.

Current Status: {new_status.upper()}

Thank you for your interest in our recruitment process.

Regards,
AI Recruitment Team
"""
        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = candidate_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()

    except Exception as e:
        print("Email Error:", e)


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