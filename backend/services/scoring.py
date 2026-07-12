"""Pronunciation-scoring service."""

from typing import TypedDict


class WordResult(TypedDict):
    """Scored and classified word result."""

    word: str
    confidence: int
    bucket: str  # "good", "needs-work", or "mispronounced"
    phonemeIssues: list[dict] | None  # Only present if non-empty


class ScoringResponse(TypedDict):
    """Final response schema."""

    overallScore: int
    words: list[WordResult]


def build_response(words: list[dict], duration: float) -> ScoringResponse:
    """Build the final scoring response with bucket classification and overall score.

    Bucket rules:
    - "good": confidence >= 80
    - "needs-work": 60 <= confidence < 80 AND no phonemeIssues
    - "mispronounced": confidence < 60 OR phonemeIssues is non-empty

    overallScore = average confidence across all words, rounded to nearest int.
    """
    scored_words: list[WordResult] = []
    confidences: list[int] = []

    for word in words:
        confidence = int(round(word.get("confidence", 0)))
        confidences.append(confidence)

        phoneme_issues = word.get("phonemeIssues")
        phoneme_issues_list = phoneme_issues if phoneme_issues else None

        # Classify into bucket.
        if confidence >= 80:
            bucket = "good"
        elif 60 <= confidence < 80 and not phoneme_issues:
            bucket = "needs-work"
        else:
            bucket = "mispronounced"

        word_result: WordResult = {
            "word": word["text"],
            "confidence": confidence,
            "bucket": bucket,
            "phonemeIssues": phoneme_issues_list,
        }
        scored_words.append(word_result)

    # Calculate overall score as average confidence, rounded to nearest int.
    overall_score = round(sum(confidences) / len(confidences)) if confidences else 0

    return ScoringResponse(overallScore=overall_score, words=scored_words)
