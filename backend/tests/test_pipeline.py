"""Tests for the pipeline orchestrator (app/services/pipeline.py)."""

import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlmodel import Session

from app.config import Settings
from app.models import Episode, Source, Task, TaskStatus, TranscriptLine, User
from app.services.pipeline import run_pipeline


def _test_settings(**overrides) -> Settings:
    defaults = dict(
        database_url="sqlite://",
        session_secret="test",
        gemini_api_key="fake-gemini",
        glm_api_key="fake-glm",
        tts_voice_male="male",
        tts_voice_female="female",
        r2_account_id="fake-account",
        r2_access_key_id="fake-key",
        r2_secret_access_key="fake-secret",
        r2_bucket_name="fake-bucket",
        r2_public_url="https://cdn.example.com",
    )
    defaults.update(overrides)
    return Settings(**defaults)


def _make_user(session: Session) -> User:
    user = User(
        id=str(uuid.uuid4()),
        name="Pipeline User",
        email=f"pipeline-{uuid.uuid4().hex[:8]}@test.com",
        provider="system",
        provider_id="system",
        interests=["AI", "科技"],
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _make_task(session: Session, user: User) -> Task:
    task = Task(user_id=user.id, status=TaskStatus.pending, progress="starting")
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@pytest.mark.anyio
async def test_pipeline_no_articles(engine, session):
    """Pipeline fails gracefully when RSS returns no articles."""
    user = _make_user(session)
    task = _make_task(session, user)
    settings = _test_settings()

    with patch("app.services.pipeline.rss.fetch_articles", new_callable=AsyncMock, return_value=[]):
        result = await run_pipeline(
            user=user,
            feed_urls=["https://example.com/feed"],
            episode_date="2026-03-01",
            task=task,
            session=session,
            settings=settings,
        )

    assert result is None
    session.refresh(task)
    assert task.status == TaskStatus.failed
    assert "no articles" in task.progress


@pytest.mark.anyio
async def test_pipeline_script_generation_fails(engine, session):
    """Pipeline fails when script generation returns empty."""
    user = _make_user(session)
    task = _make_task(session, user)
    settings = _test_settings()

    articles = [{"title": "Test", "url": "https://x.com/1", "summary": "s", "source": "Feed", "published": ""}]

    with (
        patch("app.services.pipeline.rss.fetch_articles", new_callable=AsyncMock, return_value=articles),
        patch("app.services.pipeline.gemini.filter_articles", new_callable=AsyncMock, return_value=articles),
        patch("app.services.pipeline.podcast.generate_script", new_callable=AsyncMock, return_value=[]),
    ):
        result = await run_pipeline(
            user=user,
            feed_urls=["https://example.com/feed"],
            episode_date="2026-03-01",
            task=task,
            session=session,
            settings=settings,
        )

    assert result is None
    session.refresh(task)
    assert task.status == TaskStatus.failed
    assert "script generation" in task.progress


@pytest.mark.anyio
async def test_pipeline_full_success(engine, session):
    """Pipeline completes successfully and creates Episode + Sources + TranscriptLines."""
    user = _make_user(session)
    task = _make_task(session, user)
    settings = _test_settings()

    articles = [
        {"title": "AI News", "url": "https://x.com/1", "summary": "s", "source": "Feed", "published": ""},
        {"title": "Tech Update", "url": "https://x.com/2", "summary": "s", "source": "Feed", "published": ""},
    ]
    script_lines = [
        {"speaker": "小明", "text": "大家好"},
        {"speaker": "小红", "text": "欢迎收听"},
    ]

    with (
        patch("app.services.pipeline.rss.fetch_articles", new_callable=AsyncMock, return_value=articles),
        patch("app.services.pipeline.gemini.filter_articles", new_callable=AsyncMock, return_value=articles),
        patch("app.services.pipeline.podcast.generate_script", new_callable=AsyncMock, return_value=script_lines),
        patch("app.services.pipeline.tts.synthesize_lines", new_callable=AsyncMock, return_value=[Path("/tmp/a.wav"), Path("/tmp/b.wav")]),
        patch("app.services.pipeline.audio.merge_audio", new_callable=AsyncMock, return_value=(Path("/tmp/out.mp3"), 120)),
        patch("app.services.pipeline.storage.upload_to_r2", new_callable=AsyncMock, return_value="https://cdn.example.com/ep.mp3"),
    ):
        result = await run_pipeline(
            user=user,
            feed_urls=["https://example.com/feed"],
            episode_date="2026-03-01",
            task=task,
            session=session,
            settings=settings,
        )

    assert result is not None
    assert result.title == "Your Podcast — 2026-03-01"
    assert result.duration == 120
    assert result.creator_id == user.id

    # Check task completed
    session.refresh(task)
    assert task.status == TaskStatus.completed
    assert task.progress == "done"
    assert task.episode_id == result.id

    # Check sources saved
    from sqlmodel import select
    sources = session.exec(select(Source).where(Source.episode_id == result.id)).all()
    assert len(sources) == 2

    # Check transcript saved
    lines = session.exec(select(TranscriptLine).where(TranscriptLine.episode_id == result.id)).all()
    assert len(lines) == 2
    assert lines[0].speaker == "小明"


@pytest.mark.anyio
async def test_pipeline_dry_run_skips_upload(engine, session):
    """In dry_run mode, pipeline skips R2 upload."""
    user = _make_user(session)
    task = _make_task(session, user)
    settings = _test_settings()

    articles = [{"title": "Test", "url": "https://x.com/1", "summary": "s", "source": "Feed", "published": ""}]
    script_lines = [{"speaker": "小明", "text": "测试"}]

    with (
        patch("app.services.pipeline.rss.fetch_articles", new_callable=AsyncMock, return_value=articles),
        patch("app.services.pipeline.gemini.filter_articles", new_callable=AsyncMock, return_value=articles),
        patch("app.services.pipeline.podcast.generate_script", new_callable=AsyncMock, return_value=script_lines),
        patch("app.services.pipeline.tts.synthesize_lines", new_callable=AsyncMock, return_value=[Path("/tmp/a.wav")]),
        patch("app.services.pipeline.audio.merge_audio", new_callable=AsyncMock, return_value=(Path("/tmp/out.mp3"), 60)),
        patch("app.services.pipeline.storage.upload_to_r2", new_callable=AsyncMock) as mock_upload,
    ):
        result = await run_pipeline(
            user=user,
            feed_urls=["https://example.com/feed"],
            episode_date="2026-03-01",
            task=task,
            session=session,
            settings=settings,
            dry_run=True,
        )

    assert result is not None
    assert result.audio_url.startswith("file://")
    mock_upload.assert_not_called()


@pytest.mark.anyio
async def test_pipeline_unexpected_error_marks_failed(engine, session):
    """Unexpected exceptions are caught and mark the task as failed."""
    user = _make_user(session)
    task = _make_task(session, user)
    settings = _test_settings()

    with patch("app.services.pipeline.rss.fetch_articles", new_callable=AsyncMock, side_effect=RuntimeError("boom")):
        result = await run_pipeline(
            user=user,
            feed_urls=["https://example.com/feed"],
            episode_date="2026-03-01",
            task=task,
            session=session,
            settings=settings,
        )

    assert result is None
    session.refresh(task)
    assert task.status == TaskStatus.failed
    assert "unexpected error" in task.progress
