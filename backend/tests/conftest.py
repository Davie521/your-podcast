import uuid
from collections.abc import Generator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlmodel import Session, SQLModel, create_engine

from app.auth import create_session_cookie, SESSION_COOKIE_NAME
from app.config import Settings
from app.database import get_session
from app.models import User


# ── Test settings (no .env needed) ──────────────────────────────

_test_settings = Settings(
    database_url="sqlite://",
    session_secret="test-secret-key",
    frontend_url="http://localhost:3000",
)


def _get_test_settings() -> Settings:
    return _test_settings


# ── Database fixtures ───────────────────────────────────────────

@pytest.fixture()
def engine():
    eng = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(eng)
    yield eng
    SQLModel.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture()
def session(engine) -> Generator[Session, None, None]:
    with Session(engine) as s:
        yield s


# ── App / client fixtures ──────────────────────────────────────

@pytest.fixture()
async def client(engine, session):
    from app.config import get_settings
    from app.main import app

    def _override_session() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_session] = _override_session
    app.dependency_overrides[get_settings] = _get_test_settings

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


# ── Data fixtures ──────────────────────────────────────────────

@pytest.fixture()
def test_user(session) -> User:
    user = User(
        id=str(uuid.uuid4()),
        name="Test User",
        email="test@example.com",
        avatar_url="https://example.com/avatar.png",
        provider="google",
        provider_id="12345",
        interests=["AI", "Python"],
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture()
def auth_cookie(test_user) -> str:
    return create_session_cookie(test_user.id, _test_settings)


@pytest.fixture()
async def authenticated_client(client, auth_cookie):
    client.cookies.set(SESSION_COOKIE_NAME, auth_cookie)
    return client
