"""Audio validation and conversion utilities."""

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import HTTPException, UploadFile


MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024
SUPPORTED_AUDIO_MIME_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/webm",
    "audio/ogg",
}


def _resolve_media_binary(name: str) -> str:
    """Find an FFmpeg binary, including the standard Windows winget location."""
    path_binary = shutil.which(name)
    if path_binary:
        return path_binary

    if os.name == "nt":
        package_root = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages"
        matches = package_root.glob(f"*/**/{name}.exe")
        binary = next(matches, None)
        if binary:
            return str(binary)

    raise FileNotFoundError(f"{name} was not found on PATH")


async def validate_and_load(file: UploadFile) -> bytes:
    """Validate an uploaded audio file and return its bytes.

    The read is capped at one byte above the configured maximum so oversized
    uploads are rejected without reading an unbounded stream into memory.
    """
    if file.content_type not in SUPPORTED_AUDIO_MIME_TYPES:
        raise HTTPException(status_code=400, detail="unsupported_audio_type")

    audio_bytes = await file.read(MAX_AUDIO_SIZE_BYTES + 1)
    if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="audio_file_too_large")

    return audio_bytes


def get_duration_seconds(audio_bytes: bytes) -> float:
    """Return audio duration using ffprobe without transcoding the input."""
    probe_path: Path | None = None
    try:
        # Some container formats, including WAV, report no duration on a
        # non-seekable stdin stream. A temporary input file lets ffprobe read
        # the container metadata without performing any audio conversion.
        with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as temporary_file:
            temporary_file.write(audio_bytes)
            probe_path = Path(temporary_file.name)

        result = subprocess.run(
            [
                _resolve_media_binary("ffprobe"),
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                "-i",
                str(probe_path),
            ],
            input=audio_bytes,
            capture_output=True,
            check=True,
            timeout=30,
        )
        return float(result.stdout.decode().strip())
    except (FileNotFoundError, subprocess.SubprocessError, ValueError) as error:
        raise HTTPException(status_code=400, detail="invalid_audio") from error
    finally:
        if probe_path is not None:
            probe_path.unlink(missing_ok=True)


def transcode_to_wav(audio_bytes: bytes) -> bytes:
    """Convert audio bytes to 16 kHz mono PCM WAV using in-memory pipes."""
    try:
        result = subprocess.run(
            [
                _resolve_media_binary("ffmpeg"),
                "-v",
                "error",
                "-i",
                "pipe:0",
                "-ar",
                "16000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                "-f",
                "wav",
                "pipe:1",
            ],
            input=audio_bytes,
            capture_output=True,
            check=True,
            timeout=60,
        )
        return result.stdout
    except (FileNotFoundError, subprocess.SubprocessError) as error:
        raise HTTPException(status_code=400, detail="audio_transcode_failed") from error
