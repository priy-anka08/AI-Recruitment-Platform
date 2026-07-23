from sqlalchemy import Column, String, Integer, Float, Text
from app.database.database import Base
import uuid

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    job_id = Column(String, nullable=False)
    resume_text = Column(Text, nullable=True)
    resume_url = Column(String(500), nullable=True)
    skills = Column(String(500), nullable=True)
    experience_years = Column(Integer, default=0)
    education = Column(String(255), nullable=True)
    ats_score = Column(Float, default=0.0)
    status = Column(String(50), default="applied")