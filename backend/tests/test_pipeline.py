"""Tests for the pipeline orchestrator (app/services/pipeline.py)."""

import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app import d1_database
from app.config import Settings
from app.models import TaskStatus
from app.services.pipeline import run_pipeline


def _test_settings(**overrides) -> Settings:
    defaults = dict(
        cloudflare_account_id="test",
        cloudflare_api_token="test",
        d1_database_id="test",
        session_secret="test",
        gemini_api_key="fake-gemini",
        r2_account_id="fake-account",
        r2_access_key_id="fake-key",
        r2_secret_access_key="fake-secret",
        r2_bucket_name="fake-bucket",
        r2_public_url="https://cdn.example.com",
    )
    defaults.update(overrides)
    return Settings(**defaults)


async def _make_user(db) -> dict:
    user = await d1_database.upsert_user(
        db,
        email=f"pipeline-{uuid.uuid4().hex[:8]}@test.com",
        name="Pipeline User",
        avatar_url="",
        provider="system",
        provider_id="system",
    )
    await d1_database.update_user_interests(db, user["id"], ["AI", "\u79d1\u6280"])
    user["interests"] = ["AI", "\u79d1\u6280"]
    return user


async def _make_task(db, user: dict) -> dict:
    return await d1_database.create_task(
        db, user_id=user["id"], status=TaskStatus.pending, progress="starting"
    )


@pytest.mark.anyio
async def test_pipeline_no_articles(db):
    """Pipeline fails gracefully when RSS returns no articles."""
    user = await _make_user(db)
    task = await _make_task(db, user)
    settings = _test_settings()

    with patch("app.services.pipeline.rss.fetch_articles", new_callable=AsyncMock, return_value=[]):
        result = await run_pipeline(
            user=user,
            feed_urls=["https://example.com/feed"],
            episode_date="2026-03-01",
            task_id=task["id"],
            db=db,
            settings=settings,
        )

    assert result is None
    task = await d1_database.get_task_by_id(db, task["id"])
    assert task["status"] == TaskStatus.failed
    assert "no articles" in task["progress"]


@pytest.mark.anyio
async def test_pipeline_script_generation_fails(db):
    """Pipeline fails when script generation returns empty."""
    user = await _make_user(db)
    task = await _make_task(db, user)
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
            task_id=task["id"],
            db=db,
            settings=settings,
        )

    assert result is None
    task = await d1_database.get_task_by_id(db, task["id"])
    assert task["status"] == TaskStatus.failed
    assert "script generation" in task["progress"]


@pytest.mark.anyio
async def test_pipeline_full_success(db):
    """Pipeline completes successfully and creates Episode + Sources + TranscriptLines."""
    user = await _make_user(db)
    task = await _make_task(db, user)
    settings = _test_settings()

    articles = [
        {"title": "AI News", "url": "https://x.com/1", "summary": "s", "source": "Feed", "published": ""},
        {"title": "Tech Update", "url": "https://x.com/2", "summary": "s", "source": "Feed", "published": ""},
    ]
    script_lines = [
        {"speaker": "\u5c0f\u660e", "text": "\u5927\u5bb6\u597d"},
        {"speaker": "\u5c0f\u7ea2", "text": "\u6b22\u8fce\u6536\u542c"},
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
            task_id=task["id"],
            db=db,
            settings=settings,
        )

    assert result is not None
    assert result["title"] == "Your Podcast \u2014 2026-03-01"
    assert result["duration"] == 120
    assert result["creator_id"] == user["id"]

    # Check task completed
    task = await d1_database.get_task_by_id(db, task["id"])
    assert task["status"] == TaskStatus.completed
    assert task["progress"] == "done"
    assert task["episode_id"] == result["id"]

    # Check sources saved
    sources = await db.execute(
        "SELECT * FROM source WHERE episode_id = ?", [result["id"]]
    )
    assert len(sources) == 2

    # Check transcript saved
    lines = await db.execute(
        "SELECT * FROM transcript_line WHERE episode_id = ? ORDER BY line_order",
        [result["id"]],
    )
    assert len(lines) == 2
    assert lines[0]["speaker"] == "\u5c0f\u660e"


@pytest.mark.anyio
async def test_pipeline_dry_run_skips_upload(db):
    """In dry_run mode, pipeline skips R2 upload."""
    user = await _make_user(db)
    task = await _make_task(db, user)
    settings = _test_settings()

    articles = [{"title": "Test", "url": "https://x.com/1", "summary": "s", "source": "Feed", "published": ""}]
    script_lines = [{"speaker": "\u5c0f\u660e", "text": "\u6d4b\u8bd5"}]

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
            task_id=task["id"],
            db=db,
            settings=settings,
            dry_run=True,
        )

    assert result is not None
    assert result["audio_url"].startswith("file://")
    mock_upload.assert_not_called()


@pytest.mark.anyio
async def test_pipeline_unexpected_error_marks_failed(db):
    """Unexpected exceptions are caught and mark the task as failed."""
    user = await _make_user(db)
    task = await _make_task(db, user)
    settings = _test_settings()

    with patch("app.services.pipeline.rss.fetch_articles", new_callable=AsyncMock, side_effect=RuntimeError("boom")):
        result = await run_pipeline(
            user=user,
            feed_urls=["https://example.com/feed"],
            episode_date="2026-03-01",
            task_id=task["id"],
            db=db,
            settings=settings,
        )

    assert result is None
    task = await d1_database.get_task_by_id(db, task["id"])
    assert task["status"] == TaskStatus.failed
    assert "unexpected error" in task["progress"]
