import asyncio
import logging
import tempfile
from pathlib import Path

from pydub import AudioSegment

logger = logging.getLogger(__name__)


async def merge_audio(audio_files: list[Path]) -> tuple[Path, int]:
    """Concatenate audio segments and export as MP3.

    Returns (path_to_mp3, duration_seconds).
    """
    return await asyncio.to_thread(_merge, audio_files)


def _merge(audio_files: list[Path]) -> tuple[Path, int]:
    combined = AudioSegment.empty()
    for path in audio_files:
        segment = AudioSegment.from_file(str(path))
        combined += segment

    out_path = Path(tempfile.mktemp(suffix=".mp3", prefix="podcast_"))
    combined.export(str(out_path), format="mp3")
    duration_seconds = int(len(combined) / 1000)

    logger.info("Merged %d segments → %s (%ds)", len(audio_files), out_path, duration_seconds)
    return out_path, duration_seconds
