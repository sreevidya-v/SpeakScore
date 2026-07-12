"""Integration tests for audio validation on the analyze endpoint."""

from io import BytesIO

import numpy as np
from fastapi.testclient import TestClient
from scipy.io import wavfile

from main import app
from services.scoring import build_response


client = TestClient(app)


def make_sine_wav(duration_seconds: float, sample_rate: int = 16_000) -> bytes:
    """Generate an in-memory mono WAV fixture of the requested duration."""
    sample_count = int(duration_seconds * sample_rate)
    time = np.arange(sample_count) / sample_rate
    waveform = (0.2 * np.sin(2 * np.pi * 440 * time) * np.iinfo(np.int16).max).astype(np.int16)
    buffer = BytesIO()
    wavfile.write(buffer, sample_rate, waveform)
    return buffer.getvalue()


def post_audio(audio_bytes: bytes, consent: str | None = "true"):
    """Send an in-memory WAV upload to the analysis endpoint."""
    data = {} if consent is None else {"consent": consent}
    return client.post(
        "/api/analyze",
        data=data,
        files={"audio": ("fixture.wav", audio_bytes, "audio/wav")},
    )


def test_valid_duration_passes() -> None:
    """A 30-second audio upload is accepted at the lower duration boundary."""
    response = post_audio(make_sine_wav(30))

    assert response.status_code == 200
    data = response.json()
    assert "overallScore" in data
    assert "words" in data
    assert isinstance(data["overallScore"], int)
    assert isinstance(data["words"], list)


def test_too_short_audio_is_rejected() -> None:
    """Audio shorter than 30 seconds is rejected."""
    response = post_audio(make_sine_wav(29))

    assert response.status_code == 400
    assert response.json() == {"detail": "duration_out_of_range"}


def test_too_long_audio_is_rejected() -> None:
    """Audio longer than 45 seconds is rejected."""
    response = post_audio(make_sine_wav(46))

    assert response.status_code == 400
    assert response.json() == {"detail": "duration_out_of_range"}


def test_empty_audio_is_rejected() -> None:
    """Empty audio uploads are rejected before ffprobe is invoked."""
    response = post_audio(b"")

    assert response.status_code == 400
    assert response.json() == {"detail": "invalid_audio"}


def test_missing_consent_is_rejected() -> None:
    """Audio cannot be analyzed before explicit consent is supplied."""
    response = post_audio(make_sine_wav(30), consent=None)

    assert response.status_code == 400
    assert response.json() == {"detail": "consent_required"}


def test_build_response_bucket_assignment() -> None:
    """Verify bucket classification: good (>=80), needs-work (60-79, no issues), mispronounced (<60 or has issues)."""
    mocked_words = [
        {"text": "hello", "confidence": 85.0, "start": 0.5, "end": 1.2},
        {"text": "world", "confidence": 72.0, "start": 1.3, "end": 2.1},
        {"text": "test", "confidence": 55.0, "start": 2.2, "end": 3.0},
        {
            "text": "word",
            "confidence": 75.0,
            "start": 3.1,
            "end": 3.9,
            "phonemeIssues": [{"type": "substitution", "expected": "W", "heard": "V"}],
        },
    ]

    response = build_response(mocked_words, 35.0)

    assert response["overallScore"] == 72  # average of 85, 72, 55, 75 = 71.75 → 72
    assert len(response["words"]) == 4

    # Word 0: confidence 85 >= 80 → "good"
    assert response["words"][0]["word"] == "hello"
    assert response["words"][0]["confidence"] == 85
    assert response["words"][0]["bucket"] == "good"

    # Word 1: confidence 72 in [60, 80) and no issues → "needs-work"
    assert response["words"][1]["word"] == "world"
    assert response["words"][1]["confidence"] == 72
    assert response["words"][1]["bucket"] == "needs-work"

    # Word 2: confidence 55 < 60 → "mispronounced"
    assert response["words"][2]["word"] == "test"
    assert response["words"][2]["confidence"] == 55
    assert response["words"][2]["bucket"] == "mispronounced"

    # Word 3: confidence 75 in [60, 80) but has phonemeIssues → "mispronounced"
    assert response["words"][3]["word"] == "word"
    assert response["words"][3]["confidence"] == 75
    assert response["words"][3]["bucket"] == "mispronounced"
    assert response["words"][3]["phonemeIssues"] is not None

