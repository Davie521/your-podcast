"""Local SQLite client for development — same interface as D1Client."""

import logging
import os
import sqlite3

import aiosqlite

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "local.db")
MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "migrations")


def _apply_migrations_sync(db_path: str) -> None:
    """Apply pending migrations using synchronous sqlite3 (called once at init)."""
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute(
        """CREATE TABLE IF NOT EXISTS d1_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )"""
    )
    conn.commit()

    applied = {r[0] for r in conn.execute("SELECT name FROM d1_migrations").fetchall()}
    if not os.path.isdir(MIGRATIONS_DIR):
        conn.close()
        return
    files = sorted(f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql"))
    pending = [f for f in files if f not in applied]

    for fname in pending:
        with open(os.path.join(MIGRATIONS_DIR, fname)) as f:
            sql = f.read()
        logger.info("Applying migration %s", fname)
        conn.executescript(sql)
        conn.execute("INSERT INTO d1_migrations (name) VALUES (?)", [fname])
        conn.commit()

    conn.close()


class LocalSQLiteClient:
    """Drop-in replacement for D1Client using local SQLite via aiosqlite."""

    def __init__(self, db_path: str = DB_PATH) -> None:
        self._db_path = os.path.abspath(db_path)
        self._conn: aiosqlite.Connection | None = None

    async def _get_conn(self) -> aiosqlite.Connection:
        if self._conn is None:
            _apply_migrations_sync(self._db_path)
            self._conn = await aiosqlite.connect(self._db_path)
            self._conn.row_factory = aiosqlite.Row
            await self._conn.execute("PRAGMA journal_mode=WAL")
            await self._conn.execute("PRAGMA foreign_keys=ON")
        return self._conn

    async def execute(self, sql: str, params: list | None = None) -> list[dict]:
        conn = await self._get_conn()
        cursor = await conn.execute(sql, params or [])
        rows = await cursor.fetchall()
        if not sql.strip().upper().startswith(("SELECT", "PRAGMA")):
            await conn.commit()
        return [dict(row) for row in rows]

    async def batch(self, statements: list[dict]) -> list[list[dict]]:
        conn = await self._get_conn()
        all_results: list[list[dict]] = []
        for stmt in statements:
            cursor = await conn.execute(stmt["sql"], stmt.get("params", []))
            rows = await cursor.fetchall()
            all_results.append([dict(row) for row in rows])
        await conn.commit()
        return all_results

    async def aclose(self) -> None:
        if self._conn is not None:
            await self._conn.close()
            self._conn = None
