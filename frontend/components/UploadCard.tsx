"use client";

import { useState } from "react";
import DetailedResults from "./DetailedResults";

interface PhonemeIssue {
  type: "substitution" | "omission" | "insertion";
  expected: string | null;
  heard: string | null;
}

interface AnalysisResponse {
  overallScore: number;
  words: Array<{
    word: string;
    confidence: number;
    bucket: "good" | "needs-work" | "mispronounced";
    phonemeIssues?: Array<PhonemeIssue> | null;
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
        throw new Error(errorData.detail || "Failed to analyze audio");
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
    <div className="w-full">
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Pronunciation Scorer
              </h1>
              <p className="text-gray-600 text-lg">
                Improve your English pronunciation with AI-powered feedback
              </p>
            </div>

            {/* File Upload */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                📁 Upload Your Audio
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 cursor-pointer border-2 border-dashed border-blue-300 rounded-lg py-8 text-center hover:border-blue-400 transition-colors"
                />
              </div>
              {file && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Selected: {file.name}
                  </p>
                </div>
              )}
              <p className="mt-3 text-xs text-gray-500">
                Audio must be between 30-45 seconds. Supports MP3, WAV, M4A, and other audio formats.
              </p>
            </div>

            {/* Duration Error */}
            {durationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-sm text-red-700">{durationError}</p>
              </div>
            )}

            {/* Consent Checkbox */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={loading}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I consent to my voice recording being processed on this
                  server to generate a pronunciation score. My audio is not
                  stored and is discarded after scoring.
                </span>
              </label>
            </div>

            {/* API Error */}
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <span className="text-xl">❌</span>
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin">⏳</span>
                  Analyzing Your Pronunciation...
                </span>
              ) : (
                "🎤 Analyze Pronunciation"
              )}
            </button>
          </div>
        </form>
      ) : (
        <DetailedResults
          result={result}
          onReset={() => {
            setResult(null);
            setFile(null);
            setConsent(false);
            setApiError(null);
          }}
        />
      )}
    </div>
  );
}

