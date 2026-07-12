"use client";

interface PhonemeIssue {
  type: "substitution" | "omission" | "insertion";
  expected: string | null;
  heard: string | null;
}

interface Word {
  word: string;
  confidence: number;
  bucket: "good" | "needs-work" | "mispronounced";
  phonemeIssues?: PhonemeIssue[] | null;
}

interface DetailedResultsProps {
  result: {
    overallScore: number;
    words: Word[];
  };
  onReset: () => void;
}

export default function DetailedResults({
  result,
  onReset,
}: DetailedResultsProps) {
  const stats = {
    good: result.words.filter((w) => w.bucket === "good").length,
    needsWork: result.words.filter((w) => w.bucket === "needs-work").length,
    mispronounced: result.words.filter((w) => w.bucket === "mispronounced")
      .length,
    total: result.words.length,
  };

  const percentages = {
    good: Math.round((stats.good / stats.total) * 100),
    needsWork: Math.round((stats.needsWork / stats.total) * 100),
    mispronounced: Math.round((stats.mispronounced / stats.total) * 100),
  };

  const getScoreMessage = (score: number) => {
    if (score >= 85) return "Excellent! Your pronunciation is crystal clear.";
    if (score >= 70) return "Very good! Keep practicing to refine further.";
    if (score >= 50) return "Good effort. Focus on the highlighted areas.";
    return "Keep practicing. Your dedication will pay off!";
  };

  const phonemeTypeExplanations: {
    [key in "substitution" | "omission" | "insertion"]: string;
  } = {
    substitution: "You pronounced a different sound",
    omission: "You skipped this sound",
    insertion: "You added an extra sound",
  };

  const improvements = result.words
    .filter((w) => w.bucket === "mispronounced")
    .slice(0, 5);

  return (
    <div className="w-full space-y-8">
      {/* Overall Score Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-200">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Your Pronunciation Score
            </h1>
            <p className="text-gray-600 text-lg">
              {getScoreMessage(result.overallScore)}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={
                    result.overallScore >= 85
                      ? "#10b981"
                      : result.overallScore >= 70
                        ? "#6b7280"
                        : result.overallScore >= 50
                          ? "#f59e0b"
                          : "#ef4444"
                  }
                  strokeWidth="8"
                  strokeDasharray={`${(result.overallScore / 100) * 439.8} 439.8`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-5xl font-bold text-gray-900">
                  {result.overallScore}
                </div>
                <div className="text-sm text-gray-500 mt-1">out of 100</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Word Accuracy Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-5xl font-bold text-emerald-600 mb-3">{stats.good}</div>
            <div className="text-lg font-semibold text-gray-900 mb-2">
              Excellent Words
            </div>
            <div className="text-3xl font-bold text-emerald-600 mb-2">{percentages.good}%</div>
            <div className="text-sm text-gray-600">Clear, confident pronunciation</div>
          </div>

          <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
            <div className="text-5xl font-bold text-amber-600 mb-3">{stats.needsWork}</div>
            <div className="text-lg font-semibold text-gray-900 mb-2">
              Needs Work
            </div>
            <div className="text-3xl font-bold text-amber-600 mb-2">{percentages.needsWork}%</div>
            <div className="text-sm text-gray-600">Minor clarity issues</div>
          </div>

          <div className="p-6 bg-red-50 rounded-xl border border-red-200">
            <div className="text-5xl font-bold text-red-600 mb-3">{stats.mispronounced}</div>
            <div className="text-lg font-semibold text-gray-900 mb-2">
              Mispronounced
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">{percentages.mispronounced}%</div>
            <div className="text-sm text-gray-600">Needs focused practice</div>
          </div>
        </div>
      </div>

      {/* Transcript with Feedback */}
      <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Detailed Transcript</h2>
        <div className="space-y-4">
          {result.words.map((word, idx) => (
            <div key={idx} className="border border-gray-300 rounded-xl p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl font-bold text-gray-900">
                      {word.word}
                    </span>
                    <span
                      className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${
                        word.bucket === "good"
                          ? "bg-emerald-100 text-emerald-800"
                          : word.bucket === "needs-work"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {word.bucket === "good"
                        ? "✓ Excellent"
                        : word.bucket === "needs-work"
                          ? "⚠ Needs Work"
                          : "✗ Mispronounced"}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Confidence: {word.confidence}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          word.confidence >= 80
                            ? "bg-emerald-500"
                            : word.confidence >= 60
                              ? "bg-gray-600"
                              : word.confidence >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(word.confidence, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {word.phonemeIssues && word.phonemeIssues.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">
                        Phoneme Issues:
                      </p>
                      {word.phonemeIssues.map((issue, issueIdx) => (
                        <div
                          key={issueIdx}
                          className="text-sm bg-red-50 p-3 rounded-lg border border-red-200"
                        >
                          <span className="font-semibold text-red-800">
                            {issue.type === "substitution"
                              ? `Substitution:`
                              : issue.type === "omission"
                                ? `Omission:`
                                : `Insertion:`}
                          </span>
                          <span className="text-red-700 ml-2">
                            {phonemeTypeExplanations[issue.type]}
                            {issue.type === "substitution" &&
                              ` (Expected: "${issue.expected}", Heard: "${issue.heard}")`}
                            {issue.type === "omission" &&
                              ` (Missing: "${issue.expected}")`}
                            {issue.type === "insertion" &&
                              ` (Extra: "${issue.heard}")`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement Tips */}
      {improvements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            💡 Improvement Tips
          </h2>
          <p className="text-gray-700 mb-8 text-lg">
            Focus on these {improvements.length} words to improve your overall
            score:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {improvements.map((word, idx) => (
              <div key={idx} className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-300 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🎯</span>
                  <span className="text-xl font-bold text-gray-900">
                    {word.word}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Confidence: {word.confidence}% (Target: 80%+)
                </p>
                {word.phonemeIssues && word.phonemeIssues.length > 0 ? (
                  <ul className="text-sm text-gray-700 space-y-2">
                    {word.phonemeIssues.slice(0, 2).map((issue, issueIdx) => (
                      <li key={issueIdx} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold flex-shrink-0">•</span>
                        <span>
                          {issue.type === "substitution"
                            ? "Practice the correct vowel sound"
                            : issue.type === "omission"
                              ? "Don't skip the final consonant"
                              : "Avoid adding extra vowel sounds"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-700">
                    Listen to native speakers and practice slowly.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onReset}
          className="flex-1 py-4 px-6 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl text-lg"
        >
          🎤 Analyze Another Recording
        </button>
        <button
          onClick={() =>
            window.open(
              "https://www.youtube.com/results?search_query=english+pronunciation+practice",
              "_blank"
            )
          }
          className="flex-1 py-4 px-6 bg-white text-gray-900 rounded-xl font-semibold border-2 border-gray-900 hover:bg-gray-100 transition-all text-lg"
        >
          📚 Learn More Tips
        </button>
      </div>
    </div>
  );
}
