from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from app.auth import get_current_user
from app.config import Settings, get_settings
from app.db import DatabaseClient, create_db_client, get_db
from app.db import queries
from app.schemas import TaskResponse, TaskStatus

DEFAULT_FEEDS = [
    "https://feeds.arstechnica.com/arstechnica/index",
    "https://www.theverge.com/rss/index.xml",
    "https://techcrunch.com/feed/",
]

router = APIRouter(prefix="/api", tags=["generate"])


class GenerateRequest(BaseModel):
    feeds: list[str] | None = None
    keywords: list[str] | None = None
    date: str | None = None
    voice_male: str | None = None
    voice_female: str | None = None


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
    keywords: list[str] | None = None,
    voice_male: str | None = None,
    voice_female: str | None = None,
) -> None:
    """Background task wrapper — creates its own DB client."""
    from app.services.pipeline import run_pipeline

    if voice_male or voice_female:
        settings = _apply_voice_overrides(settings, voice_male, voice_female)

    db = create_db_client(settings)
    try:
        task = await queries.get_task_by_id(db, task_id)
        user = await queries.get_user_by_id(db, user_id)
        if not task or not user:
            return

        await run_pipeline(
            user=user,
            feed_urls=feed_urls,
            episode_date=episode_date,
            task_id=task_id,
            db=db,
            settings=settings,
            keywords=keywords,
        )
    finally:
        await db.aclose()


def _apply_voice_overrides(
    settings: Settings,
    voice_male: str | None,
    voice_female: str | None,
) -> Settings:
    """Return a copy of settings with voice names overridden."""
    overrides: dict = {}
    if settings.tts_provider == "inworld":
        if voice_male:
            overrides["inworld_tts_voice_male"] = voice_male
        if voice_female:
            overrides["inworld_tts_voice_female"] = voice_female
    elif settings.tts_provider == "google":
        if voice_male:
            overrides["google_tts_voice_male"] = voice_male
        if voice_female:
            overrides["google_tts_voice_female"] = voice_female
    if not overrides:
        return settings
    return settings.model_copy(update=overrides)


@router.post("/generate", response_model=GenerateResponse, status_code=202)
async def generate_episode(
    body: GenerateRequest = GenerateRequest(),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(get_current_user),
    db: DatabaseClient = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    feed_urls = _resolve_feeds(body.feeds, settings)
    episode_date = body.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    try:
        task = await queries.create_task(
            db, user_id=current_user["id"], status="pending", progress="queued"
        )
    except ValueError:
        raise HTTPException(
            status_code=409,
            detail="You already have an active task",
        )

    background_tasks.add_task(
        _run_in_background,
        task["id"],
        current_user["id"],
        feed_urls,
        episode_date,
        settings,
        body.keywords,
        body.voice_male,
        body.voice_female,
    )

    return GenerateResponse(
        task_id=task["id"],
        status=TaskStatus(task["status"]),
        message="Podcast generation started",
    )
