from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/calendar']
CREDENTIALS_FILE = os.getenv("GOOGLE_CALENDAR_CREDENTIALS", "calendar_credentials.json")
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "snehamittle15@gmail.com")


def get_calendar_service():
    credentials = service_account.Credentials.from_service_account_file(
        CREDENTIALS_FILE, scopes=SCOPES
    )
    service = build('calendar', 'v3', credentials=credentials)
    return service


def create_calendar_event(
    title: str,
    description: str,
    start_time: str,
    duration_minutes,
    attendee_email: str = None,
    meeting_link: str = None,
):
    try:
        service = get_calendar_service()

        start_dt = datetime.fromisoformat(str(start_time))
        end_dt = start_dt + timedelta(minutes=int(duration_minutes))

        if meeting_link:
            description += f"\n\nMeeting Link: {meeting_link}"

        if attendee_email:
            description += f"\n\nCandidate Email: {attendee_email}"

        event = {
            'summary': title,
            'description': description,
            'start': {
                'dateTime': start_dt.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'end': {
                'dateTime': end_dt.isoformat(),
                'timeZone': 'Asia/Kolkata',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 60},
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }

        created_event = service.events().insert(
            calendarId=CALENDAR_ID,
            body=event,
            sendUpdates='none'
        ).execute()

        return {
            "success": True,
            "event_id": created_event.get('id'),
            "event_link": created_event.get('htmlLink')
        }

    except Exception as e:
        print(f"Calendar error: {e}")
        return {"success": False, "error": str(e)}


def delete_calendar_event(event_id: str):
    try:
        service = get_calendar_service()
        service.events().delete(
            calendarId=CALENDAR_ID,
            eventId=event_id
        ).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}