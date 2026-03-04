from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from app import d1_database
from app.auth import get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import TaskStatus
from app.schemas import TaskResponse
from app.services.d1 import D1Client, get_d1_client

DEFAULT_FEEDS = [
    "https://feeds.arstechnica.com/arstechnica/index",
    "https://www.theverge.com/rss/index.xml",
    "https://techcrunch.com/feed/",
]

router = APIRouter(prefix="/api", tags=["generate"])


class GenerateRequest(BaseModel):
    feeds: list[str] | None = None
    date: str | None = None


class GenerateResponse(BaseModel):
    task_id: str
    status: TaskStatus
    message: str


def _resolve_feeds(request_feeds: list[str] | None, settings: Settings) -> list[str]:
    if request_feeds:
        return request_feeds
    if settings.rss_feeds:
        return [f.strip() for f in settings.rss_feeds.split(",") if f.strip()]
    return DEFAULT_FEEDS


async def _run_in_background(
    task_id: str,
    user_id: str,
    feed_urls: list[str],
    episode_date: str,
    settings: Settings,
) -> None:
    """Background task wrapper — creates its own D1 client."""
    from app.services.pipeline import run_pipeline

    db = get_d1_client(settings)

    task = await d1_database.get_task_by_id(db, task_id)
    user = await d1_database.get_user_by_id(db, user_id)
    if not task or not user:
        return

    await run_pipeline(
        user=user,
        feed_urls=feed_urls,
        episode_date=episode_date,
        task_id=task_id,
        db=db,
        settings=settings,
    )


@router.post("/generate", response_model=GenerateResponse, status_code=202)
async def generate_episode(
    body: GenerateRequest = GenerateRequest(),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(get_current_user),
    db: D1Client = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    # Enforce one active task per user
    active_task = await d1_database.get_active_task(db, current_user["id"])
    if active_task:
        raise HTTPException(
            status_code=409,
            detail=f"You already have an active task: {active_task['id']}",
        )

    feed_urls = _resolve_feeds(body.feeds, settings)
    episode_date = body.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    task = await d1_database.create_task(
        db, user_id=current_user["id"], status="pending", progress="queued"
    )

    background_tasks.add_task(
        _run_in_background,
        task["id"],
        current_user["id"],
        feed_urls,
        episode_date,
        settings,
    )

    return GenerateResponse(
        task_id=task["id"],
        status=TaskStatus(task["status"]),
        message="Podcast generation started",
    )
