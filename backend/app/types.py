"""Shared type definitions for the backend."""

from __future__ import annotations

from typing import Protocol, TypedDict


class DatabaseClient(Protocol):
    """Protocol shared by D1Client and LocalSQLiteClient."""

    async def execute(self, sql: str, params: list | None = None) -> list[dict]: ...
    async def batch(self, statements: list[dict]) -> list[list[dict]]: ...
    async def aclose(self) -> None: ...


class UserDict(TypedDict):
    id: str
    name: str
    email: str
    avatar_url: str
    provider: str
    provider_id: str
    interests: list[str]
    created_at: str


class EpisodeDict(TypedDict):
    id: str
    title: str
    description: str
    cover_url: str
    audio_url: str
    duration: int
    is_public: int
    creator_id: str
    published_at: str


class SourceDict(TypedDict):
    id: str
    episode_id: str
    title: str
    url: str
    source: str


class TranscriptLineDict(TypedDict):
    id: str
    episode_id: str
    line_order: int
    speaker: str
    text: str


class TaskDict(TypedDict):
    id: str
    user_id: str
    status: str
    progress: str
    episode_id: str | None
    created_at: str
