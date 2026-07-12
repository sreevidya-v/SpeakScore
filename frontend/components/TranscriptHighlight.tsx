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

interface TranscriptHighlightProps {
  words: Word[];
}

export default function TranscriptHighlight({
  words,
}: TranscriptHighlightProps) {
  const getBucketStyles = (
    bucket: "good" | "needs-work" | "mispronounced"
  ) => {
    switch (bucket) {
      case "good":
        return "text-green-700 bg-green-100";
      case "needs-work":
        return "text-amber-700 bg-amber-100";
      case "mispronounced":
        return "text-red-700 bg-red-100";
    }
  };

  const formatPhonemeIssues = (issues: PhonemeIssue[] | undefined | null) => {
    if (!issues || issues.length === 0) return "";

    return issues
      .map((issue) => {
        switch (issue.type) {
          case "substitution":
            return `Substitution: expected "${issue.expected}" but heard "${issue.heard}"`;
          case "omission":
            return `Omission: expected "${issue.expected}" but not heard`;
          case "insertion":
            return `Insertion: heard "${issue.heard}" but not expected`;
        }
      })
      .join("\n");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Transcript</h2>
      <div className="flex flex-wrap gap-2">
        {words.map((word, idx) => {
          const styles = getBucketStyles(word.bucket);
          const tooltip = formatPhonemeIssues(word.phonemeIssues);

          return (
            <span
              key={idx}
              className={`px-3 py-1 rounded-md ${styles} cursor-help transition-colors`}
              title={
                tooltip ||
                `Confidence: ${word.confidence}% (${word.bucket})`
              }
            >
              {word.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
