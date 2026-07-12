"use client";

import { useState } from "react";
import TranscriptHighlight from "./TranscriptHighlight";

interface AnalysisResponse {
  overallScore: number;
  words: Array<{
    word: string;
    confidence: number;
    bucket: "good" | "needs-work" | "mispronounced";
    phonemeIssues?: Array<{
      type: "substitution" | "omission" | "insertion";
      expected: string | null;
      heard: string | null;
    }> | null;
  }>;
}

export default function UploadCard() {
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const validateAudioDuration = async (
    audioFile: File
  ): Promise<number | null> => {
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer.duration;
    } catch (error) {
      console.error("Error decoding audio:", error);
      return null;
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDurationError(null);

      const duration = await validateAudioDuration(selectedFile);
      if (duration !== null) {
        if (duration < 30 || duration > 45) {
          setDurationError(
            `Audio duration is ${duration.toFixed(1)} seconds. Please upload an audio file between 30-45 seconds.`
          );
          setFile(null);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !consent) {
      return;
    }

    setLoading(true);
    setApiError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("consent", "true");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to analyze audio"
        );
      }

      const data: AnalysisResponse = await response.json();
      setResult(data);
      setFile(null);
      setConsent(false);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    !file || !consent || loading || durationError !== null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pronunciation Scorer
            </h1>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Audio
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Duration Error */}
            {durationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{durationError}</p>
              </div>
            )}

            {/* Consent Checkbox */}
            <div className="mb-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={loading}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">
                  I consent to my voice recording being processed on this
                  server to generate a pronunciation score. My audio is not
                  stored and is discarded after scoring.
                </span>
              </label>
            </div>

            {/* API Error */}
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Analyzing..." : "Analyze Pronunciation"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Results</h2>
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm font-medium text-gray-600">Overall Score</p>
              <p className="text-4xl font-bold text-blue-600">
                {result.overallScore}
              </p>
            </div>
          </div>

          <TranscriptHighlight words={result.words} />

          <button
            onClick={() => {
              setResult(null);
              setFile(null);
              setConsent(false);
            }}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors"
          >
            Analyze Another Recording
          </button>
        </div>
      )}
    </div>
  );
}
