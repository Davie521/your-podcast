#!/usr/bin/env python
"""Initialize database schema (works with both D1 and local SQLite).

DEPRECATED: Use wrangler d1 migrations for remote D1, or python migrate.py
for local SQLite. See docs/plans/2026-03-04-wrangler-d1-migrations-design.md.

Usage:
    python init_d1.py          # create tables + indexes
    python init_d1.py --drop   # drop all tables first, then recreate
"""

import argparse
import asyncio
import warnings

from app.database import create_db_client
from app.schema import DROP_STATEMENTS, SCHEMA_STATEMENTS


async def init_schema(drop: bool = False) -> None:
    db = create_db_client()
    try:
        if drop:
            print("Dropping existing tables...")
            stmts = [{"sql": s} for s in DROP_STATEMENTS]
            await db.batch(stmts)
            print("Tables dropped.")

        print("Creating tables and indexes...")
        stmts = [{"sql": s} for s in SCHEMA_STATEMENTS]
        await db.batch(stmts)
        print("Database schema initialized successfully.")
    finally:
        await db.aclose()


def main() -> None:
    warnings.warn(
        "init_d1.py is deprecated. Use 'wrangler d1 migrations apply' "
        "for remote D1, or 'python migrate.py' for local SQLite.",
        DeprecationWarning,
        stacklevel=1,
    )
    parser = argparse.ArgumentParser(description="Initialize database schema")
    parser.add_argument("--drop", action="store_true", help="Drop all tables before recreating")
    args = parser.parse_args()

    asyncio.run(init_schema(drop=args.drop))


if __name__ == "__main__":
    main()
