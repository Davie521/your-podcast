# Wrangler D1 Migrations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace ad-hoc `init_d1.py` + `schema.py` schema management with Wrangler D1 native migrations, ensuring versioned, auditable database changes for both production (D1) and local dev (SQLite).

**Architecture:** Wrangler manages migration SQL files in `backend/migrations/`. Production D1 uses `wrangler d1 migrations apply --remote`. Local SQLite uses a Python runner (`migrate.py`) that reads the same SQL files and tracks applied migrations in a `d1_migrations` table. CI applies migrations before deploy.

**Tech Stack:** Cloudflare Wrangler CLI, D1 REST API, SQLite, Python (aiosqlite)

---

### Task 1: Create wrangler.toml

**Files:**
- Create: `backend/wrangler.toml`

**Step 1: Create wrangler.toml with D1 binding**

```toml
# Wrangler configuration for D1 migrations only.
# This project does NOT deploy a Cloudflare Worker — wrangler is used
# solely for its `d1 migrations` commands.
name = "podcast-app"
compatibility_date = "2024-12-01"

[[d1_databases]]
binding = "DB"
database_name = "podcast-app-db"
database_id = "91b093fb-bb52-4a89-b60f-8548034e3193"
migrations_dir = "migrations"
```

Note: `database_id` matches the existing `D1_DATABASE_ID` env var. `migrations_dir` defaults to `migrations` but we set it explicitly.

**Step 2: Verify wrangler can read the config**

Run: `cd backend && npx wrangler d1 migrations list podcast-app-db --remote`
Expected: Empty list (no migrations yet) or confirmation that config is valid.

**Step 3: Commit**

```bash
git add backend/wrangler.toml
git commit -m "chore: add wrangler.toml for D1 migrations"
```

---

### Task 2: Create initial migration from existing schema

**Files:**
- Create: `backend/migrations/0001_initial.sql`
- Read: `backend/app/schema.py` (source of truth for current schema)

**Step 1: Create the initial migration SQL file**

Export the content of `SCHEMA_STATEMENTS` from `app/schema.py` into a single SQL file. This represents the current production schema as-is.

```sql
-- Initial schema: user, episode, source, transcript_line, task
-- Exported from app/schema.py

CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    interests TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);

CREATE TABLE IF NOT EXISTS episode (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cover_url TEXT NOT NULL DEFAULT '',
    audio_url TEXT NOT NULL DEFAULT '',
    duration INTEGER NOT NULL DEFAULT 0,
    is_public INTEGER NOT NULL DEFAULT 1,
    creator_id TEXT NOT NULL REFERENCES user(id),
    published_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_episode_creator ON episode(creator_id);
CREATE INDEX IF NOT EXISTS idx_episode_public ON episode(is_public, published_at);

CREATE TABLE IF NOT EXISTS source (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL REFERENCES episode(id),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_source_episode ON source(episode_id);

CREATE TABLE IF NOT EXISTS transcript_line (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL REFERENCES episode(id),
    line_order INTEGER NOT NULL,
    speaker TEXT NOT NULL,
    text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transcript_episode ON transcript_line(episode_id);

CREATE TABLE IF NOT EXISTS task (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id),
    status TEXT NOT NULL DEFAULT 'pending',
    progress TEXT NOT NULL DEFAULT '',
    episode_id TEXT REFERENCES episode(id),
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_user ON task(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_one_active_per_user
    ON task(user_id)
    WHERE status IN ('pending', 'processing');
```

**Step 2: Verify wrangler sees the migration**

Run: `cd backend && npx wrangler d1 migrations list podcast-app-db`
Expected: Shows `0001_initial.sql` as unapplied.

**Step 3: Apply to remote D1 (safely — uses IF NOT EXISTS)**

Run: `cd backend && npx wrangler d1 migrations apply podcast-app-db --remote`
Expected: Migration applied successfully. Since all statements use `IF NOT EXISTS`, this is safe against existing production tables.

**Step 4: Commit**

```bash
git add backend/migrations/0001_initial.sql
git commit -m "chore: add initial D1 migration from existing schema"
```

---

### Task 3: Create local SQLite migration runner (migrate.py)

**Files:**
- Create: `backend/migrate.py`

**Step 1: Write migrate.py**

```python
#!/usr/bin/env python
"""Apply migrations from migrations/ to local SQLite database.

Mirrors wrangler d1 migrations for local development.

Usage:
    python migrate.py              # apply pending migrations
    python migrate.py --status     # show migration status
"""

import argparse
import os
import re
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
        sql = open(path).read()
        print(f"Applying {fname}...")
        conn.executescript(sql)
        conn.execute("INSERT INTO d1_migrations (name) VALUES (?)", [fname])
        conn.commit()
        print(f"  ✓ {fname}")

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
        status = "✓" if f in applied else "✗"
        print(f"  {status} {f}")


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
```

