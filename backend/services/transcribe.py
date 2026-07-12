"""Speech transcription service using faster-whisper."""

import math
import io
from typing import TypedDict

from faster_whisper import WhisperModel


class Word(TypedDict):
    """Word-level transcription result with timing and confidence."""

    text: str
    start: float
    end: float
    confidence: float


# Load model once at module import time to avoid per-request overhead.
_model = WhisperModel("base.en", device="cpu", compute_type="int8")


def _confidence_from_word(word: object, segment_avg_logprob: float) -> float:
    """Convert Whisper word metadata into a 0-100 confidence score.

    faster-whisper exposes a per-word probability. That is the most direct signal
    to use when it exists. If it is missing, fall back to the segment log-probability
    and map it through an exponential curve so valid speech does not collapse to 0.
    """
    probability = getattr(word, "probability", None)
    if probability is not None:
        return max(0.0, min(100.0, float(probability) * 100.0))

    fallback_probability = math.exp(segment_avg_logprob) if segment_avg_logprob is not None else 0.0
    return max(0.0, min(100.0, fallback_probability * 100.0))


def transcribe(wav_bytes: bytes) -> list[Word]:
    """Transcribe WAV audio bytes to a list of word objects with timing.

    Confidence (0-100) is derived from each segment's avg_logprob:
    - Logprob ranges roughly from 0 to -1 (log of probabilities 1.0 to ~0.37).
    - Formula: confidence = max(0, min(100, (1 + avg_logprob) * 100))
    - This linearly maps [-1, 0] to [0, 100], clamped to valid range.
    - Higher logprob (closer to 0) → higher confidence.
    """
    # Create an in-memory audio stream from bytes.
    audio_stream = io.BytesIO(wav_bytes)

    # Transcribe the audio; language is fixed to English by "base.en" model.
    segments, _ = _model.transcribe(audio_stream, language="en")

    words: list[Word] = []
    for segment in segments:
        # Extract word-level timing and confidence.
        if segment.words:
            for word in segment.words:
                confidence = _confidence_from_word(word, segment.avg_logprob)
                words.append(
                    Word(
                        text=word.word.strip(),
                        start=word.start,
                        end=word.end,
                        confidence=confidence,
                    )
                )
        else:
            # Fallback: if no word-level timing, use segment as a single word.
            confidence = max(
                0.0,
                min(
                    100.0,
                    math.exp(segment.avg_logprob) * 100.0
                    if segment.avg_logprob is not None
                    else 0.0,
                ),
            )
            words.append(
                Word(
                    text=segment.text.strip(),
                    start=segment.start,
                    end=segment.end,
                    confidence=confidence,
                )
            )

    return words
