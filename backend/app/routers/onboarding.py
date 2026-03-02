from fastapi import APIRouter, Depends
from pydantic import BaseModel, field_validator
from sqlmodel import Session

from app.auth import get_current_user
from app.database import get_session
from app.models import User

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class InterestsBody(BaseModel):
    interests: list[str]

    @field_validator("interests", mode="before")
    @classmethod
    def clean_and_validate(cls, v: list[str]) -> list[str]:
        cleaned = [item[:50].strip() for item in v if isinstance(item, str) and item.strip()]
        if not cleaned:
            raise ValueError("At least 1 interest is required")
        if len(cleaned) > 10:
            raise ValueError("At most 10 interests allowed")
        return cleaned


@router.post("/interests")
async def set_interests(
    body: InterestsBody,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Reassign list to ensure SQLAlchemy detects the mutation
    current_user.interests = body.interests
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return {"interests": current_user.interests}


@router.get("/interests")
async def get_interests(current_user: User = Depends(get_current_user)):
    return {"interests": current_user.interests}
