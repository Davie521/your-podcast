from fastapi import APIRouter, Depends
from pydantic import BaseModel, field_validator

from app import d1_database
from app.auth import get_current_user
from app.database import get_db
from app.types import DatabaseClient

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

CATEGORIES: tuple[str, ...] = (
    "Arts & Culture",
    "Business",
    "Lifestyle",
    "Music",
    "Thought & Ideas",
)


@router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}


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
    current_user: dict = Depends(get_current_user),
    db: DatabaseClient = Depends(get_db),
):
    await d1_database.update_user_interests(db, current_user["id"], body.interests)
    return {"interests": body.interests}


@router.get("/interests")
async def get_interests(current_user: dict = Depends(get_current_user)):
    return {"interests": current_user["interests"]}
