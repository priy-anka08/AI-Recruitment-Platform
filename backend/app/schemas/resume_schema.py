from pydantic import BaseModel
from typing import Optional

class ResumeUploadResponse(BaseModel):
    id: str
    full_name: str
    email: str
    skills: Optional[str]
    experience_years: int
    education: Optional[str]
    ats_score: float
    status: str

    class Config:
        from_attributes = True

class ATSScoreResponse(BaseModel):
    candidate_id: str
    ats_score: float
    skill_match: float
    experience_match: float
    education_match: float
    recommendation: str