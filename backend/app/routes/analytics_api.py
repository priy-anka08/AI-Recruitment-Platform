from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.interview import Interview
from app.models.project import Project, Task, Sprint

router = APIRouter()

# Recruitment analytics
@router.get("/recruitment")
def get_recruitment_analytics(db: Session = Depends(get_db)):
    total_jobs = db.query(Job).count()
    total_candidates = db.query(Candidate).count()
    selected = db.query(Candidate).filter(Candidate.status == "selected").count()
    rejected = db.query(Candidate).filter(Candidate.status == "rejected").count()
    shortlisted = db.query(Candidate).filter(Candidate.status == "shortlisted").count()
    interviews_scheduled = db.query(Interview).count()

    avg_ats = db.query(Candidate).all()
    avg_score = 0
    if avg_ats:
        avg_score = sum(c.ats_score for c in avg_ats) / len(avg_ats)

    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "selected": selected,
        "rejected": rejected,
        "shortlisted": shortlisted,
        "interviews_scheduled": interviews_scheduled,
        "average_ats_score": round(avg_score, 2),
        "hiring_success_rate": round((selected / total_candidates * 100), 2) if total_candidates > 0 else 0
    }

# Project analytics
@router.get("/projects")
def get_project_analytics(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    total_tasks = db.query(Task).count()
    completed_tasks = db.query(Task).filter(Task.status == "completed").count()
    total_sprints = db.query(Sprint).count()

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "task_completion_rate": round((completed_tasks / total_tasks * 100), 2) if total_tasks > 0 else 0,
        "total_sprints": total_sprints
    }

# Candidate pipeline
@router.get("/pipeline")
def get_pipeline(db: Session = Depends(get_db)):
    statuses = [
        "applied", "under_review", "screened", "shortlisted",
        "interview_scheduled", "technical_round", "hr_round",
        "selected", "rejected", "joined"
    ]
    pipeline = {}
    for status in statuses:
        count = db.query(Candidate).filter(Candidate.status == status).count()
        pipeline[status] = count

    return pipeline