import asyncio
import logging
import tempfile
from pathlib import Path

from zhipuai import ZhipuAI

from app.config import Settings
from app.services.podcast import ScriptLine

logger = logging.getLogger(__name__)

_MAX_RETRIES = 3


async def synthesize_lines(lines: list[ScriptLine], settings: Settings) -> list[Path]:
    """Synthesize each script line to a WAV file via GLM TTS."""
    client = ZhipuAI(api_key=settings.glm_api_key)
    voice_map = {
        "Alex": settings.tts_voice_male,
        "Jordan": settings.tts_voice_female,
    }

    tasks = [
        asyncio.to_thread(_synthesize_one, client, line, voice_map, i)
        for i, line in enumerate(lines)
    ]
    return list(await asyncio.gather(*tasks))


def _synthesize_one(
    client: ZhipuAI,
    line: ScriptLine,
    voice_map: dict[str, str],
    index: int,
) -> Path:
    """Synthesize a single line with retry logic."""
    voice = voice_map.get(line["speaker"], voice_map["Alex"])
    tmp = Path(tempfile.mktemp(suffix=".wav", prefix=f"tts_{index:03d}_"))

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            response = client.audio.speech.create(
                model="glm-tts",
                voice=voice,
                input=line["text"],
            )
            response.stream_to_file(tmp)
            logger.debug("TTS line %d done (attempt %d)", index, attempt)
            return tmp
        except Exception:
            logger.warning("TTS line %d attempt %d failed", index, attempt, exc_info=True)
            if attempt == _MAX_RETRIES:
                raise

    raise RuntimeError("unreachable")
