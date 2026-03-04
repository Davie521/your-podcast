'use client';

import { useState } from 'react';
import { PodcastCard } from '@/components/PodcastCard';
import { SearchInput } from '@/components/SearchInput';
import { BottomNav } from '@/components/BottomNav';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { Podcast } from '@/types/podcast';

const SAMPLE_PODCASTS: (Podcast & { audio_url?: string })[] = [
  {
    id: '1',
    title: 'The Modern Nomad',
    author: 'Sarah Chen / Life & Travel',
    description: 'Explore unique voices and independent stories across the globe.',
    color: '#009689',
    audio_url: '/audio/sample1.mp3',
  },
  {
    id: '2',
    title: 'Sonic Diaries',
    author: 'Sarah Chen / Hot Diaries',
    description: 'Explore unique voices and independent stories across the globe.',
    color: '#432dd7',
    audio_url: '/audio/sample2.mp3',
  },
  {
    id: '3',
    title: 'Narrative Waves',
    author: 'Sarah Chen / Life & Travel',
    description: 'Explore unique voices and independent stories across the globe.',
    color: '#ff637e',
    audio_url: '/audio/sample3.mp3',
  },
  {
    id: '4',
    title: 'Culture Club',
    author: 'Sarah Stones / Culture Club',
    description: 'Explore unique voices and independent stories across the globe.',
    color: '#f54900',
    audio_url: '/audio/sample4.mp3',
  },
  {
    id: '5',
    title: 'Daily Brief',
    author: 'Host: Chen / Life & Brief',
    description: 'Explore unique voices and independent stories across the globe.',
    color: '#155dfc',
    audio_url: '/audio/sample5.mp3',
  },
];

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const { playingId, toggle } = useAudioPlayer();

  const filteredPodcasts = SAMPLE_PODCASTS.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto max-w-[428px] px-6 pt-6 pb-24">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <h1 className="font-serif text-4xl leading-10 text-[#111]">
              Discover
            </h1>
            <SearchInput value={search} onChange={setSearch} />
          </div>

          <div className="flex flex-col gap-6">
            {filteredPodcasts.length === 0 ? (
              <p className="font-inter text-sm text-[#666] text-center py-8">
                No podcasts found.
              </p>
            ) : (
              filteredPodcasts.map((podcast) => (
                <PodcastCard
                  key={podcast.id}
                  title={podcast.title}
                  author={podcast.author}
                  description={podcast.description}
                  color={podcast.color}
                  imageUrl={podcast.imageUrl}
                  isPlaying={playingId === podcast.id}
                  onPlay={() => toggle(podcast.id, podcast.audio_url)}
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
