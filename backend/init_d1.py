#!/usr/bin/env python
"""Initialize database schema (works with both D1 and local SQLite).

Usage:
    python init_d1.py          # create tables + indexes
    python init_d1.py --drop   # drop all tables first, then recreate
"""

import argparse
import asyncio

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
    parser = argparse.ArgumentParser(description="Initialize database schema")
    parser.add_argument("--drop", action="store_true", help="Drop all tables before recreating")
    args = parser.parse_args()

    asyncio.run(init_schema(drop=args.drop))


if __name__ == "__main__":
    main()
