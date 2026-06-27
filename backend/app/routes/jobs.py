from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse
from typing import List

router = APIRouter()

# Create job
@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    new_job = Job(**job.dict(), created_by="admin")  # later replace with current user
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

# Get all jobs
@router.get("/", response_model=List[JobResponse])
def get_all_jobs(db: Session = Depends(get_db)):
    return db.query(Job).filter(Job.is_active == True).all()

# Get single job
@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# Update job
@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: str, job_data: JobCreate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for key, value in job_data.dict().items():
        setattr(job, key, value)
    db.commit()
    db.refresh(job)
    return job

# Delete job
@router.delete("/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_active = False  # soft delete
    db.commit()
    return {"message": "Job deleted successfully"}