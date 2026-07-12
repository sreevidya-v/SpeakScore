"""Pronunciation analysis API route declarations."""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from services.audio import get_duration_seconds, transcode_to_wav, validate_and_load
from services.transcribe import Word, transcribe
from services.phoneme import expected_phonemes, recognized_phonemes, compare_phonemes


router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analyze")
async def analyze_pronunciation(
    audio: UploadFile = File(...),
    consent: str | None = Form(default=None),
) -> dict:
    """Validate consent and audio, then transcribe and analyze for pronunciation errors."""
    if consent != "true":
        raise HTTPException(status_code=400, detail="consent_required")

    audio_bytes = await validate_and_load(audio)
    duration = get_duration_seconds(audio_bytes)
    if not 30 <= duration <= 45:
        raise HTTPException(status_code=400, detail="duration_out_of_range")

    wav_bytes = transcode_to_wav(audio_bytes)
    words = transcribe(wav_bytes)

    # For low-confidence words (< 70), run phoneme-level analysis.
    words_with_analysis = []
    for word in words:
        word_dict = dict(word)
        if word["confidence"] < 70:
            try:
                exp_phonemes = expected_phonemes(word["text"])
                rec_phonemes = recognized_phonemes(wav_bytes, word["start"], word["end"])
                differences = compare_phonemes(exp_phonemes, rec_phonemes)
                word_dict["phonemeIssues"] = differences
            except Exception:
                # If phoneme analysis fails, omit the field rather than crash the response.
                pass
        words_with_analysis.append(word_dict)

    return {"status": "ok", "duration": duration, "words": words_with_analysis}
