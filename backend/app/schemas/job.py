from pydantic import BaseModel
from typing import Optional

class JobCreate(BaseModel):
    title: str
    description: str
    skills_required: str
    experience_min: int
    experience_max: int
    salary_min: int
    salary_max: int
    location: Optional[str] = None
    job_type: str = "full-time"

class JobResponse(BaseModel):
    id: str
    title: str
    description: str
    skills_required: str
    experience_min: int
    experience_max: int
    salary_min: int
    salary_max: int
    location: Optional[str]
    job_type: str
    is_active: bool
    created_by: str

    class Config:
        from_attributes = True