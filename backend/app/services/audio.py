import asyncio
import logging
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from pydub import AudioSegment

from app.config import get_settings

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

    if get_settings().dev_mode:
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        out_path = Path.cwd() / f"podcast_{ts}.mp3"
    else:
        out_path = Path(tempfile.mktemp(suffix=".mp3", prefix="podcast_"))

    combined.export(str(out_path), format="mp3")

    # Re-read the exported MP3 to get accurate duration — WAV headers written
    # by the TTS step may have incorrect sample-rate metadata, so len(combined)
    # can be wrong.  The MP3 file itself always has correct timing.
    exported = AudioSegment.from_file(str(out_path), format="mp3")
    duration_seconds = int(len(exported) / 1000)

    logger.info("Merged %d segments → %s (%ds)", len(audio_files), out_path, duration_seconds)
    return out_path, duration_seconds
