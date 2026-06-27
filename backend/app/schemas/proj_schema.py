from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    start_date: Optional[datetime]
    end_date: Optional[datetime]

    class Config:
        from_attributes = True

class SprintCreate(BaseModel):
    project_id: str
    name: str
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SprintResponse(BaseModel):
    id: str
    project_id: str
    name: str
    goal: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    status: str

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    project_id: str
    sprint_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = "medium"

class TaskResponse(BaseModel):
    id: str
    project_id: str
    sprint_id: Optional[str]
    title: str
    description: Optional[str]
    assigned_to: Optional[str]
    status: str
    priority: str

    class Config:
        from_attributes = True  