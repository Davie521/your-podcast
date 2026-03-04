"""Database schema definitions.

NOTE: These definitions are kept as a reference. The authoritative schema
is managed via Wrangler D1 migrations in the migrations/ directory.
For local development, use: python migrate.py
For production D1, use: npx wrangler d1 migrations apply podcast-app-db --remote
"""

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
    """CREATE UNIQUE INDEX IF NOT EXISTS idx_task_one_active_per_user
       ON task(user_id)
       WHERE status IN ('pending', 'processing')""",
]

DROP_STATEMENTS = [
    "DROP TABLE IF EXISTS transcript_line",
    "DROP TABLE IF EXISTS source",
    "DROP TABLE IF EXISTS task",
    "DROP TABLE IF EXISTS episode",
    "DROP TABLE IF EXISTS user",
]
