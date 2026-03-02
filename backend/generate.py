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
from app.models import Task, TaskStatus, User
from app.services.pipeline import DEFAULT_FEEDS, run_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("generate")


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
        interests=["technology", "internet", "AI", "programming"],
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

        # Run pipeline (delegating to the shared orchestrator)
        episode = asyncio.run(run_pipeline(
            user=user,
            feed_urls=feed_urls,
            episode_date=episode_date,
            task=task,
            session=session,
            settings=settings,
            dry_run=args.dry_run,
        ))

        if episode:
            logger.info("Done! Episode: %s", episode.title)
        else:
            logger.warning("Pipeline completed with no episode")
            sys.exit(1)


if __name__ == "__main__":
    main()
