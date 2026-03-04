'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { EpisodeRow } from '@/components/EpisodeRow';
import { SettingsIcon } from '@/components/icons/SettingsIcon';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { Episode } from '@/types/podcast';

interface RecentEpisode {
  id: string;
  title: string;
  show: string;
  duration: string;
  ago: string;
}

const FAVORITES: Episode[] = [
  {
    id: 'fav-1',
    title: 'GPT-5 and the Future of Reasoning',
    subtitle: 'What chain-of-thought means for devs',
    creator: '@marcus.li',
    duration: '8 min',
    color: '#009689',
    imageUrl: '/covers/gpt5.png',
  },
  {
    id: 'fav-2',
    title: 'Why Every Startup Needs an AI Strategy',
    subtitle: 'From YC to indie hackers',
    creator: '@jenny.w',
    duration: '12 min',
    color: '#432dd7',
    imageUrl: '/covers/ai-strategy.png',
  },
  {
    id: 'fav-3',
    title: 'Mars Colony: SpaceX 2026 Update',
    subtitle: 'Starship, life support, and timelines',
    creator: '@space.kate',
    duration: '13 min',
    color: '#155dfc',
    imageUrl: '/covers/vision-pro.png',
  },
  {
    id: 'fav-4',
    title: 'Inside the Vision Pro Developer Kit',
    subtitle: 'Hands-on with spatial computing',
    creator: '@vr.mike',
    duration: '10 min',
    color: '#f54900',
    imageUrl: '/covers/react-deep.png',
  },
];

const RECENT_EPISODES: RecentEpisode[] = [
  { id: 'recent-1', title: 'How the Fed Rate Cut Reshapes Markets', show: '@finance.guru', duration: '9 min', ago: '2h ago' },
  { id: 'recent-2', title: 'CRISPR 3.0: Editing the Human Genome', show: '@biotech.nina', duration: '11 min', ago: '5h ago' },
  { id: 'recent-3', title: 'Inside Y Combinator W26 Batch', show: '@startup.daily', duration: '10 min', ago: '1 day ago' },
];

export default function ShowsPage() {
  const { playingId, toggle } = useAudioPlayer();

  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto w-full max-w-[428px] px-6 pt-6 pb-24">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-10">
          <div className="flex items-start justify-between">
            <h1 className="font-serif text-4xl leading-10 text-[#111]">My Shows</h1>
            <Link href="/settings" aria-label="Settings" className="p-1 mt-2 text-[#111]">
              <SettingsIcon />
            </Link>
          </div>
          <p className="font-serif italic text-[14px] text-[#666] leading-5 opacity-70">
            Your saved AI-generated podcasts
          </p>
        </div>

        {/* Favorites */}
        <section className="mb-10">
          <h2 className="font-serif font-bold text-[14px] text-black/60 tracking-[1.4px] uppercase mb-4">
            Favorites
          </h2>
          <div className="flex flex-col gap-4">
            {FAVORITES.map((ep) => (
              <EpisodeRow
                key={ep.id}
                title={ep.title}
                subtitle={ep.subtitle}
                creator={ep.creator}
                duration={ep.duration}
                imageUrl={ep.imageUrl}
                color={ep.color}
                isPlaying={playingId === ep.id}
                onPlay={() => toggle(ep.id)}
              />
            ))}
          </div>
        </section>

        {/* Recent Episodes */}
        <section>
          <h2 className="font-serif font-bold text-[14px] text-black/60 tracking-[1.4px] uppercase mb-4">
            Recent Episodes
          </h2>
          <div className="flex flex-col">
            {RECENT_EPISODES.map(({ id, title, show, duration, ago }, index) => (
              <div
                key={id}
                className={`flex items-center justify-between py-4 ${
                  index < RECENT_EPISODES.length - 1 ? 'border-b border-[#e0e0d8]' : ''
                }`}
              >
                <div className="flex flex-col gap-1">
                  <h4 className="font-serif text-[16px] leading-6 text-[#111]">{title}</h4>
                  <div className="flex items-center gap-2 text-[#666] text-[12px]">
                    <span className="font-serif">{show}</span>
                    <span>&middot;</span>
                    <span className="font-inter flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
                        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                        <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                      {duration}
                    </span>
                    <span>&middot;</span>
                    <span className="font-inter">{ago}</span>
                  </div>
                </div>
                <button type="button" aria-label="Download episode" className="shrink-0 ml-4 text-[#666]">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M9 2.5V12.5M9 12.5L5.5 9M9 12.5L12.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.5 14.5H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
