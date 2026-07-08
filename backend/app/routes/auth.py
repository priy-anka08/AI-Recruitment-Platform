from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import secrets

from app.schemas.user import UserCreate, UserLogin
from app.database.dependencies import get_db
from app.models.user import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.services.email_service import send_reset_email

router = APIRouter()

# In-memory reset token store
reset_tokens = {}


@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        return {"message": "Email already registered"}

    hashed_password = hash_password(user.password)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()

    return {"message": "User registered successfully"}


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        return {"message": "Invalid email or password"}

    if not verify_password(user.password, db_user.password_hash):
        return {"message": "Invalid email or password"}

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role,
            "full_name": db_user.full_name
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == payload.email).first()

    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If this email exists, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    expiry = datetime.utcnow() + timedelta(minutes=15)
    reset_tokens[token] = {"email": payload.email, "expiry": expiry}

    background_tasks.add_task(send_reset_email, payload.email, token)

    return {"message": "If this email exists, a reset link has been sent."}


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    token_data = reset_tokens.get(payload.token)

    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if datetime.utcnow() > token_data["expiry"]:
        reset_tokens.pop(payload.token, None)
        raise HTTPException(status_code=400, detail="Token has expired")

    user = db.query(User).filter(User.email == token_data["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    reset_tokens.pop(payload.token, None)

    return {"message": "Password reset successfully"}