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

# In-memory screening sessions
screening_sessions = {}


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


# Evaluate candidate answers with AI
@router.post("/evaluate/{candidate_id}")
def evaluate_candidate(
    candidate_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    answers = payload.get("answers", {})
    info = payload.get("info", {})
    job_title = payload.get("job_title", "")

    prompt = f"""
    Evaluate this candidate based on their screening answers and personal information. Return JSON only.

    Candidate: {candidate.full_name}
    Job Title: {job_title}
    Skills: {candidate.skills}
    Experience: {candidate.experience_years} years

    Personal Information Collected:
    - Current Company: {info.get("current_company", "N/A")}
    - Total Experience: {info.get("total_experience", "N/A")}
    - Relevant Experience: {info.get("relevant_experience", "N/A")}
    - Current Salary: {info.get("current_salary", "N/A")}
    - Expected Salary: {info.get("expected_salary", "N/A")}
    - Notice Period: {info.get("notice_period", "N/A")}
    - Preferred Location: {info.get("preferred_location", "N/A")}

    Interview Answers:
    {json.dumps(answers, indent=2)}

    Return only this JSON:
    {{
        "communication_score": number 0-100,
        "confidence_score": number 0-100,
        "technical_score": number 0-100,
        "overall_score": number 0-100,
        "recommendation": "Proceed/Hold/Reject",
        "strengths": ["strength1", "strength2"],
        "improvements": ["area1", "area2"],
        "feedback": "detailed feedback paragraph"
    }}
    """
    response = model.generate_content(prompt)
    text = response.text.strip().replace("```json", "").replace("```", "").strip()
    evaluation = json.loads(text)

    session_id = str(uuid.uuid4())
    screening_sessions[session_id] = {
        "candidate_id": candidate_id,
        "candidate_name": candidate.full_name,
        "job_title": job_title,
        "info": info,
        "answers": answers,
        "evaluation": evaluation,
        "screening_date": datetime.utcnow().isoformat(),
    }

    return {
        "session_id": session_id,
        "candidate_id": candidate_id,
        "candidate_name": candidate.full_name,
        "job_title": job_title,
        "screening_date": datetime.utcnow().isoformat(),
        "call_status": "completed",
        "info": info,
        "evaluation": evaluation
    }


# Get screening session result
@router.get("/session/{session_id}")
def get_session(session_id: str):
    session = screening_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# Get all screening sessions
@router.get("/sessions")
def get_all_sessions():
    return list(screening_sessions.values())


# Mock voice screen (backward compatibility)
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
    }