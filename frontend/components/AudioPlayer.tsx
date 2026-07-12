"use client";

import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  audioBlob: Blob;
  fileName?: string;
}

export default function AudioPlayer({
  audioBlob,
  fileName = "Recording",
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((e) => console.error("Playback error:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = percent * duration;
    }
  };

  const url = URL.createObjectURL(audioBlob);

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <audio ref={audioRef} src={url} />

      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-900 text-white flex items-center justify-center transition-colors"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{fileName}</p>
          <p className="text-xs text-gray-500">Audio playback</p>
        </div>
        <div className="text-xs text-gray-600 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div
        onClick={handleProgressClick}
        className="w-full h-2 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400 transition-colors"
      >
        <div
          className="h-full bg-gray-800 rounded-full transition-all"
          style={{
            width: duration ? `${(currentTime / duration) * 100}%` : "0%",
          }}
        />
      </div>
    </div>
  );
}
