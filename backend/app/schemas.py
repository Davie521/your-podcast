from datetime import datetime

from pydantic import BaseModel

from app.models import TaskStatus


# ── Shared ────────────────────────────────────────────────────


class CreatorInfo(BaseModel):
    name: str
    avatar_url: str


# ── Episodes ──────────────────────────────────────────────────


class SourceItem(BaseModel):
    id: str
    title: str
    url: str
    source: str


class TranscriptItem(BaseModel):
    speaker: str
    text: str


class EpisodeListItem(BaseModel):
    id: str
    title: str
    description: str
    cover_url: str
    audio_url: str
    duration: int
    is_public: bool
    creator_id: str
    creator: CreatorInfo
    published_at: datetime


class EpisodeDetail(EpisodeListItem):
    sources: list[SourceItem]
    transcript: list[TranscriptItem]


class EpisodeListResponse(BaseModel):
    episodes: list[EpisodeListItem]
    total: int
    limit: int
    offset: int


# ── User ──────────────────────────────────────────────────────


class UserStats(BaseModel):
    total_episodes: int
    public_episodes: int


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: str
    interests: list[str]
    created_at: datetime
    stats: UserStats


# ── Task ──────────────────────────────────────────────────────


class TaskResponse(BaseModel):
    task_id: str
    status: TaskStatus
    progress: str
    episode_id: str | None
