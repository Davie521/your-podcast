#!/usr/bin/env python
"""Apply migrations from migrations/ to local SQLite database.

Mirrors wrangler d1 migrations for local development.

Usage:
    python migrate.py              # apply pending migrations
    python migrate.py --status     # show migration status
"""

import argparse
import os
import sqlite3

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")
DB_PATH = os.path.join(os.path.dirname(__file__), "local.db")


def get_migration_files() -> list[str]:
    """Return sorted list of .sql migration filenames."""
    if not os.path.isdir(MIGRATIONS_DIR):
        return []
    files = [f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql")]
    return sorted(files)


def ensure_migrations_table(conn: sqlite3.Connection) -> None:
    conn.execute(
        """CREATE TABLE IF NOT EXISTS d1_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )"""
    )
    conn.commit()


def get_applied(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT name FROM d1_migrations").fetchall()
    return {r[0] for r in rows}


def apply_migrations(db_path: str = DB_PATH) -> None:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    ensure_migrations_table(conn)

    applied = get_applied(conn)
    files = get_migration_files()
    pending = [f for f in files if f not in applied]

    if not pending:
        print("No pending migrations.")
        return

    for fname in pending:
        path = os.path.join(MIGRATIONS_DIR, fname)
        with open(path) as f:
            sql = f.read()
        print(f"Applying {fname}...")
        conn.executescript(sql)
        conn.execute("INSERT INTO d1_migrations (name) VALUES (?)", [fname])
        conn.commit()
        print(f"  done: {fname}")

    print(f"Applied {len(pending)} migration(s).")
    conn.close()


def show_status(db_path: str = DB_PATH) -> None:
    files = get_migration_files()
    if not files:
        print("No migration files found.")
        return

    applied: set[str] = set()
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        ensure_migrations_table(conn)
        applied = get_applied(conn)
        conn.close()

    for f in files:
        status = "applied" if f in applied else "pending"
        print(f"  [{status}] {f}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply D1 migrations to local SQLite")
    parser.add_argument("--status", action="store_true", help="Show migration status")
    parser.add_argument("--db", default=DB_PATH, help="SQLite database path")
    args = parser.parse_args()

    if args.status:
        show_status(args.db)
    else:
        apply_migrations(args.db)


if __name__ == "__main__":
    main()
