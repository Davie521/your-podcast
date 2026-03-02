"""Tests for Phase 6: POST /api/generate and GET /api/tasks/{task_id}."""

import uuid

import pytest
from sqlmodel import Session

from app.models import Task, TaskStatus, User


# ── POST /api/generate ────────────────────────────────────────


@pytest.mark.anyio
async def test_generate_unauthenticated(client):
    resp = await client.post("/api/generate")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_generate_returns_202(authenticated_client):
    resp = await authenticated_client.post("/api/generate", json={})
    assert resp.status_code == 202
    data = resp.json()
    assert "task_id" in data
    assert data["status"] == "pending"
    assert data["message"] == "Podcast generation started"


@pytest.mark.anyio
async def test_generate_creates_task_in_db(authenticated_client, session, test_user):
    resp = await authenticated_client.post("/api/generate", json={})
    assert resp.status_code == 202
    task_id = resp.json()["task_id"]

    task = session.get(Task, task_id)
    assert task is not None
    assert task.user_id == test_user.id
    assert task.status == TaskStatus.pending
    assert task.progress == "queued"


@pytest.mark.anyio
async def test_generate_one_active_task_per_user(authenticated_client, session, test_user):
    # Create an active task
    task = Task(user_id=test_user.id, status=TaskStatus.processing, progress="running")
    session.add(task)
    session.commit()

    resp = await authenticated_client.post("/api/generate", json={})
    assert resp.status_code == 409
    assert "active task" in resp.json()["detail"]


@pytest.mark.anyio
async def test_generate_allows_after_completed_task(authenticated_client, session, test_user):
    # Completed task should not block
    task = Task(user_id=test_user.id, status=TaskStatus.completed, progress="done")
    session.add(task)
    session.commit()

    resp = await authenticated_client.post("/api/generate", json={})
    assert resp.status_code == 202


@pytest.mark.anyio
async def test_generate_allows_after_failed_task(authenticated_client, session, test_user):
    task = Task(user_id=test_user.id, status=TaskStatus.failed, progress="error")
    session.add(task)
    session.commit()

    resp = await authenticated_client.post("/api/generate", json={})
    assert resp.status_code == 202


@pytest.mark.anyio
async def test_generate_custom_feeds(authenticated_client):
    resp = await authenticated_client.post(
        "/api/generate",
        json={"feeds": ["https://example.com/feed1", "https://example.com/feed2"]},
    )
    assert resp.status_code == 202


@pytest.mark.anyio
async def test_generate_custom_date(authenticated_client):
    resp = await authenticated_client.post(
        "/api/generate",
        json={"date": "2026-03-01"},
    )
    assert resp.status_code == 202


# ── GET /api/tasks/{task_id} ──────────────────────────────────


@pytest.mark.anyio
async def test_get_task_unauthenticated(client, session, test_user):
    task = Task(user_id=test_user.id, status=TaskStatus.pending, progress="queued")
    session.add(task)
    session.commit()
    session.refresh(task)

    resp = await client.get(f"/api/tasks/{task.id}")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_get_task_success(authenticated_client, session, test_user):
    task = Task(user_id=test_user.id, status=TaskStatus.processing, progress="fetching_rss")
    session.add(task)
    session.commit()
    session.refresh(task)

    resp = await authenticated_client.get(f"/api/tasks/{task.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["task_id"] == task.id
    assert data["status"] == "processing"
    assert data["progress"] == "fetching_rss"
    assert data["episode_id"] is None


@pytest.mark.anyio
async def test_get_task_completed_with_episode(authenticated_client, session, test_user):
    ep_id = str(uuid.uuid4())
    task = Task(
        user_id=test_user.id,
        status=TaskStatus.completed,
        progress="done",
        episode_id=ep_id,
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    resp = await authenticated_client.get(f"/api/tasks/{task.id}")
    data = resp.json()
    assert data["status"] == "completed"
    assert data["episode_id"] == ep_id


@pytest.mark.anyio
async def test_get_task_not_found(authenticated_client):
    resp = await authenticated_client.get(f"/api/tasks/{uuid.uuid4()}")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_get_task_wrong_owner(authenticated_client, session):
    # Create task owned by a different user
    other_user = User(
        id=str(uuid.uuid4()),
        name="Other",
        email="other@example.com",
        provider="github",
        provider_id="99999",
    )
    session.add(other_user)
    session.commit()

    task = Task(user_id=other_user.id, status=TaskStatus.pending, progress="queued")
    session.add(task)
    session.commit()
    session.refresh(task)

    resp = await authenticated_client.get(f"/api/tasks/{task.id}")
    assert resp.status_code == 404
