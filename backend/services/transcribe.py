"""Speech-transcription service stubs."""

from pathlib import Path


def transcribe_audio(file_path: Path) -> str:
    """Transcribe spoken audio into text.

    TODO: Integrate faster-whisper and return timestamped transcription data.
    """
    pass
