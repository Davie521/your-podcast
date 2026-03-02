import asyncio
import logging
import re
from typing import TypedDict

from podcastfy.client import generate_podcast

from app.services.rss import Article

logger = logging.getLogger(__name__)

_SPEAKER_MAP = {"Person1": "Alex", "Person2": "Jordan"}
_TAG_PATTERN = re.compile(r"<(Person[12])>(.*?)</\1>", re.DOTALL)


class ScriptLine(TypedDict):
    speaker: str  # "Alex" or "Jordan"
    text: str


_CONVERSATION_CONFIG = {
    "word_count": 3000,
    "conversation_style": ["engaging", "fast-paced", "enthusiastic"],
    "roles_person1": "main summarizer",
    "roles_person2": "questioner/clarifier",
    "dialogue_structure": [
        "Introduction",
        "Main Content Summary",
        "Key Takeaways",
        "Conclusion",
    ],
    "podcast_name": "Your Podcast",
    "podcast_tagline": "Your daily tech podcast",
    "output_language": "English",
    "engagement_techniques": [
        "rhetorical questions",
        "anecdotes",
        "analogies",
        "humor",
    ],
    "creativity": 0.7,
}


async def generate_script(articles: list[Article], api_key: str) -> list[ScriptLine]:
    """Generate a two-host English podcast dialogue script via Podcastfy.

    Uses Podcastfy in transcript-only mode to generate a dialogue from
    article URLs, then parses the <Person1>/<Person2> tags into ScriptLines
    with Alex/Jordan speaker names.
    """
    if not articles:
        return []

    urls = [a["url"] for a in articles if a.get("url")]
    if not urls:
        return []

    transcript_path = await asyncio.to_thread(
        _generate_transcript, urls, api_key
    )
    if not transcript_path:
        return []

    with open(transcript_path, encoding="utf-8") as f:
        transcript_text = f.read()

    return _parse_transcript(transcript_text)


def _generate_transcript(urls: list[str], api_key: str) -> str | None:
    """Call Podcastfy to generate a transcript file (sync, run via to_thread)."""
    try:
        import os
        os.environ["GEMINI_API_KEY"] = api_key

        result = generate_podcast(
            urls=urls,
            transcript_only=True,
            conversation_config=_CONVERSATION_CONFIG,
        )
        return result
    except Exception:
        logger.exception("Podcastfy transcript generation failed")
        return None


def _parse_transcript(text: str) -> list[ScriptLine]:
    """Parse Podcastfy's <Person1>/<Person2> XML transcript into ScriptLines."""
    lines: list[ScriptLine] = []
    for match in _TAG_PATTERN.finditer(text):
        tag, content = match.group(1), match.group(2).strip()
        speaker = _SPEAKER_MAP.get(tag, "Alex")
        if content:
            lines.append(ScriptLine(speaker=speaker, text=content))
    return lines
