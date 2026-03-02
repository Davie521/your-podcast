"""Pipeline orchestrator — runs the full podcast generation pipeline.

Each step updates the Task record so the frontend can poll progress.
"""

import logging
import uuid
from datetime import datetime, timezone

from sqlmodel import Session

from app.config import Settings
from app.models import Episode, Source, Task, TaskStatus, TranscriptLine, User
from app.services import audio, cover, gemini, podcast, rss, storage, tts

logger = logging.getLogger(__name__)

DEFAULT_FEEDS = [
    "https://36kr.com/feed",
    "https://sspai.com/feed",
    "https://www.ifanr.com/feed",
]


def _update_task(
    session: Session,
    task: Task,
    progress: str,
    status: TaskStatus = TaskStatus.processing,
) -> None:
    task.status = status
    task.progress = progress
    session.add(task)
    session.commit()


async def run_pipeline(
    *,
    user: User,
    feed_urls: list[str],
    episode_date: str,
    task: Task,
    session: Session,
    settings: Settings,
    dry_run: bool = False,
) -> Episode | None:
    """Execute the full podcast generation pipeline.

    Steps: fetch RSS → filter with Gemini → generate script via Podcastfy
    → TTS synthesis → merge audio → cover image → upload to R2 → save to DB.

    Updates task.progress at each step for frontend polling.
    """
    try:
        return await _run_pipeline_inner(
            user=user,
            feed_urls=feed_urls,
            episode_date=episode_date,
            task=task,
            session=session,
            settings=settings,
            dry_run=dry_run,
        )
    except Exception:
        logger.exception("Pipeline failed for task %s", task.id)
        _update_task(session, task, "failed: unexpected error", TaskStatus.failed)
        return None


async def _run_pipeline_inner(
    *,
    user: User,
    feed_urls: list[str],
    episode_date: str,
    task: Task,
    session: Session,
    settings: Settings,
    dry_run: bool,
) -> Episode | None:
    # Step 1: Fetch RSS
    _update_task(session, task, "fetching_rss")
    logger.info("Fetching articles from %d feeds...", len(feed_urls))
    articles = await rss.fetch_articles(feed_urls)
    logger.info("Fetched %d articles", len(articles))

    if not articles:
        logger.warning("No articles found, aborting")
        _update_task(session, task, "failed: no articles", TaskStatus.failed)
        return None

    # Step 2: Filter with Gemini
    _update_task(session, task, "filtering_articles")
    logger.info("Filtering articles with Gemini...")
    filtered = await gemini.filter_articles(articles, user.interests, settings.gemini_api_key)
    logger.info("Selected %d articles", len(filtered))

    # Step 3: Generate script via Podcastfy
    _update_task(session, task, "generating_script")
    logger.info("Generating podcast script...")
    script_lines = await podcast.generate_script(filtered, settings.gemini_api_key)
    logger.info("Generated %d script lines", len(script_lines))

    if not script_lines:
        logger.error("Script generation failed, aborting")
        _update_task(session, task, "failed: script generation", TaskStatus.failed)
        return None

    # Step 4: TTS synthesis
    _update_task(session, task, "synthesizing_tts")
    logger.info("Synthesizing %d lines via TTS...", len(script_lines))
    audio_files = await tts.synthesize_lines(script_lines, settings)
    logger.info("TTS complete: %d files", len(audio_files))

    # Step 5: Merge audio
    _update_task(session, task, "merging_audio")
    logger.info("Merging audio files...")
    mp3_path, duration = await audio.merge_audio(audio_files)
    logger.info("Merged → %s (%ds)", mp3_path, duration)

    # Step 6: Cover image
    title = f"Your Podcast — {episode_date}"
    cover_url = cover.generate_cover_url(title)

    # Step 7: Upload to R2
    if dry_run:
        audio_url = f"file://{mp3_path}"
        logger.info("[DRY RUN] Skipping R2 upload")
    else:
        _update_task(session, task, "uploading")
        logger.info("Uploading to R2...")
        key = f"episodes/{episode_date}/{uuid.uuid4().hex}.mp3"
        audio_url = await storage.upload_to_r2(mp3_path, key, settings)
        logger.info("Uploaded → %s", audio_url)

    # Step 8: Save to database
    _update_task(session, task, "saving")
    description = "、".join(a["title"] for a in filtered[:5])
    episode = Episode(
        id=str(uuid.uuid4()),
        title=title,
        description=description,
        cover_url=cover_url,
        audio_url=audio_url,
        duration=duration,
        is_public=True,
        creator_id=user.id,
        published_at=datetime.now(timezone.utc),
    )
    session.add(episode)

    for article in filtered:
        session.add(Source(
            episode_id=episode.id,
            title=article["title"],
            url=article["url"],
            source=article["source"],
        ))

    for i, line in enumerate(script_lines):
        session.add(TranscriptLine(
            episode_id=episode.id,
            line_order=i,
            speaker=line["speaker"],
            text=line["text"],
        ))

    task.status = TaskStatus.completed
    task.progress = "done"
    task.episode_id = episode.id
    session.add(task)
    session.commit()

    logger.info("Episode saved: %s — %s", episode.id, episode.title)
    return episode
