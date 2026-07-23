from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.project import Project, Sprint, Task
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.jobs import router as jobs_router
from app.routes.resumes import router as resumes_router
from app.routes.candidates_route import router as candidates_router
from app.routes.interview_api import router as interviews_router
from app.routes.project_api import router as projects_router
from app.routes.analytics_api import router as analytics_router
from app.routes.voice_api import router as voice_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-recruitment-platform-psi-umber.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])
app.include_router(resumes_router, prefix="/resumes", tags=["Resumes"])
app.include_router(candidates_router, prefix="/candidates", tags=["Candidates"])
app.include_router(interviews_router, prefix="/interviews", tags=["Interviews"])
app.include_router(projects_router, prefix="/projects", tags=["Projects"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(voice_router, prefix="/voice", tags=["Voice Screening"])

@app.get("/")
def root():
    return {
        "message": "AI Recruitment Platform Backend Running"
    }