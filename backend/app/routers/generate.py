from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.auth import get_current_user
from app.config import Settings, get_settings
from app.database import get_session
from app.models import Task, TaskStatus, User
from app.schemas import TaskResponse
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
    """Background task wrapper — opens its own DB session."""
    from app.database import engine
    from app.services.pipeline import run_pipeline

    with Session(engine) as session:
        task = session.exec(select(Task).where(Task.id == task_id)).first()
        user = session.exec(select(User).where(User.id == user_id)).first()
        if not task or not user:
            return

        await run_pipeline(
            user=user,
            feed_urls=feed_urls,
            episode_date=episode_date,
            task=task,
            session=session,
            settings=settings,
        )


@router.post("/generate", response_model=GenerateResponse, status_code=202)
async def generate_episode(
    body: GenerateRequest = GenerateRequest(),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
):
    # Enforce one active task per user
    active_task = session.exec(
        select(Task).where(
            Task.user_id == current_user.id,
            Task.status.in_([TaskStatus.pending, TaskStatus.processing]),
        )
    ).first()
    if active_task:
        raise HTTPException(
            status_code=409,
            detail=f"You already have an active task: {active_task.id}",
        )

    feed_urls = _resolve_feeds(body.feeds, settings)
    episode_date = body.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    task = Task(user_id=current_user.id, status=TaskStatus.pending, progress="queued")
    session.add(task)
    session.commit()
    session.refresh(task)

    background_tasks.add_task(
        _run_in_background,
        task.id,
        current_user.id,
        feed_urls,
        episode_date,
        settings,
    )

    return GenerateResponse(
        task_id=task.id,
        status=task.status,
        message="Podcast generation started",
    )
