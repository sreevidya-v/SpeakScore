"use client";

import { useState, useRef } from "react";
import DetailedResults from "./DetailedResults";
import AudioRecorder from "./AudioRecorder";
import AudioPlayer from "./AudioPlayer";

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
  const [tab, setTab] = useState<"record" | "upload">("record");
  const [file, setFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    const file = new File([blob], `recording-${Date.now()}.webm`, {
      type: "audio/webm",
    });
    setRecordedBlob(blob);
    setFile(file);
    setDurationError(null);
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

  return (
    <div className="w-full">
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-200">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-5xl font-bold text-gray-900 mb-2">
                🎤 Pronunciation Master
              </h1>
              <p className="text-gray-600 text-lg">
                Record or upload audio to get instant pronunciation feedback powered by AI
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b-2 border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setTab("record");
                  setFile(null);
                  setRecordedBlob(null);
                  setDurationError(null);
                }}
                className={`pb-3 px-4 font-semibold text-lg transition-all border-b-2 -mb-0.5 ${
                  tab === "record"
                    ? "text-gray-900 border-gray-900"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                🎙️ Record Audio
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("upload");
                  setFile(null);
                  setRecordedBlob(null);
                  setDurationError(null);
                }}
                className={`pb-3 px-4 font-semibold text-lg transition-all border-b-2 -mb-0.5 ${
                  tab === "upload"
                    ? "text-gray-900 border-gray-900"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                📁 Upload File
              </button>
            </div>

            {/* Content Area */}
            <div className="mb-8">
              {tab === "record" ? (
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                  <AudioRecorder
                    onRecordingComplete={handleRecordingComplete}
                    isAnalyzing={loading}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full py-12 px-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">📁</div>
                      <p className="text-lg font-semibold text-gray-900 mb-1">
                        Click to upload audio
                      </p>
                      <p className="text-sm text-gray-500">
                        or drag and drop (MP3, WAV, M4A, etc.)
                      </p>
                    </div>
                  </button>

                  {file && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-sm text-emerald-800">
                        ✓ Selected: {file.name}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Audio must be between 30-45 seconds
                  </p>
                </div>
              )}
            </div>

            {/* Audio Preview */}
            {recordedBlob && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Recording Preview
                </p>
                <AudioPlayer audioBlob={recordedBlob} fileName="Your Recording" />
              </div>
            )}

            {/* Duration Error */}
            {durationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <p className="text-sm text-red-700">{durationError}</p>
              </div>
            )}

            {/* Consent */}
            <div className="mb-8 p-5 bg-gray-100 rounded-xl border border-gray-300">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={loading}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 cursor-pointer"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I consent to my voice recording being processed to generate a
                  pronunciation score. My audio is not stored and is discarded immediately
                  after scoring.
                </span>
              </label>
            </div>

            {/* API Error */}
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <span className="text-xl flex-shrink-0">❌</span>
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || !consent || loading || durationError !== null}
              className="w-full py-4 px-6 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none text-lg"
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
            setRecordedBlob(null);
            setConsent(false);
            setApiError(null);
            setTab("record");
          }}
        />
      )}
    </div>
  );
}

