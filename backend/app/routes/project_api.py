from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.project import Project, Sprint, Task
from app.models.user import User
from app.schemas.proj_schema import (
    ProjectCreate, ProjectResponse,
    SprintCreate, SprintResponse,
    TaskCreate, TaskResponse
)
from typing import List
import uuid
import json
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

router = APIRouter()


@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    new_project = Project(id=str(uuid.uuid4()), **project.dict())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.get("/", response_model=List[ProjectResponse])
def get_all_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


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


@router.post("/{project_id}/generate-sprints")
def generate_sprints(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    task_titles = [t.title for t in tasks] if tasks else []

    prompt = f"""
    Generate 3 sprints for this project as JSON array only:
    Project: {project.name}
    Description: {project.description}
    Available Tasks: {task_titles}

    Return only this JSON format, nothing else:
    [
        {{
            "name": "Sprint 1 name",
            "goal": "sprint goal description",
            "duration_weeks": 2,
            "tasks": ["task1 title", "task2 title"]
        }},
        ...
    ]
    """
    response = model.generate_content(prompt)
    text = response.text.strip().replace("```json", "").replace("```", "").strip()
    sprints_data = json.loads(text)

    created_sprints = []
    sprint_start = datetime.utcnow()

    for i, sprint_data in enumerate(sprints_data):
        duration_weeks = sprint_data.get("duration_weeks", 2)
        sprint_end = sprint_start + timedelta(weeks=duration_weeks)

        sprint = Sprint(
            id=str(uuid.uuid4()),
            project_id=project_id,
            name=sprint_data.get("name", f"Sprint {i+1}"),
            goal=sprint_data.get("goal", ""),
            start_date=sprint_start,
            end_date=sprint_end,
            status="planned"
        )
        db.add(sprint)
        db.flush()

        sprint_tasks = sprint_data.get("tasks", [])
        for task_title in sprint_tasks:
            task = db.query(Task).filter(
                Task.project_id == project_id,
                Task.title.ilike(f"%{task_title[:20]}%")
            ).first()
            if task and not task.sprint_id:
                task.sprint_id = sprint.id

        created_sprints.append(sprint)
        sprint_start = sprint_end

    db.commit()
    return {
        "message": f"{len(created_sprints)} sprints generated",
        "sprints": [
            {
                "id": str(s.id),
                "name": s.name,
                "goal": s.goal,
                "start_date": s.start_date.strftime("%Y-%m-%d"),
                "end_date": s.end_date.strftime("%Y-%m-%d"),
                "status": s.status
            }
            for s in created_sprints
        ]
    }


@router.get("/{project_id}/sprints")
def get_sprints(project_id: str, db: Session = Depends(get_db)):
    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).all()
    result = []
    for sprint in sprints:
        tasks = db.query(Task).filter(Task.sprint_id == sprint.id).all()
        result.append({
            "id": str(sprint.id),
            "name": sprint.name,
            "goal": sprint.goal,
            "start_date": sprint.start_date.strftime("%Y-%m-%d") if sprint.start_date else None,
            "end_date": sprint.end_date.strftime("%Y-%m-%d") if sprint.end_date else None,
            "status": sprint.status,
            "tasks": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "priority": t.priority,
                    "status": t.status,
                    "assigned_to": t.assigned_to
                }
                for t in tasks
            ]
        })
    return result


@router.put("/sprint/{sprint_id}/status")
def update_sprint_status(sprint_id: str, status: str, db: Session = Depends(get_db)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint.status = status
    db.commit()
    return {"message": f"Sprint status updated to {status}"}


@router.get("/{project_id}/tasks")
def get_tasks(project_id: str, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    return [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "status": t.status,
            "assigned_to": t.assigned_to,
            "sprint_id": t.sprint_id
        }
        for t in tasks
    ]


@router.put("/task/{task_id}/status")
def update_task_status(task_id: str, status: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = status
    db.commit()
    return {"message": f"Task status updated to {status}"}


@router.put("/task/{task_id}/assign")
def assign_task(task_id: str, assigned_to: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.assigned_to = assigned_to
    db.commit()
    return {"message": f"Task assigned to {assigned_to}"}


@router.get("/{project_id}/team")
def get_project_team(project_id: str, db: Session = Depends(get_db)):
    developers = db.query(User).filter(
        User.role.in_(["developer", "team_lead", "project_manager"])
    ).all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role
        }
        for u in developers
    ]


@router.post("/sprint/create", response_model=SprintResponse)
def create_sprint(sprint: SprintCreate, db: Session = Depends(get_db)):
    new_sprint = Sprint(id=str(uuid.uuid4()), **sprint.dict())
    db.add(new_sprint)
    db.commit()
    db.refresh(new_sprint)
    return new_sprint