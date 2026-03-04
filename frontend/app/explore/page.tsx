'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchInput } from '@/components/SearchInput';
import { EpisodeRow } from '@/components/EpisodeRow';
import { BottomNav } from '@/components/BottomNav';
import { useAudioState } from '@/hooks/useAudioState';
import { useAudioDispatch } from '@/hooks/useAudioDispatch';
import { getDiscoverEpisodes } from '@/data/episodes';

const DISCOVER_EPISODES = getDiscoverEpisodes();

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const { currentEpisode, isPlaying } = useAudioState();
  const { toggle, play } = useAudioDispatch();
  const router = useRouter();

  const hasPlayer = currentEpisode !== null;

  const filtered = DISCOVER_EPISODES.filter(
    (ep) =>
      ep.title.toLowerCase().includes(search.toLowerCase()) ||
      ep.creator.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream">
      <main className={`mx-auto w-full max-w-[428px] px-6 pt-6 ${hasPlayer ? 'pb-36' : 'pb-24'}`}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 animate-fade-in">
            <h1 className="font-serif text-4xl leading-10 text-[#111]">
              Discover
            </h1>
            <SearchInput value={search} onChange={setSearch} />
          </div>

          <div className="flex flex-col gap-4">
            {filtered.length === 0 ? (
              <p className="font-inter text-sm text-[#666] text-center py-8 animate-fade-in">
                No podcasts found.
              </p>
            ) : (
              filtered.map((ep, index) => (
                <EpisodeRow
                  key={ep.id}
                  title={ep.title}
                  subtitle={ep.subtitle}
                  creator={ep.creator}
                  duration={ep.duration}
                  color={ep.color}
                  imageUrl={ep.imageUrl}
                  isPlaying={currentEpisode?.id === ep.id && isPlaying}
                  onPlay={() => toggle(ep)}
                  onTap={() => {
                    play(ep);
                    router.push(`/episode/${ep.id}`);
                  }}
                  className="animate-list-item"
                  style={{ animationDelay: `${100 + index * 60}ms` }}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
