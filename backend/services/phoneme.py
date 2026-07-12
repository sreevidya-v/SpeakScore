"""Phoneme-level pronunciation error analysis."""

import difflib
import io
from typing import TypedDict

import numpy as np
import torch
import torchaudio
from g2p_en.g2p import G2p
from scipy.io import wavfile
from transformers import AutoProcessor, AutoModelForCTC


class PhonemeDifference(TypedDict):
    """A single phoneme substitution, insertion, or omission."""

    type: str  # "substitution", "insertion", "omission"
    expected: str | None
    recognized: str | None


# Load g2p_en once at module import time.
_g2p = G2p()

# Lazy-load wav2vec2 model and processor: only initialized on first use.
# This avoids requiring espeak at import time for non-phoneme tests.
_processor = None
_model = None


def _ensure_models_loaded() -> tuple:
    """Load wav2vec2 model and processor on first use (lazy loading)."""
    global _processor, _model
    if _processor is None or _model is None:
        _processor = AutoProcessor.from_pretrained("facebook/wav2vec2-lv-60-espeak-cv-ft")
        _model = AutoModelForCTC.from_pretrained("facebook/wav2vec2-lv-60-espeak-cv-ft")
        _model.eval()
    return _processor, _model


def expected_phonemes(word: str) -> list[str]:
    """Return ARPAbet phonemes expected for a word using g2p_en."""
    phonemes = _g2p(word)
    # g2p returns a list that may include word boundaries; filter to phonemes only.
    return [p for p in phonemes if p not in (" ", "")]


def recognized_phonemes(wav_bytes: bytes, start: float, end: float) -> list[str]:
    """Extract phonemes from a slice of audio using wav2vec2.

    Args:
        wav_bytes: Full audio in WAV format (16 kHz mono PCM).
        start: Start time in seconds.
        end: End time in seconds.

    Returns:
        List of recognized phoneme labels.
    """
    processor, model = _ensure_models_loaded()

    # Parse the WAV to extract audio data and sample rate.
    wav_buffer = io.BytesIO(wav_bytes)
    sample_rate, audio_data = wavfile.read(wav_buffer)

    # Convert to float32 and normalize to [-1, 1].
    if audio_data.dtype != np.float32:
        audio_data = audio_data.astype(np.float32) / np.iinfo(audio_data.dtype).max

    # Calculate sample indices for the time range.
    start_sample = int(start * sample_rate)
    end_sample = int(end * sample_rate)
    audio_slice = audio_data[start_sample:end_sample]

    # Convert to torch tensor and process through wav2vec2.
    audio_tensor = torch.from_numpy(audio_slice).unsqueeze(0)
    with torch.no_grad():
        inputs = processor(audio_tensor, sampling_rate=sample_rate, return_tensors="pt")
        logits = model(inputs["input_values"]).logits

    # Decode predicted phoneme IDs to labels.
    predicted_ids = torch.argmax(logits, dim=-1)
    predicted_phonemes = processor.batch_decode(predicted_ids)

    # predicted_phonemes is a list of strings like "e n t ə r"; split to individual phonemes.
    phonemes = predicted_phonemes[0].split() if predicted_phonemes else []
    return phonemes


def compare_phonemes(expected: list[str], recognized: list[str]) -> list[PhonemeDifference]:
    """Align expected and recognized phonemes and identify differences.

    Uses difflib.SequenceMatcher for alignment. Returns substitutions, insertions, and omissions.

    Args:
        expected: Expected phoneme sequence.
        recognized: Recognized phoneme sequence.

    Returns:
        List of differences with type (substitution/insertion/omission),
        expected phoneme, and recognized phoneme.
    """
    matcher = difflib.SequenceMatcher(None, expected, recognized)
    differences: list[PhonemeDifference] = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "replace":
            # Substitution: expected phoneme(s) became recognized phoneme(s).
            for exp, rec in zip(expected[i1:i2], recognized[j1:j2]):
                differences.append(
                    PhonemeDifference(type="substitution", expected=exp, recognized=rec)
                )
            # If lengths differ, handle extras as insertions/omissions.
            if i2 - i1 < j2 - j1:
                for rec in recognized[i2 - i1 + j1 : j2]:
                    differences.append(
                        PhonemeDifference(type="insertion", expected=None, recognized=rec)
                    )
            elif i2 - i1 > j2 - j1:
                for exp in expected[j2 - j1 + i1 : i2]:
                    differences.append(
                        PhonemeDifference(type="omission", expected=exp, recognized=None)
                    )
        elif tag == "insert":
            # Insertion: recognized phonemes with no expected counterpart.
            for rec in recognized[j1:j2]:
                differences.append(
                    PhonemeDifference(type="insertion", expected=None, recognized=rec)
                )
        elif tag == "delete":
            # Omission: expected phonemes that were not recognized.
            for exp in expected[i1:i2]:
                differences.append(
                    PhonemeDifference(type="omission", expected=exp, recognized=None)
                )

    return differences
