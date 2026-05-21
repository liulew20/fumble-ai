"use client";
import { useEffect, useRef, useState } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Try autoplay on first user interaction
    const tryPlay = () => {
      audio.play().then(() => setPlaying(true)).catch(() => {});
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("keydown", tryPlay);
    };

    // Try immediate autoplay (works in some browsers)
    audio.play().then(() => setPlaying(true)).catch(() => {
      // Blocked by browser — wait for first interaction
      document.addEventListener("click", tryPlay);
      document.addEventListener("keydown", tryPlay);
    });

    return () => {
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("keydown", tryPlay);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <>
      <audio ref={audioRef} src="/Dilemma.mp3" loop preload="auto" />
      <button
        onClick={toggle}
        title={playing ? "暂停音乐" : "播放音乐"}
        className="fixed bottom-16 right-4 sm:bottom-20 sm:right-6 flex items-center justify-center w-10 h-10 rounded-full bg-black text-white shadow-lg hover:bg-gray-800 transition-colors z-50 text-lg"
      >
        {playing ? "🔇" : "🎵"}
      </button>
    </>
  );
}
