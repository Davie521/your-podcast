#!/usr/bin/env python
"""Seed script — insert sample episodes for frontend development.

Usage:
    python seed.py              # insert 3 sample episodes
    python seed.py --clear      # delete all seed data first, then re-insert
"""

import argparse
import uuid
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.database import create_db_and_tables, engine
from app.models import Episode, Source, Task, TranscriptLine, User

SYSTEM_EMAIL = "seed@your-podcast.local"


def _get_or_create_seed_user(session: Session) -> User:
    user = session.exec(select(User).where(User.email == SYSTEM_EMAIL)).first()
    if user:
        return user
    user = User(
        id=str(uuid.uuid4()),
        name="Seed User",
        email=SYSTEM_EMAIL,
        provider="system",
        provider_id="seed",
        interests=["AI", "technology", "programming", "startups"],
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


SAMPLE_EPISODES = [
    {
        "title": "Your Podcast — 2026-03-01",
        "description": "OpenAI launches GPT-5, Apple WWDC 2026 preview, Nvidia hits $4T market cap",
        "duration": 480,
        "sources": [
            {"title": "OpenAI launches GPT-5 with massive multimodal reasoning improvements", "url": "https://techcrunch.com/example-1", "source": "TechCrunch"},
            {"title": "Apple WWDC 2026 preview: iOS 20 to introduce a new AI assistant", "url": "https://www.theverge.com/example-1", "source": "The Verge"},
            {"title": "Nvidia hits $4 trillion market cap as AI demand surges", "url": "https://arstechnica.com/example-1", "source": "Ars Technica"},
        ],
        "transcript": [
            {"speaker": "Alex", "text": "Hey everyone! Welcome to today's Your Podcast, I'm Alex."},
            {"speaker": "Jordan", "text": "And I'm Jordan! We've got some big news to cover today."},
            {"speaker": "Alex", "text": "That's right. First up, OpenAI has officially launched GPT-5 with a huge leap in multimodal reasoning."},
            {"speaker": "Jordan", "text": "Yeah, apparently its math and code generation performance is approaching expert level now."},
            {"speaker": "Alex", "text": "Our second topic is Apple's WWDC 2026. Rumor has it iOS 20 will introduce an entirely new AI assistant."},
            {"speaker": "Jordan", "text": "Finally! Apple has been pretty conservative on AI. Think they'll surprise us this time?"},
            {"speaker": "Alex", "text": "And lastly, let's talk about Nvidia hitting a four trillion dollar market cap."},
            {"speaker": "Jordan", "text": "The AI chip demand just keeps growing. It's wild how fast things are moving."},
            {"speaker": "Alex", "text": "Alright, that's all for today's show. Thanks for listening!"},
            {"speaker": "Jordan", "text": "See you tomorrow! Bye!"},
        ],
    },
    {
        "title": "Your Podcast — 2026-02-28",
        "description": "Rust 2026 Edition released, WebGPU lands in Safari, Meta open-sources Llama 4",
        "duration": 420,
        "sources": [
            {"title": "Rust 2026 Edition officially released with stable async traits", "url": "https://arstechnica.com/example-2", "source": "Ars Technica"},
            {"title": "WebGPU finally lands in Safari, completing cross-browser support", "url": "https://www.theverge.com/example-2", "source": "The Verge"},
        ],
        "transcript": [
            {"speaker": "Alex", "text": "Welcome to Your Podcast! Today we're covering a couple of topics developers will love."},
            {"speaker": "Jordan", "text": "First up, the Rust 2026 Edition is finally here!"},
            {"speaker": "Alex", "text": "The biggest highlight is that async traits are officially stable now. The community has been waiting years for this."},
            {"speaker": "Jordan", "text": "The other big news is WebGPU landing in Safari."},
            {"speaker": "Alex", "text": "This means we now have full cross-browser support for WebGPU, which is huge for web-based 3D and games."},
            {"speaker": "Jordan", "text": "That's a wrap for today. See you next time!"},
        ],
    },
    {
        "title": "Your Podcast — 2026-02-27",
        "description": "GitHub Copilot X update, Tesla FSD V13 expands to Europe, Google launches Project Astra",
        "duration": 360,
        "sources": [
            {"title": "GitHub Copilot X major update: full repository context understanding", "url": "https://techcrunch.com/example-2", "source": "TechCrunch"},
            {"title": "Tesla FSD V13 approved for testing in select European cities", "url": "https://arstechnica.com/example-3", "source": "Ars Technica"},
            {"title": "Google launches Project Astra, a real-time multimodal AI assistant", "url": "https://www.theverge.com/example-3", "source": "The Verge"},
        ],
        "transcript": [
            {"speaker": "Alex", "text": "Hey everyone, welcome to Your Podcast!"},
            {"speaker": "Jordan", "text": "Today's headline is a major update to GitHub Copilot X."},
            {"speaker": "Alex", "text": "That's right. Copilot can now understand the full repository context, not just single-file completions."},
            {"speaker": "Jordan", "text": "We've also got big news — Tesla's FSD V13 has been approved for testing in Europe!"},
            {"speaker": "Alex", "text": "It's only a few cities for now, but it marks a significant step for autonomous driving expansion."},
            {"speaker": "Jordan", "text": "Thanks for listening, see you tomorrow!"},
        ],
    },
]


def seed(session: Session) -> None:
    user = _get_or_create_seed_user(session)
    now = datetime.now(timezone.utc)

    for i, ep_data in enumerate(SAMPLE_EPISODES):
        ep = Episode(
            id=str(uuid.uuid4()),
            title=ep_data["title"],
            description=ep_data["description"],
            cover_url=f"https://placehold.co/800x800/6366f1/a855f7.png?text=EP{i + 1}",
            audio_url=f"https://cdn.example.com/episodes/sample-{i + 1}.mp3",
            duration=ep_data["duration"],
            is_public=True,
            creator_id=user.id,
            published_at=now - timedelta(days=i),
        )
        session.add(ep)
        session.flush()

        for src in ep_data["sources"]:
            session.add(Source(episode_id=ep.id, **src))

        for j, line in enumerate(ep_data["transcript"]):
            session.add(TranscriptLine(
                episode_id=ep.id,
                line_order=j,
                speaker=line["speaker"],
                text=line["text"],
            ))

    session.commit()
    print(f"Seeded {len(SAMPLE_EPISODES)} episodes for user {user.name} ({user.email})")


def clear(session: Session) -> None:
    user = session.exec(select(User).where(User.email == SYSTEM_EMAIL)).first()
    if not user:
        print("No seed user found, nothing to clear")
        return

    episodes = session.exec(select(Episode).where(Episode.creator_id == user.id)).all()
    for ep in episodes:
        for tl in session.exec(select(TranscriptLine).where(TranscriptLine.episode_id == ep.id)).all():
            session.delete(tl)
        for src in session.exec(select(Source).where(Source.episode_id == ep.id)).all():
            session.delete(src)
        session.delete(ep)

    for task in session.exec(select(Task).where(Task.user_id == user.id)).all():
        session.delete(task)

    session.delete(user)
    session.commit()
    print(f"Cleared all seed data ({len(episodes)} episodes)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed sample podcast data")
    parser.add_argument("--clear", action="store_true", help="Clear seed data before inserting")
    args = parser.parse_args()

    create_db_and_tables()

    with Session(engine) as session:
        if args.clear:
            clear(session)
        seed(session)


if __name__ == "__main__":
    main()
