'use client';

import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { PauseIcon } from '@/components/icons/PauseIcon';

export function Player() {
  const { currentEpisode, isPlaying, toggle } = usePlayer();

  if (currentEpisode == null) {
    return null;
  }

  const { title, creator, cover_url } = currentEpisode;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="mx-auto w-full max-w-[428px] px-3 pointer-events-auto">
        <div className="flex items-center gap-3 bg-[#111] rounded-2xl px-4 py-3 shadow-lg">
          {/* Cover */}
          <div className="relative size-10 shrink-0 rounded-lg overflow-hidden bg-[#333]">
            {cover_url != null && (
              <Image
                src={cover_url}
                alt={`${title} cover`}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{title}</p>
            <p className="text-white/60 text-xs truncate">{creator.name}</p>
          </div>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="size-10 rounded-full bg-white flex items-center justify-center shrink-0"
          >
            {isPlaying ? (
              <PauseIcon className="size-4 text-[#111]" />
            ) : (
              <PlayIcon className="size-4 text-[#111] pl-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
