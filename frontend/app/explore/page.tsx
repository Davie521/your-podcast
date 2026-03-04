'use client';

import { useState, useEffect } from 'react';
import { PodcastCard } from '@/components/PodcastCard';
import { SearchInput } from '@/components/SearchInput';
import { BottomNav } from '@/components/BottomNav';
import { usePlayer } from '@/context/PlayerContext';
import { getEpisodes } from '@/lib/api';
import type { EpisodeListItem } from '@/types/podcast';

export default function ExplorePage() {
  const [episodes, setEpisodes] = useState<readonly EpisodeListItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { play } = usePlayer();

  useEffect(() => {
    getEpisodes()
      .then((res) => setEpisodes(res.episodes))
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredEpisodes = episodes.filter(
    (ep) =>
      ep.title.toLowerCase().includes(search.toLowerCase()) ||
      ep.creator.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto max-w-[428px] px-6 pt-6 pb-24">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-6">
            <h1 className="font-serif text-4xl leading-10 text-[#111]">Discover</h1>
            <SearchInput value={search} onChange={setSearch} />
          </div>

          {/* Episode List */}
          <div className="flex flex-col gap-6">
            {isLoading && (
              <p className="font-[family-name:var(--font-inter)] text-sm text-[#666] text-center py-8">
                Loading...
              </p>
            )}
            {hasError && (
              <p className="font-[family-name:var(--font-inter)] text-sm text-[#666] text-center py-8">
                Failed to load episodes.
              </p>
            )}
            {!isLoading && !hasError && filteredEpisodes.length === 0 && (
              <p className="font-[family-name:var(--font-inter)] text-sm text-[#666] text-center py-8">
                No podcasts found.
              </p>
            )}
            {filteredEpisodes.map((episode) => (
              <PodcastCard
                key={episode.id}
                title={episode.title}
                author={episode.creator.name}
                description={episode.description}
                coverUrl={episode.cover_url}
                onPlay={() => play(episode)}
              />
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
