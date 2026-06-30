from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserLogin
from app.database.dependencies import get_db
from app.models.user import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter()


@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        return {
            "message": "Email already registered"
        }

    hashed_password = hash_password(
        user.password
    )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()

    return {
        "message": "User registered successfully"
    }


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        return {
            "message": "Invalid email or password"
        }

    if not verify_password(
        user.password,
        db_user.password_hash
    ):
        return {
            "message": "Invalid email or password"
        }

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