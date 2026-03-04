'use client';

import { useState } from 'react';
import { PodcastCard } from '@/components/PodcastCard';
import { SearchInput } from '@/components/SearchInput';
import { BottomNav } from '@/components/BottomNav';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { Podcast } from '@/types/podcast';

const SAMPLE_PODCASTS: Podcast[] = [
  {
    id: '1',
    title: 'GPT-5 and the Future of Reasoning',
    author: '@marcus.li / 8 min',
    description: 'A deep dive into OpenAI\'s latest model and what chain-of-thought reasoning means for developers.',
    color: '#009689',
    imageUrl: '/covers/gpt5.png',
  },
  {
    id: '2',
    title: 'Why Every Startup Needs an AI Strategy',
    author: '@jenny.w / 12 min',
    description: 'From YC\'s latest batch to bootstrapped indie hackers — how AI is reshaping the startup playbook.',
    color: '#432dd7',
    imageUrl: '/covers/ai-strategy.png',
  },
  {
    id: '3',
    title: 'The Science of Sleep & Productivity',
    author: '@sarah.k / 10 min',
    description: 'Latest neuroscience research on sleep cycles and how to optimize your deep work hours.',
    color: '#f54900',
    imageUrl: '/covers/sleep-science.png',
  },
  {
    id: '4',
    title: 'How the Fed Rate Cut Reshapes Markets',
    author: '@finance.guru / 9 min',
    description: 'Two AI hosts break down the latest Fed decision and what it means for your portfolio and the global economy.',
    color: '#155dfc',
    imageUrl: '/covers/react-deep.png',
  },
  {
    id: '5',
    title: 'CRISPR 3.0: Editing the Human Genome',
    author: '@biotech.nina / 11 min',
    description: 'From lab breakthroughs to ethical debates — the next frontier of gene editing explained simply.',
    color: '#ff637e',
    imageUrl: '/covers/topic-science.png',
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
      <main className="mx-auto w-full max-w-[428px] px-6 pt-6 pb-24">
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
                  onPlay={() => toggle(podcast.id, podcast.audioUrl)}
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
