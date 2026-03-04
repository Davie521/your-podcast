"""Pipeline orchestrator — runs the full podcast generation pipeline.

Each step updates the Task record so the frontend can poll progress.
"""

import logging
import uuid
from datetime import datetime, timezone

from app import d1_database
from app.config import Settings
from app.models import TaskStatus
from app.services import audio, cover, gemini, podcast, rss, storage, tts
from app.services.d1 import D1Client

logger = logging.getLogger(__name__)

DEFAULT_FEEDS = [
    "https://feeds.arstechnica.com/arstechnica/index",
    "https://www.theverge.com/rss/index.xml",
    "https://techcrunch.com/feed/",
]


async def _update_task(
    db: D1Client,
    task_id: str,
    progress: str,
    status: str = TaskStatus.processing,
) -> None:
    await d1_database.update_task(db, task_id, status=status, progress=progress)


async def run_pipeline(
    *,
    user: dict,
    feed_urls: list[str],
    episode_date: str,
    task_id: str,
    db: D1Client,
    settings: Settings,
    dry_run: bool = False,
) -> dict | None:
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
            task_id=task_id,
            db=db,
            settings=settings,
            dry_run=dry_run,
        )
    except Exception:
        logger.exception("Pipeline failed for task %s", task_id)
        await _update_task(db, task_id, "failed: unexpected error", TaskStatus.failed)
        return None


async def _run_pipeline_inner(
    *,
    user: dict,
    feed_urls: list[str],
    episode_date: str,
    task_id: str,
    db: D1Client,
    settings: Settings,
    dry_run: bool,
) -> dict | None:
    # Step 1: Fetch RSS
    await _update_task(db, task_id, "fetching_rss")
    logger.info("Fetching articles from %d feeds...", len(feed_urls))
    articles = await rss.fetch_articles(feed_urls)
    logger.info("Fetched %d articles", len(articles))

    if not articles:
        logger.warning("No articles found, aborting")
        await _update_task(db, task_id, "failed: no articles", TaskStatus.failed)
        return None

    # Step 2: Filter with Gemini
    await _update_task(db, task_id, "filtering_articles")
    logger.info("Filtering articles with Gemini...")
    filtered = await gemini.filter_articles(articles, user["interests"], settings.gemini_api_key)
    logger.info("Selected %d articles", len(filtered))

    # Step 3: Generate script via Podcastfy
    await _update_task(db, task_id, "generating_script")
    logger.info("Generating podcast script...")
    script_lines = await podcast.generate_script(filtered, settings.gemini_api_key)
    logger.info("Generated %d script lines", len(script_lines))

    if not script_lines:
        logger.error("Script generation failed, aborting")
        await _update_task(db, task_id, "failed: script generation", TaskStatus.failed)
        return None

    # Step 4: TTS synthesis
    await _update_task(db, task_id, "synthesizing_tts")
    logger.info("Synthesizing %d lines via TTS...", len(script_lines))
    audio_files = await tts.synthesize_lines(script_lines, settings)
    logger.info("TTS complete: %d files", len(audio_files))

    # Step 5: Merge audio
    await _update_task(db, task_id, "merging_audio")
    logger.info("Merging audio files...")
    mp3_path, duration = await audio.merge_audio(audio_files)
    logger.info("Merged → %s (%ds)", mp3_path, duration)

    # Step 6: Cover image
    try:
        dt = datetime.strptime(episode_date, "%Y-%m-%d")
        display_date = f"{dt.strftime('%b')} {dt.day}"
    except ValueError:
        logger.warning("Invalid episode_date '%s', falling back to raw value", episode_date)
        display_date = episode_date
    title = f"Your Podcast — {display_date}"
    cover_url = cover.generate_cover_url(title)

    # Step 7: Upload to R2
    if dry_run:
        audio_url = f"file://{mp3_path}"
        logger.info("[DRY RUN] Skipping R2 upload")
    else:
        await _update_task(db, task_id, "uploading")
        logger.info("Uploading to R2...")
        key = f"episodes/{episode_date}/{uuid.uuid4().hex}.mp3"
        audio_url = await storage.upload_to_r2(mp3_path, key, settings)
        logger.info("Uploaded → %s", audio_url)

    # Step 8: Save to database
    await _update_task(db, task_id, "saving")
    description = ", ".join(a["title"] for a in filtered[:5])
    now = datetime.now(timezone.utc).isoformat()
    episode_id = str(uuid.uuid4())

    episode = {
        "id": episode_id,
        "title": title,
        "description": description,
        "cover_url": cover_url,
        "audio_url": audio_url,
        "duration": duration,
        "is_public": True,
        "creator_id": user["id"],
        "published_at": now,
    }

    await d1_database.save_pipeline_result(
        db,
        task_id=task_id,
        episode=episode,
        sources=filtered,
        transcript_lines=script_lines,
    )

    logger.info("Episode saved: %s — %s", episode_id, title)
    return episode
