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
from datetime import datetime, timezone

from app import d1_database
from app.config import get_settings
from app.database import create_db_client
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


async def get_or_create_system_user(db) -> dict:
    """Get or create a system user for CLI-generated episodes."""
    system_email = "system@your-podcast.local"
    user = await d1_database.get_user_by_email(db, system_email)
    if user:
        return user

    user = await d1_database.upsert_user(
        db,
        email=system_email,
        name="System",
        avatar_url="",
        provider="system",
        provider_id="system",
    )
    # Set default interests
    await d1_database.update_user_interests(
        db, user["id"], ["technology", "internet", "AI", "programming"]
    )
    user["interests"] = ["technology", "internet", "AI", "programming"]
    logger.info("Created system user: %s", user["id"])
    return user


def resolve_feeds(args: argparse.Namespace, settings_feeds: str) -> list[str]:
    """Resolve feed URLs from CLI args > env var > defaults."""
    if args.feeds:
        return [f.strip() for f in args.feeds.split(",") if f.strip()]
    if settings_feeds:
        return [f.strip() for f in settings_feeds.split(",") if f.strip()]
    return DEFAULT_FEEDS


async def async_main() -> None:
    args = parse_args()
    settings = get_settings()
    db = create_db_client(settings)

    feed_urls = resolve_feeds(args, settings.rss_feeds)
    episode_date = args.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Resolve user
    if args.user_id:
        user = await d1_database.get_user_by_id(db, args.user_id)
        if not user:
            logger.error("User %s not found", args.user_id)
            sys.exit(1)
    else:
        user = await get_or_create_system_user(db)

    # Create task
    task = await d1_database.create_task(
        db, user_id=user["id"], status="pending", progress="starting"
    )
    logger.info("Task %s created for user %s", task["id"], user["name"])

    # Run pipeline
    episode = await run_pipeline(
        user=user,
        feed_urls=feed_urls,
        episode_date=episode_date,
        task_id=task["id"],
        db=db,
        settings=settings,
        dry_run=args.dry_run,
    )

    if episode:
        logger.info("Done! Episode: %s", episode["title"])
    else:
        logger.warning("Pipeline completed with no episode")
        sys.exit(1)


def main() -> None:
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
