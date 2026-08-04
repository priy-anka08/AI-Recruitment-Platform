from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import Counter
import logging
from app.database.dependencies import get_db
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.interview import Interview
from app.models.project import Project, Task, Sprint
from app.services.ai_resume import check_decision_consistency

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

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


@router.get("/projects")
def get_project_analytics(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    total_tasks = db.query(Task).count()
    completed_tasks = db.query(Task).filter(Task.status == "done").count()
    in_progress_tasks = db.query(Task).filter(Task.status == "in_progress").count()
    todo_tasks = db.query(Task).filter(Task.status == "todo").count()
    total_sprints = db.query(Sprint).count()
    active_sprints = db.query(Sprint).filter(Sprint.status == "active").count()
    completed_sprints = db.query(Sprint).filter(Sprint.status == "completed").count()

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "in_progress_tasks": in_progress_tasks,
        "todo_tasks": todo_tasks,
        "task_completion_rate": round((completed_tasks / total_tasks * 100), 2) if total_tasks > 0 else 0,
        "total_sprints": total_sprints,
        "active_sprints": active_sprints,
        "completed_sprints": completed_sprints
    }


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


@router.get("/hr-dashboard")
def get_hr_dashboard(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    total = len(candidates)

    ai_screened = sum(1 for c in candidates if c.ai_summary or c.ats_score)
    ats_qualified = sum(1 for c in candidates if (c.ats_score or 0) >= 60)
    shortlisted = sum(1 for c in candidates if c.status == "shortlisted")
    interview_scheduled = db.query(Interview).count()
    rejected = sum(1 for c in candidates if c.status == "rejected")
    offer_released = sum(1 for c in candidates if c.status == "selected")
    offer_accepted = sum(1 for c in candidates if c.status == "joined")

    return {
        "total_applications": total,
        "ai_screened": ai_screened,
        "ats_qualified": ats_qualified,
        "shortlisted": shortlisted,
        "interview_scheduled": interview_scheduled,
        "rejected": rejected,
        "offer_released": offer_released,
        "offer_accepted": offer_accepted,
    }


@router.get("/insights")
def get_ai_insights(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    total = len(candidates)

    avg_ats = round(sum(c.ats_score or 0 for c in candidates) / total, 2) if total else 0

    skill_counter = Counter()
    for c in candidates:
        if c.skills:
            for skill in c.skills.split(','):
                skill_clean = skill.strip()
                if skill_clean:
                    skill_counter[skill_clean] += 1
    top_skills = [{"skill": s, "count": n} for s, n in skill_counter.most_common(10)]

    buckets = {"0-1 yrs": 0, "1-3 yrs": 0, "3-5 yrs": 0, "5+ yrs": 0}
    for c in candidates:
        yrs = c.experience_years or 0
        if yrs <= 1:
            buckets["0-1 yrs"] += 1
        elif yrs <= 3:
            buckets["1-3 yrs"] += 1
        elif yrs <= 5:
            buckets["3-5 yrs"] += 1
        else:
            buckets["5+ yrs"] += 1

    rec_counter = Counter(c.recommendation_label for c in candidates if c.recommendation_label)
    recommendation_distribution = dict(rec_counter)

    applied = total
    screened = sum(1 for c in candidates if (c.ats_score or 0) >= 60)
    shortlisted = sum(1 for c in candidates if c.status == "shortlisted")
    interview = db.query(Interview).count()
    selected = sum(1 for c in candidates if c.status == "selected")

    funnel = [
        {"stage": "Applied", "count": applied},
        {"stage": "Screened", "count": screened},
        {"stage": "Shortlisted", "count": shortlisted},
        {"stage": "Interview", "count": interview},
        {"stage": "Selected", "count": selected},
    ]

    return {
        "average_ats_score": avg_ats,
        "top_skills": top_skills,
        "experience_distribution": buckets,
        "recommendation_distribution": recommendation_distribution,
        "hiring_funnel": funnel,
    }


# NEW: Decision Consistency Check — flags mismatches between AI recommendation and actual hiring decision
# (no demographic data used — this is a proxy audit for consistent, fair decision-making)
@router.get("/decision-consistency")
def get_decision_consistency(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).filter(
        Candidate.recommendation_label.isnot(None),
        Candidate.status.in_(["selected", "rejected", "shortlisted", "joined"])
    ).all()

    if not candidates:
        return {
            "flagged_cases": [],
            "consistency_score": 100,
            "summary": "Not enough decided candidates yet to run a consistency check."
        }

    candidates_data = [
        {
            "candidate_id": c.id,
            "candidate_name": c.full_name,
            "ai_recommendation": c.recommendation_label,
            "actual_status": c.status,
        }
        for c in candidates
    ]

    try:
        result = check_decision_consistency(candidates_data)
        return result
    except Exception as e:
        logger.error(f"Decision consistency check error: {e}")
        raise HTTPException(status_code=500, detail="Failed to run decision consistency check")