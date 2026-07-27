from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.database.dependencies import get_db
from app.models.user import User
from app.core.security import verify_token, hash_password, verify_password
from app.services.email_service import _send_via_brevo

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)

ALLOWED_ROLES = [
    "super_admin",
    "hr_manager",
    "recruiter",
    "project_manager",
    "team_lead",
    "developer",
    "candidate",
]


def get_current_user_obj(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = verify_token(token)
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_super_admin(
    current_user: User = Depends(get_current_user_obj)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user


@router.get("/me")
def get_current_user(
    current_user: User = Depends(get_current_user_obj)
):
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


@router.patch("/me")
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    if payload.full_name:
        current_user.full_name = payload.full_name
    if payload.email:
        existing = db.query(User).filter(
            User.email == payload.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = payload.email
    db.commit()
    db.refresh(current_user)
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.patch("/me/password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_obj)
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.get("")
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin)
):
    users = db.query(User).all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active
        }
        for u in users
    ]


class RoleUpdate(BaseModel):
    role: str


def _send_role_update_email(to_email: str, to_name: str, new_role: str):
    display_role = new_role.replace('_', ' ').title()
    html = f"""
    <h2>Your Role Has Been Updated</h2>
    <p>Dear {to_name},</p>
    <p>Your role on the <strong>B2World AI Recruitment Platform</strong> has been updated to:</p>
    <p style="
        display: inline-block;
        padding: 10px 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
    ">{display_role}</p>
    <p>If you did not expect this change, please contact your administrator.</p>
    <br>
    <p>— B2World AI Recruitment Team</p>
    """
    _send_via_brevo(to_email, to_name, "Your Role Has Been Updated — B2World AI Recruitment", html)


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: RoleUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id and payload.role != "super_admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own super admin access")

    target_user.role = payload.role
    db.commit()
    db.refresh(target_user)

    background_tasks.add_task(
        _send_role_update_email,
        target_user.email,
        target_user.full_name,
        target_user.role
    )

    return {
        "id": str(target_user.id),
        "full_name": target_user.full_name,
        "email": target_user.email,
        "role": target_user.role
    }