from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.dependencies import get_db
from app.models.interview import Interview
from app.models.candidate import Candidate
from app.schemas.interview_schema import InterviewCreate, InterviewResponse
from app.services.email_service import send_interview_reminder, send_slot_selection_email
from app.services.calendar_service import create_calendar_event, delete_calendar_event
from typing import List
from datetime import datetime, timedelta
import uuid
import secrets

router = APIRouter()

# In-memory slot selection tokens
slot_tokens = {}


# Auto slot generation
@router.get("/slots")
def get_available_slots(
    date: str,
    duration_minutes: int = 60
):
    try:
        base_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    slots = []
    start_hour = 9
    end_hour = 18

    current = base_date.replace(hour=start_hour, minute=0, second=0)
    end = base_date.replace(hour=end_hour, minute=0, second=0)

    while current + timedelta(minutes=duration_minutes) <= end:
        slots.append({
            "start": current.strftime("%Y-%m-%dT%H:%M"),
            "end": (current + timedelta(minutes=duration_minutes)).strftime("%Y-%m-%dT%H:%M"),
            "label": current.strftime("%I:%M %p") + " - " + (current + timedelta(minutes=duration_minutes)).strftime("%I:%M %p"),
        })
        current += timedelta(minutes=duration_minutes)

    return {"date": date, "duration_minutes": duration_minutes, "slots": slots}


# Send slot selection email to candidate
@router.post("/send-slots/{candidate_id}")
async def send_slots_to_candidate(
    candidate_id: str,
    date: str,
    duration_minutes: int = 60,
    interview_type: str = "technical",
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    base_date = datetime.strptime(date, "%Y-%m-%d")
    slots = []
    current = base_date.replace(hour=9, minute=0, second=0)
    end = base_date.replace(hour=18, minute=0, second=0)

    while current + timedelta(minutes=duration_minutes) <= end:
        slots.append({
            "start": current.strftime("%Y-%m-%dT%H:%M"),
            "label": current.strftime("%I:%M %p") + " - " + (current + timedelta(minutes=duration_minutes)).strftime("%I:%M %p"),
        })
        current += timedelta(minutes=duration_minutes)

    token = secrets.token_urlsafe(32)
    slot_tokens[token] = {
        "candidate_id": candidate_id,
        "candidate_name": candidate.full_name,
        "date": date,
        "duration_minutes": duration_minutes,
        "interview_type": interview_type,
        "slots": slots,
        "expiry": datetime.utcnow() + timedelta(hours=48)
    }

    selection_link = f"http://localhost:3000/select-slot?token={token}"

    background_tasks.add_task(
        send_slot_selection_email,
        email=candidate.email,
        candidate_name=candidate.full_name,
        date=date,
        slots=slots,
        selection_link=selection_link,
        interview_type=interview_type,
    )

    return {"message": "Slot selection email sent", "token": token}


# Get slots for candidate selection
@router.get("/select-slot/{token}")
def get_slots_for_candidate(token: str):
    data = slot_tokens.get(token)
    if not data:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if datetime.utcnow() > data["expiry"]:
        slot_tokens.pop(token, None)
        raise HTTPException(status_code=400, detail="Token has expired")
    return {
        "candidate_name": data["candidate_name"],
        "date": data["date"],
        "interview_type": data["interview_type"],
        "slots": data["slots"],
    }


# Confirm slot selection by candidate
@router.post("/confirm-slot")
async def confirm_slot(
    token: str,
    selected_slot: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    data = slot_tokens.get(token)
    if not data:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if datetime.utcnow() > data["expiry"]:
        slot_tokens.pop(token, None)
        raise HTTPException(status_code=400, detail="Token has expired")

    candidate_id = data["candidate_id"]
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    new_interview = Interview(
        id=str(uuid.uuid4()),
        candidate_id=candidate_id,
        job_id=candidate.job_id,
        scheduled_time=datetime.fromisoformat(selected_slot),
        interview_type=data["interview_type"],
        duration_minutes=data["duration_minutes"],
        status="scheduled",
        notes="Slot selected by candidate"
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    scheduled_time_str = datetime.fromisoformat(selected_slot).strftime("%d %B %Y, %I:%M %p")

    # Add to Google Calendar
    background_tasks.add_task(
        create_calendar_event,
        title=f"Interview - {candidate.full_name} ({data['interview_type'].title()} Round)",
        description=f"Candidate: {candidate.full_name}\nEmail: {candidate.email}\nInterview Type: {data['interview_type'].title()} Round\nSelected by candidate",
        start_time=selected_slot,
        duration_minutes=data["duration_minutes"],
        attendee_email=candidate.email,
    )

    background_tasks.add_task(
        send_interview_reminder,
        email=candidate.email,
        candidate_name=candidate.full_name,
        interview_type=data["interview_type"],
        scheduled_time=scheduled_time_str,
        duration_minutes=data["duration_minutes"],
        meeting_link=None,
        notes="Your interview has been confirmed!",
    )

    slot_tokens.pop(token, None)

    return {
        "message": "Interview scheduled successfully!",
        "scheduled_time": scheduled_time_str,
        "interview_id": str(new_interview.id)
    }


# Schedule interview with email reminder + calendar event
@router.post("/", response_model=InterviewResponse)
async def schedule_interview(
    interview: InterviewCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    new_interview = Interview(
        id=str(uuid.uuid4()),
        **interview.dict()
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    candidate = db.query(Candidate).filter(
        Candidate.id == interview.candidate_id
    ).first()

    if candidate and candidate.email:
        scheduled_time_str = datetime.fromisoformat(
            str(interview.scheduled_time)
        ).strftime("%d %B %Y, %I:%M %p")

        # Send email reminder
        background_tasks.add_task(
            send_interview_reminder,
            email=candidate.email,
            candidate_name=candidate.full_name,
            interview_type=interview.interview_type,
            scheduled_time=scheduled_time_str,
            duration_minutes=interview.duration_minutes,
            meeting_link=interview.meeting_link,
            notes=interview.notes,
        )

        # Add to Google Calendar
        background_tasks.add_task(
            create_calendar_event,
            title=f"Interview - {candidate.full_name} ({interview.interview_type.title()} Round)",
            description=f"Candidate: {candidate.full_name}\nEmail: {candidate.email}\nInterview Type: {interview.interview_type.title()} Round\nNotes: {interview.notes or 'N/A'}",
            start_time=str(interview.scheduled_time),
            duration_minutes=interview.duration_minutes,
            attendee_email=candidate.email,
            meeting_link=interview.meeting_link,
        )

    return new_interview


# Get all interviews
@router.get("/", response_model=List[InterviewResponse])
def get_all_interviews(db: Session = Depends(get_db)):
    return db.query(Interview).all()


# Get interview by id
@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(
        Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


# Get interviews by candidate
@router.get("/candidate/{candidate_id}", response_model=List[InterviewResponse])
def get_by_candidate(candidate_id: str, db: Session = Depends(get_db)):
    return db.query(Interview).filter(
        Interview.candidate_id == candidate_id
    ).all()


# Update interview status
@router.put("/{interview_id}/status")
def update_interview_status(
    interview_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    interview.status = status
    db.commit()
    db.refresh(interview)
    return {"message": f"Status updated to {status}", "interview": interview}


# Cancel interview
@router.delete("/{interview_id}")
def cancel_interview(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(
        Interview.id == interview_id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    interview.status = "cancelled"
    db.commit()
    return {"message": "Interview cancelled successfully"}