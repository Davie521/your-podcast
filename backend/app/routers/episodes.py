from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, col, func, select

from app.auth import get_current_user, get_optional_user
from app.database import get_session
from app.models import Episode, Source, TranscriptLine, User
from app.schemas import (
    CreatorInfo,
    EpisodeDetail,
    EpisodeListItem,
    EpisodeListResponse,
    SourceItem,
    TranscriptItem,
)

router = APIRouter(prefix="/api/episodes", tags=["episodes"])


def _episode_to_list_item(episode: Episode, creator: User) -> EpisodeListItem:
    return EpisodeListItem(
        id=episode.id,
        title=episode.title,
        description=episode.description,
        cover_url=episode.cover_url,
        audio_url=episode.audio_url,
        duration=episode.duration,
        is_public=episode.is_public,
        creator_id=episode.creator_id,
        creator=CreatorInfo(name=creator.name, avatar_url=creator.avatar_url),
        published_at=episode.published_at,
    )


@router.get("", response_model=EpisodeListResponse)
async def list_public_episodes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
):
    total = session.exec(
        select(func.count()).where(Episode.is_public == True)  # noqa: E712
    ).one()

    rows = session.exec(
        select(Episode, User)
        .join(User, Episode.creator_id == User.id)
        .where(Episode.is_public == True)  # noqa: E712
        .order_by(col(Episode.published_at).desc())
        .offset(offset)
        .limit(limit)
    ).all()

    episodes = [_episode_to_list_item(ep, creator) for ep, creator in rows]
    return EpisodeListResponse(episodes=episodes, total=total, limit=limit, offset=offset)


# /me must be defined before /{episode_id} to avoid "me" matching as an ID
@router.get("/me", response_model=EpisodeListResponse)
async def list_my_episodes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    total = session.exec(
        select(func.count()).where(Episode.creator_id == current_user.id)
    ).one()

    rows = session.exec(
        select(Episode, User)
        .join(User, Episode.creator_id == User.id)
        .where(Episode.creator_id == current_user.id)
        .order_by(col(Episode.published_at).desc())
        .offset(offset)
        .limit(limit)
    ).all()

    episodes = [_episode_to_list_item(ep, creator) for ep, creator in rows]
    return EpisodeListResponse(episodes=episodes, total=total, limit=limit, offset=offset)


@router.get("/{episode_id}", response_model=EpisodeDetail)
async def get_episode(
    episode_id: str,
    current_user: User | None = Depends(get_optional_user),
    session: Session = Depends(get_session),
):
    row = session.exec(
        select(Episode, User)
        .join(User, Episode.creator_id == User.id)
        .where(Episode.id == episode_id)
    ).first()

    if not row:
        raise HTTPException(status_code=404, detail="Episode not found")

    episode, creator = row

    # Return 404 for private episodes not owned by the requester (avoids leaking existence)
    if not episode.is_public:
        if not current_user or current_user.id != episode.creator_id:
            raise HTTPException(status_code=404, detail="Episode not found")

    sources = session.exec(
        select(Source).where(Source.episode_id == episode_id)
    ).all()

    transcript_lines = session.exec(
        select(TranscriptLine)
        .where(TranscriptLine.episode_id == episode_id)
        .order_by(col(TranscriptLine.line_order))
    ).all()

    return EpisodeDetail(
        **_episode_to_list_item(episode, creator).model_dump(),
        sources=[SourceItem(id=s.id, title=s.title, url=s.url, source=s.source) for s in sources],
        transcript=[TranscriptItem(speaker=t.speaker, text=t.text) for t in transcript_lines],
    )
