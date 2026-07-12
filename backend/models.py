"""Pydantic models for the Pronunciation Coach API."""

from pydantic import BaseModel


class AnalysisResponse(BaseModel):
    """Placeholder response shape for pronunciation analysis.

    TODO: Add transcription, phoneme, score, and feedback fields.
    """

    detail: str
