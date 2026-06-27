from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InterviewCreate(BaseModel):
    candidate_id: str
    job_id: str
    interviewer_id: Optional[str] = None
    scheduled_time: datetime
    duration_minutes: Optional[str] = "60"
    interview_type: Optional[str] = "technical"
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class InterviewResponse(BaseModel):
    id: str
    candidate_id: str
    job_id: str
    interviewer_id: Optional[str]
    scheduled_time: datetime
    duration_minutes: Optional[str]
    interview_type: str
    status: str
    meeting_link: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True