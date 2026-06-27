from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.core.security import verify_token

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)

@router.get("/me")
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    payload = verify_token(token)

    email = payload.get("sub")

    user = db.query(User).filter(
        User.email == email
    ).first()

    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }