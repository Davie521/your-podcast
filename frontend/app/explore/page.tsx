'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/SearchInput';
import { EpisodeRow } from '@/components/EpisodeRow';
import { BottomNav } from '@/components/BottomNav';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { Episode } from '@/types/podcast';

const DISCOVER_EPISODES: Episode[] = [
  {
    id: 'disc-1',
    title: 'Rust vs Go in 2026: The Definitive Take',
    subtitle: 'Rust / Go / Performance',
    creator: '@dev.alex',
    duration: '9 min',
    color: '#f54900',
    imageUrl: '/covers/rust-vs-go.png',
  },
  {
    id: 'disc-2',
    title: 'Quantum Computing Explained Simply',
    subtitle: 'Quantum / Qubits / Google',
    creator: '@physics.dan',
    duration: '11 min',
    color: '#009689',
    imageUrl: '/covers/quantum.png',
  },
  {
    id: 'disc-3',
    title: 'Claude Code and the AI Coding Revolution',
    subtitle: 'AI / Coding / Agents',
    creator: '@techie.sam',
    duration: '14 min',
    color: '#432dd7',
    imageUrl: '/covers/claude-coding.png',
  },
  {
    id: 'disc-4',
    title: 'Are Podcasts Dying or Evolving?',
    subtitle: 'Media / Audio / Trends',
    creator: '@media.jan',
    duration: '8 min',
    color: '#155dfc',
    imageUrl: '/covers/death-podcasts.png',
  },
  {
    id: 'disc-5',
    title: 'The Science of Sleep & Productivity',
    subtitle: 'Sleep / Focus / Deep Work',
    creator: '@sarah.k',
    duration: '10 min',
    color: '#ff637e',
    imageUrl: '/covers/sleep-science.png',
  },
];

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const { playingId, toggle } = useAudioPlayer();

  const filtered = DISCOVER_EPISODES.filter(
    (ep) =>
      ep.title.toLowerCase().includes(search.toLowerCase()) ||
      ep.creator.toLowerCase().includes(search.toLowerCase())
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

          <div className="flex flex-col gap-4">
            {filtered.length === 0 ? (
              <p className="font-inter text-sm text-[#666] text-center py-8">
                No podcasts found.
              </p>
            ) : (
              filtered.map((ep) => (
                <EpisodeRow
                  key={ep.id}
                  title={ep.title}
                  subtitle={ep.subtitle}
                  creator={ep.creator}
                  duration={ep.duration}
                  color={ep.color}
                  imageUrl={ep.imageUrl}
                  isPlaying={playingId === ep.id}
                  onPlay={() => toggle(ep.id)}
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
