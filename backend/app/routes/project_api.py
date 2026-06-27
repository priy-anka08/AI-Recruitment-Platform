from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.project import Project, Sprint, Task
from app.schemas.proj_schema import (
    ProjectCreate, ProjectResponse,
    SprintCreate, SprintResponse,
    TaskCreate, TaskResponse
)
from typing import List
import uuid
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

router = APIRouter()

# Create project
@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    new_project = Project(id=str(uuid.uuid4()), **project.dict())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

# Get all projects
@router.get("/", response_model=List[ProjectResponse])
def get_all_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()

# Get single project
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# AI generate tasks for project
@router.post("/{project_id}/generate-tasks")
def generate_tasks(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    prompt = f"""
    Generate 8 development tasks for this project as JSON array only:
    Project: {project.name}
    Description: {project.description}

    Return only this JSON format, nothing else:
    [
        {{"title": "task name", "description": "task description", "priority": "high/medium/low"}},
        ...
    ]
    """
    response = model.generate_content(prompt)
    import json
    text = response.text.strip().replace("```json", "").replace("```", "").strip()
    tasks_data = json.loads(text)

    created_tasks = []
    for task_data in tasks_data:
        task = Task(
            id=str(uuid.uuid4()),
            project_id=project_id,
            title=task_data.get("title"),
            description=task_data.get("description"),
            priority=task_data.get("priority", "medium"),
            status="todo"
        )
        db.add(task)
        created_tasks.append(task)

    db.commit()
    return {"message": f"{len(created_tasks)} tasks generated", "tasks": [t.title for t in created_tasks]}

# Create sprint
@router.post("/sprint/create", response_model=SprintResponse)
def create_sprint(sprint: SprintCreate, db: Session = Depends(get_db)):
    new_sprint = Sprint(id=str(uuid.uuid4()), **sprint.dict())
    db.add(new_sprint)
    db.commit()
    db.refresh(new_sprint)
    return new_sprint

# Get sprints by project
@router.get("/{project_id}/sprints", response_model=List[SprintResponse])
def get_sprints(project_id: str, db: Session = Depends(get_db)):
    return db.query(Sprint).filter(Sprint.project_id == project_id).all()

# Get tasks by project
@router.get("/{project_id}/tasks", response_model=List[TaskResponse])
def get_tasks(project_id: str, db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.project_id == project_id).all()

# Update task status
@router.put("/task/{task_id}/status")
def update_task_status(task_id: str, status: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = status
    db.commit()
    return {"message": f"Task status updated to {status}"}