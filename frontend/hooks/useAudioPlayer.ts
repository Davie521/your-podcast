'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, []);

  const toggle = useCallback((id: string, audioUrl?: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => setPlayingId(null));
      audio.play().catch(() => setPlayingId(null));
      audioRef.current = audio;
      setPlayingId(id);
    }
  }, [playingId]);

  return { playingId, toggle };
}
