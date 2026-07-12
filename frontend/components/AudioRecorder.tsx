"use client";

import { useState, useRef, useEffect } from "react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  isAnalyzing: boolean;
}

export default function AudioRecorder({
  onRecordingComplete,
  isAnalyzing,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Unable to access microphone. Please check permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setDuration(0);
  };

  const submitRecording = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, duration);
      discardRecording();
    }
  };

  const isValidDuration = duration >= 30 && duration <= 45;
  const displayDuration = `${Math.floor(duration / 60)}:${(duration % 60)
    .toString()
    .padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {!recordedBlob ? (
        <>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`text-center ${
                    isRecording ? "animate-pulse" : ""
                  }`}
                >
                  <div
                    className={`text-4xl font-bold ${
                      isRecording ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    {displayDuration}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isRecording ? "Recording..." : "Ready"}
                  </div>
                </div>
              </div>
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={isRecording ? "#ef4444" : "#6b7280"}
                  strokeWidth="2"
                  strokeDasharray={`${(duration / 60) * 351.8} 351.8`}
                  strokeLinecap="round"
                  className="transition-all"
                />
              </svg>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isAnalyzing}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                🎙️ Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                ⏹️ Stop Recording
              </button>
            )}
          </div>

          {duration > 0 && duration < 30 && (
            <p className="text-center text-sm text-amber-600">
              Need at least 30 seconds (currently {duration}s)
            </p>
          )}
          {duration > 45 && (
            <p className="text-center text-sm text-red-600">
              Maximum is 45 seconds (currently {duration}s)
            </p>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Recording captured</p>
            <div className="text-2xl font-bold text-gray-900">
              {displayDuration}
            </div>
            {isValidDuration ? (
              <p className="text-xs text-emerald-600 mt-2">✓ Valid duration</p>
            ) : (
              <p className="text-xs text-red-600 mt-2">
                ✗ Duration must be 30-45 seconds
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={submitRecording}
              disabled={!isValidDuration || isAnalyzing}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ✓ Use Recording
            </button>
            <button
              onClick={discardRecording}
              disabled={isAnalyzing}
              className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