**Step 2: Test migrate.py**

Delete local.db if it exists, then run:
Run: `cd backend && rm -f local.db && python migrate.py`
Expected: `Applying 0001_initial.sql... ✓` and `Applied 1 migration(s).`

Run: `cd backend && python migrate.py --status`
Expected: `  ✓ 0001_initial.sql`

Run: `cd backend && python migrate.py`
Expected: `No pending migrations.`

**Step 3: Commit**

```bash
git add backend/migrate.py
git commit -m "feat: add local SQLite migration runner"
```

---

### Task 4: Update LocalSQLiteClient to use migrations

**Files:**
- Modify: `backend/app/services/local_sqlite.py`

**Step 1: Replace schema.py import with migrations-based init**

Replace the `_get_conn` method to use migration files instead of `SCHEMA_STATEMENTS`:

```python
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
        sql = open(os.path.join(MIGRATIONS_DIR, fname)).read()
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
            # Apply any pending migrations before opening async connection
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
```

**Step 2: Verify local dev still works**

Run: `cd backend && rm -f local.db && uv run python -c "from app.main import app; print('OK')"`
Expected: OK (app boots, LocalSQLiteClient auto-applies migrations)

**Step 3: Commit**

```bash
git add backend/app/services/local_sqlite.py
git commit -m "refactor: LocalSQLiteClient uses migration files instead of schema.py"
```

---

### Task 5: Deprecate init_d1.py, clean up schema.py

**Files:**
- Modify: `backend/init_d1.py` (add deprecation notice)
- Modify: `backend/app/schema.py` (add note that migrations/ is the source of truth)

**Step 1: Add deprecation to init_d1.py**

Add a deprecation warning at the top of `main()`:

```python
import warnings
# ... existing imports ...

def main() -> None:
    warnings.warn(
        "init_d1.py is deprecated. Use wrangler d1 migrations apply "
        "for remote D1, or python migrate.py for local SQLite.",
        DeprecationWarning,
        stacklevel=1,
    )
    # ... rest of main ...
```

**Step 2: Update schema.py docstring**

```python
"""Database schema definitions.

NOTE: These definitions are kept as a reference. The authoritative schema
is managed via Wrangler D1 migrations in the migrations/ directory.
For local development, use: python migrate.py
For production D1, use: npx wrangler d1 migrations apply podcast-app-db --remote
"""
```

**Step 3: Commit**

```bash
git add backend/init_d1.py backend/app/schema.py
git commit -m "chore: deprecate init_d1.py in favor of wrangler migrations"
```

---

### Task 6: Update CI workflows

**Files:**
- Modify: `.github/workflows/ci.yml` (add migration file lint)
- Modify: `.github/workflows/railway.yml` (apply migrations before deploy)
- Modify: `.github/workflows/daily-podcast.yml` (no change needed — it uses D1 REST API directly)

**Step 1: Add migration apply to railway.yml deploy-production job**

Insert before the `Deploy` step:

```yaml
  deploy-production:
    name: Production
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - name: Install Wrangler
        run: npm install -g wrangler
      - name: Apply D1 migrations
        working-directory: backend
        run: npx wrangler d1 migrations apply podcast-app-db --remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      - name: Deploy
        run: railway up --service=${{ secrets.RAILWAY_SERVICE_ID }} -d
        working-directory: backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**Step 2: Add migration check to ci.yml backend job**

After `Check import`, add:

```yaml
      - name: Verify migrations apply to fresh SQLite
        run: uv run python migrate.py && uv run python migrate.py --status
```

This ensures migration SQL files are valid by applying them to a fresh SQLite database.

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/railway.yml
git commit -m "ci: apply D1 migrations before deploy, validate in CI"
```

---

### Task 7: Update CLAUDE.md documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update relevant sections**

In the 后端 section, add `migrate.py` and `wrangler.toml` to the file list.
In 开发命令, replace `init_d1.py` references with migration commands.
In 注意事项, update the database notes.

Changes:
- Add to 后端 file list: `- 迁移: `wrangler.toml` (D1 配置) + `migrations/` (SQL 迁移文件) + `migrate.py` (本地 SQLite runner)`
- Replace `init_d1.py` command with migration commands
- Add migration workflow notes

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with wrangler D1 migration workflow"
```
