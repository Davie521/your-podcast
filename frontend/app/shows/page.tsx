'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Episode } from '@/types/audio';
import { BottomNav } from '@/components/BottomNav';
import { EpisodeRow } from '@/components/EpisodeRow';
import { useAudioState } from '@/hooks/useAudioState';
import { useAudioDispatch } from '@/hooks/useAudioDispatch';
import { fetchMyEpisodes } from '@/lib/api';
import { formatDuration } from '@/lib/format';

type LoadState = 'loading' | 'loaded' | 'error';

export default function ShowsPage() {
  const [episodes, setEpisodes] = useState<readonly Episode[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const { currentEpisode, isPlaying } = useAudioState();
  const { toggle, play } = useAudioDispatch();
  const router = useRouter();

  const hasPlayer = currentEpisode !== null;

  useEffect(() => {
    let cancelled = false;
    fetchMyEpisodes()
      .then((result) => {
        if (cancelled) return;
        setEpisodes(result.episodes);
        setLoadState('loaded');
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState('error');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <main className={`mx-auto w-full max-w-[428px] px-6 pt-6 ${hasPlayer ? 'pb-36' : 'pb-24'}`}>
        {/* Header */}
        <div className="flex flex-col gap-3 mb-10 animate-fade-in">
          <h1 className="font-serif text-4xl leading-10 text-[#111]">My Shows</h1>
          <p className="font-serif italic text-[14px] text-[#666] leading-5 opacity-70">
            Your saved AI-generated podcasts
          </p>
        </div>

        {/* Content */}
        {loadState === 'loading' && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-start pb-4 animate-pulse">
                <div className="size-20 shrink-0 rounded-[10px] bg-[#e5e5e0]" />
                <div className="flex-1 pt-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-[#e5e5e0]" />
                  <div className="h-3 w-1/2 rounded bg-[#e5e5e0]" />
                  <div className="h-3 w-1/3 rounded bg-[#e5e5e0]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {loadState === 'error' && (
          <p className="font-inter text-sm text-[#666] text-center py-16 animate-fade-in">
            Sign in to see your podcasts.
          </p>
        )}

        {loadState === 'loaded' && episodes.length === 0 && (
          <p className="font-inter text-sm text-[#666] text-center py-16 animate-fade-in">
            No podcasts yet. Generate your first one!
          </p>
        )}

        {loadState === 'loaded' && episodes.length > 0 && (
          <section>
            <h2 className="font-serif font-bold text-[14px] text-black/60 tracking-[1.4px] uppercase mb-4 animate-fade-in anim-delay-1">
              Recent
            </h2>
            <div className="flex flex-col gap-4">
              {episodes.map((ep, index) => (
                <EpisodeRow
                  key={ep.id}
                  title={ep.title}
                  description={ep.description}
                  creatorName={ep.creatorName}
                  duration={formatDuration(ep.duration)}
                  coverUrl={ep.coverUrl}
                  color={ep.color}
                  isPlaying={currentEpisode?.id === ep.id && isPlaying}
                  onPlay={() => toggle(ep)}
                  onTap={() => {
                    play(ep);
                    router.push(`/episode/${ep.id}`);
                  }}
                  className="animate-list-item"
                  style={{ animationDelay: `${200 + index * 60}ms` }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
