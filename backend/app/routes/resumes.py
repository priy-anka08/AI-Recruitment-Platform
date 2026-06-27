from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.candidate import Candidate
from app.schemas.resume_schema import ResumeUploadResponse, ATSScoreResponse
from app.services.ai_resume import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,                                    # ← new
    parse_resume_with_ai,
    calculate_ats_score
)
from app.models.job import Job
import uuid

router = APIRouter()

@router.post("/upload/{job_id}", response_model=ResumeUploadResponse)
async def upload_resume(
    job_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file_bytes = await file.read()

    if file.filename.endswith(".pdf"):
        resume_text = extract_text_from_pdf(file_bytes)
    elif file.filename.endswith(".docx"):
        resume_text = extract_text_from_docx(file_bytes)
    elif file.filename.endswith(".txt"):                      # ← new
        resume_text = extract_text_from_txt(file_bytes)
    else:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX and TXT supported")

    parsed = parse_resume_with_ai(resume_text)
    ats_result = calculate_ats_score(resume_text, job.description)

    email = parsed.get("email", f"unknown_{uuid.uuid4()}@temp.com")
    existing = db.query(Candidate).filter(Candidate.email == email).first()
    if existing:
        existing.ats_score = ats_result.get("ats_score", 0.0)
        existing.skills = parsed.get("skills", "")
        db.commit()
        db.refresh(existing)
        return existing

    candidate = Candidate(
        id=str(uuid.uuid4()),
        full_name=parsed.get("full_name", "Unknown"),
        email=email,
        phone=parsed.get("phone", ""),
        job_id=job_id,
        resume_text=resume_text,
        skills=parsed.get("skills", ""),
        experience_years=parsed.get("experience_years", 0),
        education=parsed.get("education", ""),
        ats_score=ats_result.get("ats_score", 0.0),
        status="applied"
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate

@router.get("/candidates/{job_id}")
def get_candidates_by_job(job_id: str, db: Session = Depends(get_db)):
    candidates = db.query(Candidate).filter(
        Candidate.job_id == job_id
    ).order_by(Candidate.ats_score.desc()).all()
    return candidates

@router.get("/score/{candidate_id}", response_model=ATSScoreResponse)
def get_ats_score(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {
        "candidate_id": candidate.id,
        "ats_score": candidate.ats_score,
        "skill_match": candidate.ats_score,
        "experience_match": candidate.ats_score,
        "education_match": candidate.ats_score,
        "recommendation": "Selected" if candidate.ats_score >= 70 else "Rejected"
    }