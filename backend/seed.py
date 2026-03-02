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
        interests=["AI", "科技", "互联网", "编程"],
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


SAMPLE_EPISODES = [
    {
        "title": "Your Podcast — 2026-03-01",
        "description": "OpenAI 发布 GPT-5、苹果 WWDC 2026 前瞻、小米汽车月销破万",
        "duration": 480,
        "sources": [
            {"title": "OpenAI 发布 GPT-5：多模态推理能力大幅提升", "url": "https://36kr.com/p/example-1", "source": "36氪"},
            {"title": "苹果 WWDC 2026 前瞻：iOS 20 将引入全新 AI 助手", "url": "https://sspai.com/post/example-1", "source": "少数派"},
            {"title": "小米汽车 SU7 月销破万，雷军称年底推出 SUV", "url": "https://36kr.com/p/example-2", "source": "36氪"},
        ],
        "transcript": [
            {"speaker": "小明", "text": "大家好！欢迎收听今天的 Your Podcast，我是小明。"},
            {"speaker": "小红", "text": "我是小红！今天我们有几个重磅消息要聊。"},
            {"speaker": "小明", "text": "没错，首先是 OpenAI 正式发布了 GPT-5，多模态推理能力有了质的飞跃。"},
            {"speaker": "小红", "text": "对，据说在数学和代码生成方面的表现已经接近专业水平了。"},
            {"speaker": "小明", "text": "第二个话题是苹果 WWDC 2026，据传 iOS 20 将会引入全新的 AI 助手。"},
            {"speaker": "小红", "text": "终于！苹果在 AI 这块一直比较保守，这次会不会给我们惊喜呢？"},
            {"speaker": "小明", "text": "最后聊聊小米汽车，SU7 月销量已经突破一万台了。"},
            {"speaker": "小红", "text": "雷军说年底还要推 SUV 车型，小米的造车速度真的很快。"},
            {"speaker": "小明", "text": "好的，今天的节目就到这里，感谢大家收听！"},
            {"speaker": "小红", "text": "我们明天见！拜拜～"},
        ],
    },
    {
        "title": "Your Podcast — 2026-02-28",
        "description": "Rust 2026 Edition 发布、微信小程序支持 WebGPU、字节跳动开源大模型",
        "duration": 420,
        "sources": [
            {"title": "Rust 2026 Edition 正式发布，async trait 终于稳定", "url": "https://sspai.com/post/example-2", "source": "少数派"},
            {"title": "微信小程序正式支持 WebGPU，性能提升 10 倍", "url": "https://ifanr.com/example-1", "source": "爱范儿"},
        ],
        "transcript": [
            {"speaker": "小明", "text": "欢迎来到 Your Podcast！今天聊几个开发者关心的话题。"},
            {"speaker": "小红", "text": "第一个就是 Rust 2026 Edition 终于发布了！"},
            {"speaker": "小明", "text": "对，最大的亮点就是 async trait 正式稳定了，这可是社区等了好几年的功能。"},
            {"speaker": "小红", "text": "另一个消息是微信小程序开始支持 WebGPU 了。"},
            {"speaker": "小明", "text": "这意味着小程序可以做更复杂的图形渲染了，游戏和 3D 场景都不在话下。"},
            {"speaker": "小红", "text": "好的，今天的节目就到这里，下次见！"},
        ],
    },
    {
        "title": "Your Podcast — 2026-02-27",
        "description": "GitHub Copilot X 更新、特斯拉 FSD V13 在华测试、中国移动推出 AI 电话助手",
        "duration": 360,
        "sources": [
            {"title": "GitHub Copilot X 大更新：支持整个仓库的上下文理解", "url": "https://36kr.com/p/example-3", "source": "36氪"},
            {"title": "特斯拉 FSD V13 获准在中国部分城市开始测试", "url": "https://ifanr.com/example-2", "source": "爱范儿"},
            {"title": "中国移动推出 AI 电话助手，可自动接听和筛选来电", "url": "https://36kr.com/p/example-4", "source": "36氪"},
        ],
        "transcript": [
            {"speaker": "小明", "text": "Hello 大家好，欢迎收听 Your Podcast！"},
            {"speaker": "小红", "text": "今天的头条是 GitHub Copilot X 的一个重大更新。"},
            {"speaker": "小明", "text": "没错，现在 Copilot 可以理解整个仓库的代码上下文了，不再只是单文件补全。"},
            {"speaker": "小红", "text": "还有一个大新闻，特斯拉 FSD V13 获准在中国测试了！"},
            {"speaker": "小明", "text": "目前只在几个城市试点，但这标志着自动驾驶在中国落地的重要一步。"},
            {"speaker": "小红", "text": "感谢收听，我们明天见！"},
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
