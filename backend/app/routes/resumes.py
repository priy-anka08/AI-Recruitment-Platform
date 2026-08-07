import os
import json
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.candidate import Candidate
from app.schemas.resume_schema import ResumeUploadResponse, ATSScoreResponse
from app.services.ai_resume import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,
    parse_resume_with_ai,
    calculate_ats_score,
    generate_candidate_summary,
    analyze_skill_gap,
    get_recommendation_label
)
from app.models.job import Job
import uuid

router = APIRouter()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


# Auto-shortlisting: derive a pipeline status from the ATS score
def auto_status_from_score(score: float) -> str:
    if score >= 90:
        return "shortlisted"
    elif score >= 80:
        return "under_review"
    elif score >= 60:
        return "screened"
    else:
        return "rejected"


@router.post("/upload/{job_id}", response_model=ResumeUploadResponse)
async def upload_resume(
    job_id: str,
    file: UploadFile = File(...),
    portfolio_url: str = Form(None),
    linkedin_url: str = Form(None),
    github_url: str = Form(None),
    cover_letter: str = Form(None),
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
    elif file.filename.endswith(".txt"):
        resume_text = extract_text_from_txt(file_bytes)
    else:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX and TXT supported")

    parsed = parse_resume_with_ai(resume_text)
    ats_result = calculate_ats_score(resume_text, job.description)
    ats_score = ats_result.get("ats_score", 0.0)
    candidate_skills = parsed.get("skills", "")

    # AI Candidate Summary
    try:
        ai_summary = generate_candidate_summary(resume_text, job.title)
    except Exception as e:
        print("Summary generation error:", e)
        ai_summary = None

    # AI Skill Gap Analysis
    try:
        skill_gap = analyze_skill_gap(candidate_skills, job.skills_required or "")
        matched_skills = ", ".join(skill_gap.get("matched_skills", []))
        missing_skills = ", ".join(skill_gap.get("missing_skills", []))
    except Exception as e:
        print("Skill gap analysis error:", e)
        matched_skills = None
        missing_skills = None

    # AI Recommendation label
    recommendation_label = get_recommendation_label(ats_score)

    # Upload original file to Cloudinary for view/download
    resume_url = None
    try:
        upload_result = cloudinary.uploader.upload(
            file_bytes,
            resource_type="raw",
            folder="resumes",
            public_id=f"{uuid.uuid4()}_{file.filename}",
            overwrite=True
        )
        resume_url = upload_result.get("secure_url")
    except Exception as e:
        print("Cloudinary upload error:", e)

    email = parsed.get("email", f"unknown_{uuid.uuid4()}@temp.com")
    phone = parsed.get("phone", "")

    # Duplicate detection: check by email OR phone
    existing = db.query(Candidate).filter(Candidate.email == email).first()
    if not existing and phone:
        existing = db.query(Candidate).filter(Candidate.phone == phone).first()

    if existing:
        existing.ats_score = ats_score
        existing.skills = candidate_skills
        existing.ai_summary = ai_summary
        existing.recommendation_label = recommendation_label
        existing.matched_skills = matched_skills
        existing.missing_skills = missing_skills
        existing.status = auto_status_from_score(ats_score)
        if resume_url:
            existing.resume_url = resume_url
        if portfolio_url:
            existing.portfolio_url = portfolio_url
        if linkedin_url:
            existing.linkedin_url = linkedin_url
        if github_url:
            existing.github_url = github_url
        if cover_letter:
            existing.cover_letter = cover_letter
        db.commit()
        db.refresh(existing)
        return existing

    candidate = Candidate(
        id=str(uuid.uuid4()),
        full_name=parsed.get("full_name", "Unknown"),
        email=email,
        phone=phone,
        job_id=job_id,
        resume_text=resume_text,
        resume_url=resume_url,
        skills=candidate_skills,
        experience_years=parsed.get("experience_years", 0),
        education=parsed.get("education", ""),
        ats_score=ats_score,
        ai_summary=ai_summary,
        recommendation_label=recommendation_label,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        status=auto_status_from_score(ats_score),
        portfolio_url=portfolio_url,
        linkedin_url=linkedin_url,
        github_url=github_url,
        cover_letter=cover_letter
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