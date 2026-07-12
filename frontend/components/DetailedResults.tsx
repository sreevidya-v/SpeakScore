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

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return "bg-green-50 border-green-200";
    if (score >= 70) return "bg-blue-50 border-blue-200";
    if (score >= 50) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 85) return "Excellent! Your pronunciation is very clear.";
    if (score >= 70) return "Good! Keep practicing to improve further.";
    if (score >= 50) return "Fair. Focus on the highlighted words.";
    return "Needs work. Practice the red-highlighted words regularly.";
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
      <div className={`bg-white rounded-xl shadow-lg p-8 border ${getScoreBg(result.overallScore)}`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Pronunciation Score
            </h1>
            <p className="text-gray-600 mb-6">
              {getScoreMessage(result.overallScore)}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={
                    result.overallScore >= 85
                      ? "#16a34a"
                      : result.overallScore >= 70
                        ? "#2563eb"
                        : result.overallScore >= 50
                          ? "#d97706"
                          : "#dc2626"
                  }
                  strokeWidth="8"
                  strokeDasharray={`${(result.overallScore / 100) * 351.8} 351.8`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <div className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}
                </div>
                <div className="text-xs text-gray-600">out of 100</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Word Accuracy Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <div className="text-4xl font-bold text-green-600 mb-2">{stats.good}</div>
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Excellent Words
            </div>
            <div className="text-2xl font-bold text-green-600">{percentages.good}%</div>
            <div className="text-xs text-gray-600 mt-2">Clear, confident pronunciation</div>
          </div>

          <div className="p-6 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-4xl font-bold text-amber-600 mb-2">{stats.needsWork}</div>
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Needs Work
            </div>
            <div className="text-2xl font-bold text-amber-600">{percentages.needsWork}%</div>
            <div className="text-xs text-gray-600 mt-2">Minor clarity issues</div>
          </div>

          <div className="p-6 bg-red-50 rounded-lg border border-red-200">
            <div className="text-4xl font-bold text-red-600 mb-2">{stats.mispronounced}</div>
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Mispronounced
            </div>
            <div className="text-2xl font-bold text-red-600">{percentages.mispronounced}%</div>
            <div className="text-xs text-gray-600 mt-2">Needs focused practice</div>
          </div>
        </div>
      </div>

      {/* Transcript with Feedback */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Transcript</h2>
        <div className="space-y-4">
          {result.words.map((word, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {word.word}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        word.bucket === "good"
                          ? "bg-green-100 text-green-800"
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

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Confidence: {word.confidence}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          word.confidence >= 80
                            ? "bg-green-500"
                            : word.confidence >= 60
                              ? "bg-blue-500"
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
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-semibold text-gray-700">
                        Phoneme Issues:
                      </p>
                      {word.phonemeIssues.map((issue, issueIdx) => (
                        <div
                          key={issueIdx}
                          className="text-sm bg-red-50 p-2 rounded border border-red-200"
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
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💡 Improvement Tips
          </h2>
          <p className="text-gray-700 mb-6">
            Focus on these {improvements.length} words to improve your overall
            score:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {improvements.map((word, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <span className="text-lg font-bold text-gray-900">
                    {word.word}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Confidence: {word.confidence}% (Target: 80%+)
                </p>
                {word.phonemeIssues && word.phonemeIssues.length > 0 ? (
                  <ul className="text-sm text-gray-700 space-y-1">
                    {word.phonemeIssues.slice(0, 2).map((issue, issueIdx) => (
                      <li key={issueIdx} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
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
          className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          🎤 Analyze Another Recording
        </button>
        <button
          onClick={() => window.open("https://www.youtube.com/results?search_query=english+pronunciation+practice", "_blank")}
          className="flex-1 py-3 px-6 bg-white text-blue-600 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all"
        >
          📚 Learn More Tips
        </button>
      </div>
    </div>
  );
}
