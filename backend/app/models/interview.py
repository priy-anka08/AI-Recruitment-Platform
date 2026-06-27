from sqlalchemy import Column, String, DateTime, Text
from app.database.database import Base
import uuid

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, nullable=False)
    job_id = Column(String, nullable=False)
    interviewer_id = Column(String, nullable=True)
    scheduled_time = Column(DateTime, nullable=False)
    duration_minutes = Column(String, default="60")
    interview_type = Column(String(50), default="technical")  # technical, hr, final
    status = Column(String(50), default="scheduled")  # scheduled, completed, cancelled
    meeting_link = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)