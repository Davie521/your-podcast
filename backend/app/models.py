import enum
import uuid
from datetime import datetime, timezone

from sqlmodel import JSON, Column, Field, Relationship, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TaskStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    avatar_url: str = ""
    provider: str  # "google" or "github"
    provider_id: str
    interests: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=_utcnow)

    episodes: list["Episode"] = Relationship(back_populates="creator", cascade_delete=True)
    tasks: list["Task"] = Relationship(back_populates="user", cascade_delete=True)


class Episode(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    description: str = ""
    cover_url: str = ""
    audio_url: str = ""
    duration: int = 0  # seconds
    is_public: bool = True
    creator_id: str = Field(foreign_key="user.id", index=True)
    published_at: datetime = Field(default_factory=_utcnow)

    creator: User | None = Relationship(back_populates="episodes")
    sources: list["Source"] = Relationship(back_populates="episode", cascade_delete=True)
    transcript_lines: list["TranscriptLine"] = Relationship(back_populates="episode", cascade_delete=True)


class Source(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    episode_id: str = Field(foreign_key="episode.id", index=True)
    title: str
    url: str
    source: str  # feed name / origin

    episode: Episode | None = Relationship(back_populates="sources")


class TranscriptLine(SQLModel, table=True):
    __tablename__ = "transcript_line"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    episode_id: str = Field(foreign_key="episode.id", index=True)
    line_order: int
    speaker: str  # "小明" or "小红"
    text: str

    episode: Episode | None = Relationship(back_populates="transcript_lines")


class Task(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    status: TaskStatus = Field(default=TaskStatus.pending)
    progress: str = ""
    episode_id: str | None = Field(default=None, foreign_key="episode.id")
    created_at: datetime = Field(default_factory=_utcnow)

    user: User | None = Relationship(back_populates="tasks")
