import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlmodel import Session

from app.models import Episode, Source, TranscriptLine, User


def _make_episode(
    session: Session,
    creator: User,
    *,
    title: str = "Test Episode",
    is_public: bool = True,
    published_at: datetime | None = None,
) -> Episode:
    ep = Episode(
        id=str(uuid.uuid4()),
        title=title,
        description=f"Description for {title}",
        audio_url="https://r2.example.com/test.mp3",
        duration=300,
        is_public=is_public,
        creator_id=creator.id,
        published_at=published_at or datetime.now(timezone.utc),
    )
    session.add(ep)
    session.commit()
    session.refresh(ep)
    return ep


def _make_source(session: Session, episode: Episode) -> Source:
    src = Source(
        id=str(uuid.uuid4()),
        episode_id=episode.id,
        title="Source Article",
        url="https://example.com/article",
        source="TechFeed",
    )
    session.add(src)
    session.commit()
    return src


def _make_transcript(session: Session, episode: Episode) -> TranscriptLine:
    line = TranscriptLine(
        id=str(uuid.uuid4()),
        episode_id=episode.id,
        line_order=0,
        speaker="小明",
        text="Hello world",
    )
    session.add(line)
    session.commit()
    return line


# ── GET /api/episodes (public list) ────────────────────────────


@pytest.mark.anyio
async def test_list_episodes_empty(client):
    resp = await client.get("/api/episodes")
    assert resp.status_code == 200
    data = resp.json()
    assert data["episodes"] == []
    assert data["total"] == 0


@pytest.mark.anyio
async def test_list_episodes_public_only(client, session, test_user):
    _make_episode(session, test_user, title="Public", is_public=True)
    _make_episode(session, test_user, title="Private", is_public=False)

    resp = await client.get("/api/episodes")
    data = resp.json()
    assert data["total"] == 1
    assert data["episodes"][0]["title"] == "Public"


@pytest.mark.anyio
async def test_list_episodes_newest_first(client, session, test_user):
    now = datetime.now(timezone.utc)
    _make_episode(session, test_user, title="Old", published_at=now - timedelta(days=2))
    _make_episode(session, test_user, title="New", published_at=now)

    resp = await client.get("/api/episodes")
    titles = [e["title"] for e in resp.json()["episodes"]]
    assert titles == ["New", "Old"]


@pytest.mark.anyio
async def test_list_episodes_pagination(client, session, test_user):
    for i in range(5):
        _make_episode(session, test_user, title=f"Ep {i}")

    resp = await client.get("/api/episodes?limit=2&offset=0")
    data = resp.json()
    assert len(data["episodes"]) == 2
    assert data["total"] == 5

    resp = await client.get("/api/episodes?limit=2&offset=4")
    data = resp.json()
    assert len(data["episodes"]) == 1


# ── GET /api/episodes/me ────────────────────────────────────────


@pytest.mark.anyio
async def test_my_episodes_unauthenticated(client):
    resp = await client.get("/api/episodes/me")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_my_episodes_includes_private(authenticated_client, session, test_user):
    _make_episode(session, test_user, title="Public", is_public=True)
    _make_episode(session, test_user, title="Private", is_public=False)

    resp = await authenticated_client.get("/api/episodes/me")
    data = resp.json()
    assert data["total"] == 2
    titles = {e["title"] for e in data["episodes"]}
    assert titles == {"Public", "Private"}


# ── GET /api/episodes/{id} ──────────────────────────────────────


@pytest.mark.anyio
async def test_get_episode_not_found(client):
    resp = await client.get(f"/api/episodes/{uuid.uuid4()}")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_get_public_episode(client, session, test_user):
    ep = _make_episode(session, test_user, title="Public EP")
    _make_source(session, ep)
    _make_transcript(session, ep)

    resp = await client.get(f"/api/episodes/{ep.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Public EP"
    assert len(data["sources"]) == 1
    assert len(data["transcript"]) == 1
    assert data["transcript"][0]["speaker"] == "小明"


@pytest.mark.anyio
async def test_private_episode_404_for_unauthenticated(client, session, test_user):
    ep = _make_episode(session, test_user, is_public=False)
    resp = await client.get(f"/api/episodes/{ep.id}")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_private_episode_404_for_non_owner(client, session, test_user, auth_cookie):
    ep = _make_episode(session, test_user, is_public=False)

    # Create a different user and authenticate as them
    other_user = User(
        id=str(uuid.uuid4()),
        name="Other",
        email="other@example.com",
        provider="github",
        provider_id="99999",
    )
    session.add(other_user)
    session.commit()

    from app.auth import create_session_cookie, SESSION_COOKIE_NAME
    from tests.conftest import _test_settings

    other_cookie = create_session_cookie(other_user.id, _test_settings)
    client.cookies.set(SESSION_COOKIE_NAME, other_cookie)

    resp = await client.get(f"/api/episodes/{ep.id}")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_private_episode_200_for_owner(authenticated_client, session, test_user):
    ep = _make_episode(session, test_user, is_public=False, title="My Secret EP")
    resp = await authenticated_client.get(f"/api/episodes/{ep.id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "My Secret EP"
