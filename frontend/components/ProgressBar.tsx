'use client';

import { useRef, useState, useCallback } from 'react';
import { useAudioState } from '@/hooks/useAudioState';
import { useAudioDispatch } from '@/hooks/useAudioDispatch';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ProgressBar() {
  const { currentTime, duration, isPlaying } = useAudioState();
  const { seek } = useAudioDispatch();
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getTimeFromEvent = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || duration <= 0) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }, [duration]);

  function handlePointerDown(e: React.PointerEvent) {
    isDragging.current = true;
    setIsDraggingState(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    seek(getTimeFromEvent(e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    seek(getTimeFromEvent(e.clientX));
  }

  function handlePointerUp() {
    isDragging.current = false;
    setIsDraggingState(false);
  }

  return (
    <div className="w-full px-2">
      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-6 flex items-center cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="slider"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
      >
        {/* Background track */}
        <div className="absolute left-0 right-0 h-1 rounded-full bg-border-warm" />
        {/* Filled track */}
        <div
          className="absolute left-0 h-1 rounded-full bg-[#111] transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
        {/* Thumb */}
        <div
          className={`absolute rounded-full bg-[#111] -translate-x-1/2 shadow-sm transition-all duration-150 ${
            isDraggingState ? 'size-5 shadow-md' : isPlaying ? 'size-3.5' : 'size-3'
          }`}
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-1">
        <span className="font-inter text-xs text-[#666]">{formatTime(currentTime)}</span>
        <span className="font-inter text-xs text-[#666]">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
