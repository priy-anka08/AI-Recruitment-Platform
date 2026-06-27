from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.candidate import Candidate
from app.models.job import Job
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import uuid
from datetime import datetime

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

router = APIRouter()

# Generate screening questions based on job role
@router.get("/questions/{job_id}")
def generate_questions(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    prompt = f"""
    Generate 8 screening interview questions for this job role as JSON array only:
    Job Title: {job.title}
    Required Skills: {job.skills_required}

    Return only this JSON format:
    [
        {{"question": "question text", "category": "technical/behavioral/experience"}},
        ...
    ]
    """
    response = model.generate_content(prompt)
    text = response.text.strip().replace("```json", "").replace("```", "").strip()
    questions = json.loads(text)
    return {
        "job_title": job.title,
        "questions": questions
    }

# Mock voice screening — simulate a call
@router.post("/screen/{candidate_id}")
def mock_voice_screen(
    candidate_id: str,
    answers: dict,
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    prompt = f"""
    Evaluate this candidate based on their screening answers and return JSON only:
    
    Candidate: {candidate.full_name}
    Skills: {candidate.skills}
    Answers: {json.dumps(answers)}
    
    Return only this JSON:
    {{
        "communication_score": number 0-100,
        "confidence_score": number 0-100,
        "technical_score": number 0-100,
        "overall_score": number 0-100,
        "recommendation": "Proceed/Hold/Reject",
        "feedback": "brief feedback"
    }}
    """
    response = model.generate_content(prompt)
    text = response.text.strip().replace("```json", "").replace("```", "").strip()
    evaluation = json.loads(text)

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate.full_name,
        "screening_date": datetime.utcnow().isoformat(),
        "call_status": "completed",
        "evaluation": evaluation
    }

# Get candidate info for screening
@router.get("/candidate-info/{candidate_id}")
def get_candidate_for_screening(
    candidate_id: str,
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return {
        "candidate_id": candidate.id,
        "name": candidate.full_name,
        "email": candidate.email,
        "phone": candidate.phone,
        "skills": candidate.skills,
        "experience_years": candidate.experience_years,
        "current_ats_score": candidate.ats_score,
        "status": candidate.status,
        "screening_questions": [
            "Tell me about your current company and role?",
            "What is your total experience?",
            "What is your current and expected salary?",
            "What is your notice period?",
            "What is your preferred work location?",
            "Why are you looking for a change?"
        ]
    }