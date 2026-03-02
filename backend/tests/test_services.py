"""Tests for Phase 5 service layer.

All external APIs (feedparser, Gemini, Podcastfy, ZhipuAI, boto3, pydub)
are mocked so tests run offline without credentials.
"""

import tempfile
import textwrap
from pathlib import Path
from unittest.mock import MagicMock, patch, call
from types import SimpleNamespace

import feedparser
import pytest

from app.config import Settings
from app.services.rss import Article, fetch_articles, _parse_feed
from app.services.gemini import filter_articles, _call_gemini
from app.services.podcast import _parse_transcript, generate_script, ScriptLine
from app.services.tts import synthesize_lines, _synthesize_one
from app.services.audio import merge_audio, _merge
from app.services.cover import generate_cover_url
from app.services.storage import upload_to_r2, _upload


# ── Helpers ────────────────────────────────────────────────────

def _make_article(i: int, url: str | None = None) -> Article:
    return Article(
        title=f"Article {i}",
        url=url or f"https://example.com/article-{i}",
        summary=f"Summary of article {i}",
        source="Test Feed",
        published="2026-03-01T00:00:00+00:00",
    )


def _test_settings(**overrides) -> Settings:
    defaults = dict(
        database_url="sqlite://",
        session_secret="test",
        glm_api_key="fake-glm-key",
        tts_voice_male="male-voice",
        tts_voice_female="female-voice",
        r2_account_id="fake-account",
        r2_access_key_id="fake-key",
        r2_secret_access_key="fake-secret",
        r2_bucket_name="fake-bucket",
        r2_public_url="https://cdn.example.com",
    )
    defaults.update(overrides)
    return Settings(**defaults)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RSS Service
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestRSS:
    def test_parse_feed_returns_articles(self):
        """_parse_feed extracts entries from a valid feed."""
        entry = feedparser.FeedParserDict(
            title="Test Article",
            link="https://example.com/1",
            summary="A summary",
            published_parsed=(2026, 3, 1, 12, 0, 0, 0, 0, 0),
        )
        mock_feed = SimpleNamespace(
            bozo=False,
            entries=[entry],
            feed={"title": "My Feed"},
        )
        with patch("app.services.rss.feedparser.parse", return_value=mock_feed):
            articles = _parse_feed("https://feed.example.com/rss")

        assert len(articles) == 1
        assert articles[0]["title"] == "Test Article"
        assert articles[0]["url"] == "https://example.com/1"
        assert articles[0]["source"] == "My Feed"
        assert "2026-03-01" in articles[0]["published"]

    def test_parse_feed_bozo_with_no_entries_raises(self):
        """_parse_feed raises on a broken feed with no entries."""
        mock_feed = SimpleNamespace(bozo=True, entries=[], feed={})
        with patch("app.services.rss.feedparser.parse", return_value=mock_feed):
            with pytest.raises(RuntimeError, match="Failed to parse feed"):
                _parse_feed("https://bad-feed.example.com")

    def test_parse_feed_bozo_with_entries_ok(self):
        """_parse_feed tolerates bozo=True if entries exist."""
        entry = feedparser.FeedParserDict(title="OK", link="https://x.com/1", summary="")
        mock_feed = SimpleNamespace(
            bozo=True,
            entries=[entry],
            feed={"title": "Feed"},
        )
        with patch("app.services.rss.feedparser.parse", return_value=mock_feed):
            articles = _parse_feed("https://feed.example.com")
        assert len(articles) == 1

    def test_parse_feed_missing_published(self):
        """_parse_feed handles entries without published_parsed."""
        entry = feedparser.FeedParserDict(title="No Date", link="https://x.com/1", summary="")
        mock_feed = SimpleNamespace(
            bozo=False,
            entries=[entry],
            feed={"title": "Feed"},
        )
        with patch("app.services.rss.feedparser.parse", return_value=mock_feed):
            articles = _parse_feed("https://feed.example.com")
        assert articles[0]["published"] == ""

    @pytest.mark.anyio
    async def test_fetch_articles_deduplicates(self):
        """fetch_articles deduplicates articles by URL across feeds."""
        feed1 = [_make_article(1, "https://example.com/same")]
        feed2 = [_make_article(2, "https://example.com/same"), _make_article(3)]

        with patch("app.services.rss._parse_feed", side_effect=[feed1, feed2]):
            articles = await fetch_articles(["url1", "url2"])

        assert len(articles) == 2
        urls = [a["url"] for a in articles]
        assert "https://example.com/same" in urls
        assert "https://example.com/article-3" in urls

    @pytest.mark.anyio
    async def test_fetch_articles_skips_broken_feed(self):
        """fetch_articles logs warning and continues on feed failure."""
        good_articles = [_make_article(1)]

        with patch(
            "app.services.rss._parse_feed",
            side_effect=[RuntimeError("broken"), good_articles],
        ):
            articles = await fetch_articles(["bad-url", "good-url"])

        assert len(articles) == 1
        assert articles[0]["title"] == "Article 1"

    @pytest.mark.anyio
    async def test_fetch_articles_empty_urls(self):
        """fetch_articles returns empty list for no URLs."""
        articles = await fetch_articles([])
        assert articles == []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Gemini Filtering
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGemini:
    @pytest.mark.anyio
    async def test_filter_empty_articles(self):
        result = await filter_articles([], ["AI"], "key")
        assert result == []

    @pytest.mark.anyio
    async def test_filter_no_api_key_returns_first_8(self):
        """Without API key, falls back to first 8 articles."""
        articles = [_make_article(i) for i in range(12)]
        result = await filter_articles(articles, ["AI"], api_key="")
        assert len(result) == 8
        assert result[0]["title"] == "Article 0"

    @pytest.mark.anyio
    async def test_filter_gemini_success(self):
        """Gemini returns selected indices, we get those articles back."""
        articles = [_make_article(i) for i in range(5)]

        mock_response = MagicMock()
        mock_response.text = "[1, 3]"
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response

        with patch("app.services.gemini.genai") as mock_genai:
            mock_genai.GenerativeModel.return_value = mock_model
            result = await filter_articles(articles, ["AI"], "fake-key")

        assert len(result) == 2
        assert result[0]["title"] == "Article 1"
        assert result[1]["title"] == "Article 3"

    @pytest.mark.anyio
    async def test_filter_gemini_with_code_fences(self):
        """Gemini response wrapped in markdown code fences is parsed correctly."""
        articles = [_make_article(i) for i in range(5)]

        mock_response = MagicMock()
        mock_response.text = "```json\n[0, 2, 4]\n```"
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response

        with patch("app.services.gemini.genai") as mock_genai:
            mock_genai.GenerativeModel.return_value = mock_model
            result = await filter_articles(articles, ["AI"], "fake-key")

        assert len(result) == 3

    @pytest.mark.anyio
    async def test_filter_gemini_failure_falls_back(self):
        """On Gemini error, falls back to first 8 articles."""
        articles = [_make_article(i) for i in range(10)]

        with patch("app.services.gemini.genai") as mock_genai:
            mock_genai.GenerativeModel.side_effect = RuntimeError("API error")
            result = await filter_articles(articles, ["AI"], "fake-key")

        assert len(result) == 8

    @pytest.mark.anyio
    async def test_filter_gemini_invalid_indices_ignored(self):
        """Out-of-range indices from Gemini are silently ignored."""
        articles = [_make_article(i) for i in range(3)]

        mock_response = MagicMock()
        mock_response.text = "[0, 99, -1, 2]"
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response

        with patch("app.services.gemini.genai") as mock_genai:
            mock_genai.GenerativeModel.return_value = mock_model
            result = await filter_articles(articles, ["AI"], "fake-key")

        assert len(result) == 2
        assert result[0]["title"] == "Article 0"
        assert result[1]["title"] == "Article 2"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Podcast Script (Podcastfy)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestPodcast:
    def test_parse_transcript_basic(self):
        """Parse Podcastfy XML tags into ScriptLines."""
        text = textwrap.dedent("""\
            <Person1>大家好，欢迎收听</Person1>
            <Person2>今天聊点科技新闻</Person2>
            <Person1>第一个话题是 AI</Person1>
        """)
        lines = _parse_transcript(text)
        assert len(lines) == 3
        assert lines[0] == ScriptLine(speaker="Alex", text="大家好，欢迎收听")
        assert lines[1] == ScriptLine(speaker="Jordan", text="今天聊点科技新闻")
        assert lines[2] == ScriptLine(speaker="Alex", text="第一个话题是 AI")

    def test_parse_transcript_multiline_content(self):
        """Tags with multiline content are parsed correctly."""
        text = "<Person1>第一行\n第二行\n第三行</Person1>"
        lines = _parse_transcript(text)
        assert len(lines) == 1
        assert "第一行\n第二行\n第三行" in lines[0]["text"]

    def test_parse_transcript_empty_tags_skipped(self):
        """Empty tags produce no ScriptLines."""
        text = "<Person1></Person1>\n<Person2>有内容</Person2>"
        lines = _parse_transcript(text)
        assert len(lines) == 1
        assert lines[0]["speaker"] == "Jordan"

    def test_parse_transcript_empty_input(self):
        lines = _parse_transcript("")
        assert lines == []

    @pytest.mark.anyio
    async def test_generate_script_empty_articles(self):
        result = await generate_script([], "key")
        assert result == []

    @pytest.mark.anyio
    async def test_generate_script_no_urls(self):
        """Articles without URLs return empty."""
        articles = [Article(title="No URL", url="", summary="x", source="x", published="")]
        result = await generate_script(articles, "key")
        assert result == []

    @pytest.mark.anyio
    async def test_generate_script_calls_podcastfy(self, tmp_path):
        """generate_script calls Podcastfy and parses the result."""
        transcript_file = tmp_path / "transcript.txt"
        transcript_file.write_text(
            "<Person1>你好</Person1>\n<Person2>大家好</Person2>",
            encoding="utf-8",
        )

        articles = [_make_article(1)]

        with patch(
            "app.services.podcast._generate_transcript",
            return_value=str(transcript_file),
        ):
            lines = await generate_script(articles, "fake-key")

        assert len(lines) == 2
        assert lines[0]["speaker"] == "Alex"
        assert lines[1]["speaker"] == "Jordan"

    @pytest.mark.anyio
    async def test_generate_script_podcastfy_failure(self):
        """If Podcastfy fails, returns empty list."""
        articles = [_make_article(1)]
        with patch("app.services.podcast._generate_transcript", return_value=None):
            lines = await generate_script(articles, "fake-key")
        assert lines == []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TTS Synthesis
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestTTS:
    def test_synthesize_one_success(self):
        """_synthesize_one calls GLM TTS and writes to file."""
        mock_response = MagicMock()
        mock_client = MagicMock()
        mock_client.audio.speech.create.return_value = mock_response

        line = ScriptLine(speaker="Alex", text="测试文本")
        voice_map = {"Alex": "male-voice", "Jordan": "female-voice"}

        path = _synthesize_one(mock_client, line, voice_map, 0)

        mock_client.audio.speech.create.assert_called_once_with(
            model="glm-tts", voice="male-voice", input="测试文本"
        )
        mock_response.stream_to_file.assert_called_once_with(path)
        assert str(path).endswith(".wav")

    def test_synthesize_one_uses_female_voice(self):
        """Jordan lines use the female voice."""
        mock_response = MagicMock()
        mock_client = MagicMock()
        mock_client.audio.speech.create.return_value = mock_response

        line = ScriptLine(speaker="Jordan", text="你好")
        voice_map = {"Alex": "male-voice", "Jordan": "female-voice"}

        _synthesize_one(mock_client, line, voice_map, 0)

        mock_client.audio.speech.create.assert_called_once_with(
            model="glm-tts", voice="female-voice", input="你好"
        )

    def test_synthesize_one_retries_on_failure(self):
        """_synthesize_one retries up to 3 times."""
        mock_response = MagicMock()
        mock_client = MagicMock()
        mock_client.audio.speech.create.side_effect = [
            RuntimeError("fail 1"),
            RuntimeError("fail 2"),
            mock_response,
        ]

        line = ScriptLine(speaker="Alex", text="重试测试")
        voice_map = {"Alex": "male-voice", "Jordan": "female-voice"}

        path = _synthesize_one(mock_client, line, voice_map, 0)
        assert mock_client.audio.speech.create.call_count == 3
        mock_response.stream_to_file.assert_called_once()

    def test_synthesize_one_raises_after_max_retries(self):
        """_synthesize_one raises after 3 failures."""
        mock_client = MagicMock()
        mock_client.audio.speech.create.side_effect = RuntimeError("always fails")

        line = ScriptLine(speaker="Alex", text="失败")
        voice_map = {"Alex": "male-voice", "Jordan": "female-voice"}

        with pytest.raises(RuntimeError, match="always fails"):
            _synthesize_one(mock_client, line, voice_map, 0)
        assert mock_client.audio.speech.create.call_count == 3

    @pytest.mark.anyio
    async def test_synthesize_lines_maps_voices(self):
        """synthesize_lines creates tasks for each line with correct voices."""
        settings = _test_settings()
        lines = [
            ScriptLine(speaker="Alex", text="你好"),
            ScriptLine(speaker="Jordan", text="大家好"),
        ]

        mock_response = MagicMock()
        mock_client = MagicMock()
        mock_client.audio.speech.create.return_value = mock_response

        with patch("app.services.tts.ZhipuAI", return_value=mock_client):
            paths = await synthesize_lines(lines, settings)

        assert len(paths) == 2
        assert mock_client.audio.speech.create.call_count == 2


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Audio Merging
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestAudio:
    def test_merge_concatenates_segments(self):
        """_merge concatenates AudioSegments and exports MP3."""
        seg1 = MagicMock(spec=["__len__", "__add__", "__radd__"])
        seg1.__len__ = lambda self: 5000  # 5 seconds in ms
        seg2 = MagicMock(spec=["__len__", "__add__", "__radd__"])
        seg2.__len__ = lambda self: 3000

        combined = MagicMock()
        combined.__len__ = lambda self: 8000
        combined.export = MagicMock()

        with patch("app.services.audio.AudioSegment") as MockAudioSegment:
            empty = MagicMock()
            empty.__add__ = MagicMock(return_value=combined)
            empty.__iadd__ = MagicMock(return_value=combined)
            combined.__iadd__ = MagicMock(return_value=combined)

            MockAudioSegment.empty.return_value = empty
            MockAudioSegment.from_file.side_effect = [seg1, seg2]

            path, duration = _merge([Path("/tmp/a.wav"), Path("/tmp/b.wav")])

        assert duration == 8
        assert str(path).endswith(".mp3")
        combined.export.assert_called_once()

    @pytest.mark.anyio
    async def test_merge_audio_async(self):
        """merge_audio wraps _merge in asyncio.to_thread."""
        with patch("app.services.audio._merge", return_value=(Path("/tmp/out.mp3"), 10)):
            path, duration = await merge_audio([Path("/tmp/a.wav")])
        assert duration == 10


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cover Image
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestCover:
    def test_generate_cover_url_format(self):
        url = generate_cover_url("Test Episode")
        assert url.startswith("https://placehold.co/800x800/")
        assert ".png?text=" in url
        assert "Test%20Episode" in url

    def test_generate_cover_url_deterministic(self):
        """Same title always produces the same URL."""
        url1 = generate_cover_url("AI News Daily")
        url2 = generate_cover_url("AI News Daily")
        assert url1 == url2

    def test_generate_cover_url_different_titles(self):
        """Different titles produce different URLs (most of the time)."""
        url1 = generate_cover_url("Title A")
        url2 = generate_cover_url("Title B")
        assert url1 != url2

    def test_generate_cover_url_truncates_long_title(self):
        """Titles longer than 20 chars are truncated in the URL."""
        url = generate_cover_url("A" * 50)
        # The text param should have at most 20 chars (URL-encoded)
        text_part = url.split("?text=")[1]
        assert len(text_part) <= 20

    def test_generate_cover_url_valid_gradient(self):
        """URL contains a valid hex color pair."""
        from app.services.cover import _GRADIENTS
        url = generate_cover_url("Anything")
        # Extract the color portion: /800x800/{bg}/{fg}.png
        parts = url.split("/")
        bg = parts[4]  # after 800x800
        fg = parts[5].split(".")[0]
        all_colors = {c for pair in _GRADIENTS for c in pair}
        assert bg in all_colors
        assert fg in all_colors


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# R2 Storage
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestStorage:
    def test_upload_builds_correct_url(self, tmp_path):
        """_upload calls boto3 with correct R2 settings and returns public URL."""
        test_file = tmp_path / "test.mp3"
        test_file.write_bytes(b"fake audio")
        settings = _test_settings()

        mock_client = MagicMock()
        with patch("app.services.storage.boto3.client", return_value=mock_client) as mock_boto:
            url = _upload(test_file, "episodes/test.mp3", settings, "audio/mpeg")

        mock_boto.assert_called_once_with(
            "s3",
            endpoint_url="https://fake-account.r2.cloudflarestorage.com",
            aws_access_key_id="fake-key",
            aws_secret_access_key="fake-secret",
            region_name="auto",
        )
        mock_client.upload_file.assert_called_once_with(
            str(test_file),
            "fake-bucket",
            "episodes/test.mp3",
            ExtraArgs={"ContentType": "audio/mpeg"},
        )
        assert url == "https://cdn.example.com/episodes/test.mp3"

    @pytest.mark.anyio
    async def test_upload_to_r2_async(self, tmp_path):
        """upload_to_r2 wraps _upload in asyncio.to_thread."""
        test_file = tmp_path / "test.mp3"
        test_file.write_bytes(b"fake")
        settings = _test_settings()

        with patch(
            "app.services.storage._upload",
            return_value="https://cdn.example.com/episodes/test.mp3",
        ):
            url = await upload_to_r2(test_file, "episodes/test.mp3", settings)
        assert url == "https://cdn.example.com/episodes/test.mp3"

    def test_upload_custom_content_type(self, tmp_path):
        """_upload passes custom content type to S3."""
        test_file = tmp_path / "cover.png"
        test_file.write_bytes(b"fake image")
        settings = _test_settings()

        mock_client = MagicMock()
        with patch("app.services.storage.boto3.client", return_value=mock_client):
            _upload(test_file, "covers/img.png", settings, "image/png")

        mock_client.upload_file.assert_called_once()
        args = mock_client.upload_file.call_args
        assert args[1]["ExtraArgs"]["ContentType"] == "image/png"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Config
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestConfig:
    def test_tts_voice_defaults(self):
        s = Settings(database_url="sqlite://", session_secret="x")
        assert s.tts_voice_male == "male"
        assert s.tts_voice_female == "female"

    def test_tts_voice_custom(self):
        s = Settings(
            database_url="sqlite://",
            session_secret="x",
            tts_voice_male="custom-male",
            tts_voice_female="custom-female",
        )
        assert s.tts_voice_male == "custom-male"
        assert s.tts_voice_female == "custom-female"
