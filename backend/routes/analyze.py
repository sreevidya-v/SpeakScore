"""Pronunciation analysis API route declarations."""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from services.audio import get_duration_seconds, transcode_to_wav, validate_and_load
from services.transcribe import Word, transcribe


router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analyze")
async def analyze_pronunciation(
    audio: UploadFile = File(...),
    consent: str | None = Form(default=None),
) -> dict[str, str | float | list[Word]]:
    """Validate consent and audio, then transcribe and return word-level results."""
    if consent != "true":
        raise HTTPException(status_code=400, detail="consent_required")

    audio_bytes = await validate_and_load(audio)
    duration = get_duration_seconds(audio_bytes)
    if not 30 <= duration <= 45:
        raise HTTPException(status_code=400, detail="duration_out_of_range")

    wav_bytes = transcode_to_wav(audio_bytes)
    words = transcribe(wav_bytes)

    return {"status": "ok", "duration": duration, "words": words}
