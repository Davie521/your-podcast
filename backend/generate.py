#!/usr/bin/env python
"""CLI script for standalone podcast generation.

Usage:
    python generate.py                           # use defaults
    python generate.py --user-id <uuid>          # generate for a specific user
    python generate.py --feeds "url1,url2"       # override RSS feeds
    python generate.py --date 2026-03-01         # tag with a specific date
"""

import argparse
import asyncio
import logging
import sys
import uuid
from datetime import datetime, timezone

from sqlmodel import Session, select

from app.config import get_settings
from app.database import create_db_and_tables, engine
from app.models import Episode, Source, Task, TaskStatus, TranscriptLine, User
from app.services import audio, cover, gemini, podcast, rss, storage, tts

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("generate")

# Default Chinese tech RSS feeds
DEFAULT_FEEDS = [
    "https://36kr.com/feed",
    "https://sspai.com/feed",
    "https://www.ifanr.com/feed",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a podcast episode")
    parser.add_argument("--user-id", help="User ID to generate for (creates system user if omitted)")
    parser.add_argument("--feeds", help="Comma-separated RSS feed URLs (overrides env/defaults)")
    parser.add_argument("--date", help="Episode date tag (YYYY-MM-DD, defaults to today)")
    parser.add_argument("--dry-run", action="store_true", help="Run pipeline but skip R2 upload")
    return parser.parse_args()


def get_or_create_system_user(session: Session) -> User:
    """Get or create a system user for CLI-generated episodes."""
    system_email = "system@your-podcast.local"
    user = session.exec(select(User).where(User.email == system_email)).first()
    if user:
        return user

    user = User(
        id=str(uuid.uuid4()),
        name="System",
        email=system_email,
        provider="system",
        provider_id="system",
        interests=["科技", "互联网", "AI", "编程"],
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    logger.info("Created system user: %s", user.id)
    return user


def resolve_feeds(args: argparse.Namespace, settings_feeds: str) -> list[str]:
    """Resolve feed URLs from CLI args > env var > defaults."""
    if args.feeds:
        return [f.strip() for f in args.feeds.split(",") if f.strip()]
    if settings_feeds:
        return [f.strip() for f in settings_feeds.split(",") if f.strip()]
    return DEFAULT_FEEDS


async def run_pipeline(
    user: User,
    feed_urls: list[str],
    episode_date: str,
    dry_run: bool,
    task: Task,
    session: Session,
) -> Episode | None:
    settings = get_settings()

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


def _update_task(session: Session, task: Task, progress: str, status: TaskStatus = TaskStatus.processing) -> None:
    task.status = status
    task.progress = progress
    session.add(task)
    session.commit()


def main() -> None:
    args = parse_args()
    settings = get_settings()
    create_db_and_tables()

    feed_urls = resolve_feeds(args, settings.rss_feeds)
    episode_date = args.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    with Session(engine) as session:
        # Resolve user
        if args.user_id:
            user = session.exec(select(User).where(User.id == args.user_id)).first()
            if not user:
                logger.error("User %s not found", args.user_id)
                sys.exit(1)
        else:
            user = get_or_create_system_user(session)

        # Create task
        task = Task(user_id=user.id, status=TaskStatus.pending, progress="starting")
        session.add(task)
        session.commit()
        session.refresh(task)
        logger.info("Task %s created for user %s", task.id, user.name)

        # Run pipeline
        try:
            episode = asyncio.run(run_pipeline(user, feed_urls, episode_date, args.dry_run, task, session))
        except Exception:
            logger.exception("Pipeline failed")
            _update_task(session, task, "failed: unexpected error", TaskStatus.failed)
            sys.exit(1)

        if episode:
            logger.info("Done! Episode: %s", episode.title)
        else:
            logger.warning("Pipeline completed with no episode")
            sys.exit(1)


if __name__ == "__main__":
    main()
