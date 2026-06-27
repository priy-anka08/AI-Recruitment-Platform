from sqlalchemy import Column, String, Boolean, Integer, Text
from app.database.database import Base
import uuid

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    skills_required = Column(String(500), nullable=False)  # comma separated
    experience_min = Column(Integer, default=0)
    experience_max = Column(Integer, default=5)
    salary_min = Column(Integer, default=0)
    salary_max = Column(Integer, default=0)
    location = Column(String(100), nullable=True)
    job_type = Column(String(50), default="full-time")  # full-time, part-time, remote
    is_active = Column(Boolean, default=True)
    created_by = Column(String, nullable=False)  # HR/recruiter user id