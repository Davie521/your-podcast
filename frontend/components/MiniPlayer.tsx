'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAudioState } from '@/hooks/useAudioState';
import { useAudioDispatch } from '@/hooks/useAudioDispatch';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { PauseIcon } from '@/components/icons/PauseIcon';

export function MiniPlayer() {
  const { currentEpisode, isPlaying, currentTime, duration } = useAudioState();
  const { pause, resume } = useAudioDispatch();

  if (!currentEpisode) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const Icon = isPlaying ? PauseIcon : PlayIcon;

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }

  return (
    <Link
      href={`/episode/${currentEpisode.id}`}
      className="fixed bottom-17 left-0 right-0 z-20 border-t border-border-warm bg-cream/95 backdrop-blur-sm animate-slide-up"
    >
      {/* Progress bar */}
      <div className="h-[2px] bg-border-warm">
        <div
          className="h-full bg-[#111] transition-[width] duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Cover */}
        <div
          className="relative size-10 shrink-0 rounded-lg overflow-hidden"
          style={{ backgroundColor: currentEpisode.color }}
        >
          {currentEpisode.imageUrl && (
            <Image
              src={currentEpisode.imageUrl}
              alt={currentEpisode.title}
              fill
              className="object-cover opacity-80"
            />
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm font-bold text-[#111] truncate">
            {currentEpisode.title}
          </p>
          <p className="font-inter text-xs text-[#666] truncate">
            {currentEpisode.creator}
          </p>
        </div>

        {/* Play/Pause */}
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="size-9 shrink-0 rounded-full bg-[#111] flex items-center justify-center transition-transform duration-150 active:scale-90"
        >
          <Icon className="size-3.5 text-white" />
        </button>
      </div>
    </Link>
  );
}
