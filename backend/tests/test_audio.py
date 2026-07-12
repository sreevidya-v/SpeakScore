"""Integration tests for audio validation on the analyze endpoint."""

from io import BytesIO

import numpy as np
from fastapi.testclient import TestClient
from scipy.io import wavfile

from main import app


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
    assert response.json()["status"] == "ok"
    assert response.json()["duration"] == 30.0


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


def test_missing_consent_is_rejected() -> None:
    """Audio cannot be analyzed before explicit consent is supplied."""
    response = post_audio(make_sine_wav(30), consent=None)

    assert response.status_code == 400
    assert response.json() == {"detail": "consent_required"}
