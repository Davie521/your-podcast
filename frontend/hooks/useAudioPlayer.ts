'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenerRef = useRef<(() => void) | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (listenerRef.current) {
        audioRef.current.removeEventListener('ended', listenerRef.current);
        listenerRef.current = null;
      }
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanupAudio;
  }, [cleanupAudio]);

  const toggle = useCallback((id: string, audioUrl?: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    cleanupAudio();

    if (!audioUrl) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(audioUrl);
    const onEnded = () => setPlayingId(null);
    listenerRef.current = onEnded;
    audio.addEventListener('ended', onEnded);
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(id);
  }, [playingId, cleanupAudio]);

  return { playingId, toggle };
}
