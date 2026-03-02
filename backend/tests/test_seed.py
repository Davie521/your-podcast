"""Tests for the seed.py script."""

import pytest
from sqlmodel import Session, select

from app.models import Episode, Source, TranscriptLine, User
from seed import SAMPLE_EPISODES, SYSTEM_EMAIL, clear, seed


class TestSeed:
    def test_seed_creates_episodes(self, engine, session):
        seed(session)
        episodes = session.exec(select(Episode)).all()
        assert len(episodes) == len(SAMPLE_EPISODES)

    def test_seed_creates_user(self, engine, session):
        seed(session)
        user = session.exec(select(User).where(User.email == SYSTEM_EMAIL)).first()
        assert user is not None
        assert user.name == "Seed User"

    def test_seed_creates_sources(self, engine, session):
        seed(session)
        sources = session.exec(select(Source)).all()
        expected = sum(len(ep["sources"]) for ep in SAMPLE_EPISODES)
        assert len(sources) == expected

    def test_seed_creates_transcript_lines(self, engine, session):
        seed(session)
        lines = session.exec(select(TranscriptLine)).all()
        expected = sum(len(ep["transcript"]) for ep in SAMPLE_EPISODES)
        assert len(lines) == expected

    def test_seed_idempotent_user(self, engine, session):
        """Running seed twice doesn't create duplicate users."""
        seed(session)
        seed(session)
        users = session.exec(select(User).where(User.email == SYSTEM_EMAIL)).all()
        assert len(users) == 1

    def test_clear_removes_all_seed_data(self, engine, session):
        seed(session)
        clear(session)
        assert session.exec(select(Episode)).all() == []
        assert session.exec(select(Source)).all() == []
        assert session.exec(select(TranscriptLine)).all() == []
        assert session.exec(select(User).where(User.email == SYSTEM_EMAIL)).first() is None

    def test_clear_on_empty_db(self, engine, session):
        """clear() doesn't fail when there's no seed data."""
        clear(session)  # should not raise
