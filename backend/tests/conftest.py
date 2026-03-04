import sqlite3

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth import create_session_cookie, SESSION_COOKIE_NAME
from app.config import Settings
from app.database import get_db
from app.services.d1 import D1Client


# ── Schema matching init_d1.py ────────────────────────────────

SCHEMA = """
CREATE TABLE user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    interests TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
);
CREATE TABLE episode (
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
CREATE TABLE source (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL REFERENCES episode(id),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source TEXT NOT NULL
);
CREATE TABLE transcript_line (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL REFERENCES episode(id),
    line_order INTEGER NOT NULL,
    speaker TEXT NOT NULL,
    text TEXT NOT NULL
);
CREATE TABLE task (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id),
    status TEXT NOT NULL DEFAULT 'pending',
    progress TEXT NOT NULL DEFAULT '',
    episode_id TEXT REFERENCES episode(id),
    created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_task_one_active_per_user
    ON task(user_id)
    WHERE status IN ('pending', 'processing');
"""


class FakeD1Client(D1Client):
    """D1Client backed by in-memory SQLite for testing."""

    def __init__(self):
        # Skip parent __init__ — we don't need Cloudflare credentials
        self._conn = sqlite3.connect(":memory:")
        self._conn.row_factory = sqlite3.Row
        self._conn.executescript(SCHEMA)

    async def execute(self, sql: str, params: list | None = None) -> list[dict]:
        cursor = self._conn.execute(sql, params or [])
        self._conn.commit()
        if cursor.description:
            return [dict(row) for row in cursor.fetchall()]
        return []

    async def batch(self, statements: list[dict]) -> list[list[dict]]:
        results = []
        for stmt in statements:
            cursor = self._conn.execute(stmt["sql"], stmt.get("params", []))
            if cursor.description:
                results.append([dict(row) for row in cursor.fetchall()])
            else:
                results.append([])
        self._conn.commit()
        return results


# ── Test settings (no .env needed) ──────────────────────────────

_test_settings = Settings(
    cloudflare_account_id="test",
    cloudflare_api_token="test",
    d1_database_id="test",
    session_secret="test-secret-key",
    frontend_url="http://localhost:3000",
)


def _get_test_settings() -> Settings:
    return _test_settings


# ── Database fixture ────────────────────────────────────────────

@pytest.fixture()
def db():
    return FakeD1Client()


# ── App / client fixtures ──────────────────────────────────────

@pytest.fixture()
async def client(db):
    from app.config import get_settings
    from app.main import app

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_settings] = _get_test_settings

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


# ── Data fixtures ──────────────────────────────────────────────

@pytest.fixture()
async def test_user(db):
    from app import d1_database

    user = await d1_database.upsert_user(
        db,
        email="test@example.com",
        name="Test User",
        avatar_url="https://example.com/avatar.png",
        provider="google",
        provider_id="12345",
    )
    await d1_database.update_user_interests(db, user["id"], ["AI", "Python"])
    user["interests"] = ["AI", "Python"]
    return user


@pytest.fixture()
def auth_cookie(test_user) -> str:
    return create_session_cookie(test_user["id"], _test_settings)


@pytest.fixture()
async def authenticated_client(client, auth_cookie):
    client.cookies.set(SESSION_COOKIE_NAME, auth_cookie)
    return client
