#!/usr/bin/env python
"""Initialize Cloudflare D1 database schema.

Usage:
    python init_d1.py          # create tables + indexes
    python init_d1.py --drop   # drop all tables first, then recreate

Requires env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, D1_DATABASE_ID
"""

import argparse
import asyncio

from app.services.d1 import get_d1_client

SCHEMA_STATEMENTS = [
    """CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        avatar_url TEXT NOT NULL DEFAULT '',
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        interests TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS idx_user_email ON user(email)",
    """CREATE TABLE IF NOT EXISTS episode (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        cover_url TEXT NOT NULL DEFAULT '',
        audio_url TEXT NOT NULL DEFAULT '',
        duration INTEGER NOT NULL DEFAULT 0,
        is_public INTEGER NOT NULL DEFAULT 1,
        creator_id TEXT NOT NULL REFERENCES user(id),
        published_at TEXT NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS idx_episode_creator ON episode(creator_id)",
    "CREATE INDEX IF NOT EXISTS idx_episode_public ON episode(is_public, published_at)",
    """CREATE TABLE IF NOT EXISTS source (
        id TEXT PRIMARY KEY,
        episode_id TEXT NOT NULL REFERENCES episode(id),
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        source TEXT NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS idx_source_episode ON source(episode_id)",
    """CREATE TABLE IF NOT EXISTS transcript_line (
        id TEXT PRIMARY KEY,
        episode_id TEXT NOT NULL REFERENCES episode(id),
        line_order INTEGER NOT NULL,
        speaker TEXT NOT NULL,
        text TEXT NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS idx_transcript_episode ON transcript_line(episode_id)",
    """CREATE TABLE IF NOT EXISTS task (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES user(id),
        status TEXT NOT NULL DEFAULT 'pending',
        progress TEXT NOT NULL DEFAULT '',
        episode_id TEXT REFERENCES episode(id),
        created_at TEXT NOT NULL
    )""",
    "CREATE INDEX IF NOT EXISTS idx_task_user ON task(user_id)",
]

DROP_STATEMENTS = [
    "DROP TABLE IF EXISTS transcript_line",
    "DROP TABLE IF EXISTS source",
    "DROP TABLE IF EXISTS task",
    "DROP TABLE IF EXISTS episode",
    "DROP TABLE IF EXISTS user",
]


async def init_schema(drop: bool = False) -> None:
    db = get_d1_client()

    if drop:
        print("Dropping existing tables...")
        stmts = [{"sql": s} for s in DROP_STATEMENTS]
        await db.batch(stmts)
        print("Tables dropped.")

    print("Creating tables and indexes...")
    stmts = [{"sql": s} for s in SCHEMA_STATEMENTS]
    await db.batch(stmts)
    print("D1 schema initialized successfully.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize D1 database schema")
    parser.add_argument("--drop", action="store_true", help="Drop all tables before recreating")
    args = parser.parse_args()

    asyncio.run(init_schema(drop=args.drop))


if __name__ == "__main__":
    main()
