from fastapi import APIRouter, Depends, HTTPException, Query

from app import d1_database
from app.auth import get_current_user, get_optional_user
from app.database import get_db
from app.schemas import (
    CreatorInfo,
    EpisodeDetail,
    EpisodeListItem,
    EpisodeListResponse,
    SourceItem,
    TranscriptItem,
)
from app.services.d1 import D1Client

router = APIRouter(prefix="/api/episodes", tags=["episodes"])


def _row_to_list_item(row: dict) -> EpisodeListItem:
    return EpisodeListItem(
        id=row["id"],
        title=row["title"],
        description=row["description"],
        cover_url=row["cover_url"],
        audio_url=row["audio_url"],
        duration=row["duration"],
        is_public=bool(row["is_public"]),
        creator_id=row["creator_id"],
        creator=CreatorInfo(name=row["creator_name"], avatar_url=row["creator_avatar_url"]),
        published_at=row["published_at"],
    )


@router.get("", response_model=EpisodeListResponse)
async def list_public_episodes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: D1Client = Depends(get_db),
):
    rows, total = await d1_database.list_public_episodes(db, limit=limit, offset=offset)
    episodes = [_row_to_list_item(r) for r in rows]
    return EpisodeListResponse(episodes=episodes, total=total, limit=limit, offset=offset)


# /me must be defined before /{episode_id} to avoid "me" matching as an ID
@router.get("/me", response_model=EpisodeListResponse)
async def list_my_episodes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: D1Client = Depends(get_db),
):
    rows, total = await d1_database.list_user_episodes(
        db, current_user["id"], limit=limit, offset=offset
    )
    episodes = [_row_to_list_item(r) for r in rows]
    return EpisodeListResponse(episodes=episodes, total=total, limit=limit, offset=offset)


@router.get("/{episode_id}", response_model=EpisodeDetail)
async def get_episode(
    episode_id: str,
    current_user: dict | None = Depends(get_optional_user),
    db: D1Client = Depends(get_db),
):
    ep = await d1_database.get_episode_detail(db, episode_id)
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")

    if not ep["is_public"]:
        if not current_user or current_user["id"] != ep["creator_id"]:
            raise HTTPException(status_code=404, detail="Episode not found")

    item = _row_to_list_item(ep)
    return EpisodeDetail(
        **item.model_dump(),
        sources=[SourceItem(id=s["id"], title=s["title"], url=s["url"], source=s["source"]) for s in ep["sources"]],
        transcript=[TranscriptItem(speaker=t["speaker"], text=t["text"]) for t in ep["transcript"]],
    )
