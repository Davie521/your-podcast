'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { EpisodeListItem } from '@/types/podcast';

interface PlayerState {
  currentEpisode: EpisodeListItem | null;
  isPlaying: boolean;
  play: (episode: EpisodeListItem) => void;
  pause: () => void;
  toggle: () => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (ctx == null) {
    throw new Error('usePlayer must be used inside PlayerProvider');
  }
  return ctx;
}

interface PlayerProviderProps {
  children: ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeListItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((episode: EpisodeListItem) => {
    if (audioRef.current == null) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    if (currentEpisode?.id !== episode.id) {
      audio.src = episode.audio_url;
      setCurrentEpisode(episode);
    }

    void audio.play().then(() => setIsPlaying(true));
  }, [currentEpisode]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (currentEpisode != null) {
      void audioRef.current?.play().then(() => setIsPlaying(true));
    }
  }, [isPlaying, currentEpisode, pause]);

  return (
    <PlayerContext.Provider value={{ currentEpisode, isPlaying, play, pause, toggle }}>
      {children}
    </PlayerContext.Provider>
  );
}
