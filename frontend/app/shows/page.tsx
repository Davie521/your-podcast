'use client';

import Image from 'next/image';
import { BottomNav } from '@/components/BottomNav';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { PauseIcon } from '@/components/icons/PauseIcon';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface Recommendation {
  id: string;
  title: string;
  episode: string;
  color: string;
  imageUrl?: string;
  progress: number;
}

interface RecentEpisode {
  id: string;
  title: string;
  show: string;
  duration: string;
  ago: string;
}

interface Subscription {
  id: string;
  title: string;
  color: string;
  imageUrl?: string;
}

const RECOMMENDATIONS: Recommendation[] = [
  { id: 'rec-1', title: 'GPT-5 and the Future of Reasoning', episode: 'by @marcus.li · 8 min', color: '#009689', imageUrl: '/covers/gpt5.png', progress: 100 },
  { id: 'rec-2', title: 'Mars Colony: SpaceX 2026 Update', episode: 'by @space.kate · 13 min', color: '#432dd7', imageUrl: '/covers/vision-pro.png', progress: 30 },
  { id: 'rec-3', title: 'The Psychology of Spending', episode: 'by @finance.guru · 9 min', color: '#f54900', imageUrl: '/covers/react-deep.png', progress: 85 },
];

const RECENT_EPISODES: RecentEpisode[] = [
  { id: 'recent-1', title: 'Rust vs Go in 2026', show: '@dev.alex', duration: '6 min', ago: '2h ago' },
  { id: 'recent-2', title: 'Inside Y Combinator W26 Batch', show: '@startup.daily', duration: '10 min', ago: '5h ago' },
  { id: 'recent-3', title: 'CRISPR 3.0: Editing the Human Genome', show: '@biotech.nina', duration: '11 min', ago: '1 day ago' },
];

const SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub-1', title: 'AI', color: '#009689', imageUrl: '/covers/topic-tech.png' },
  { id: 'sub-2', title: 'Startups', color: '#432dd7', imageUrl: '/covers/topic-startups.png' },
  { id: 'sub-3', title: 'Science', color: '#f54900', imageUrl: '/covers/topic-science.png' },
  { id: 'sub-4', title: 'Programming', color: '#155dfc', imageUrl: '/covers/topic-programming.png' },
  { id: 'sub-5', title: 'Business', color: '#ff637e', imageUrl: '/covers/topic-business.png' },
  { id: 'sub-6', title: 'Space', color: '#f59e0b', imageUrl: '/covers/topic-webdev.png' },
];

export default function ShowsPage() {
  const { playingId, toggle } = useAudioPlayer();

  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto w-full max-w-[428px] px-6 pt-6 pb-24">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-10">
          <h1 className="font-serif text-[36px] leading-10 text-[#111]">My Shows</h1>
          <p className="font-serif italic text-[14px] text-[#666] leading-5 opacity-70">
            Your saved AI-generated podcasts
          </p>
        </div>

        {/* Picked For You */}
        <section className="mb-10">
          <h2 className="font-serif font-bold text-[14px] text-black/60 tracking-[1.4px] uppercase mb-4">
            Picked For You
          </h2>
          <div className="flex flex-col gap-4">
            {RECOMMENDATIONS.map(({ id, title, episode, color, imageUrl, progress }) => {
              const isPlaying = playingId === id;
              const Icon = isPlaying ? PauseIcon : PlayIcon;
              return (
                <div key={id} className="flex gap-6 items-start">
                  <div
                    className="relative size-20 shrink-0 rounded-[10px] overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    {imageUrl && (
                      <Image src={imageUrl} alt={title} fill className="object-cover opacity-80" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-3 relative">
                    <h3 className="font-serif font-bold text-[16px] leading-5 text-[#111]">{title}</h3>
                    <p className="font-serif text-[12px] leading-4 text-[rgba(17,17,17,0.7)] mt-1">{episode}</p>
                    <div className="mt-4 bg-[#f0f0eb] rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-black h-full rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
                      className="absolute right-0 top-3 size-8 rounded-full bg-[#111] shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center pl-0.5"
                    >
                      <Icon className="size-3.5 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Episodes */}
        <section className="mb-10">
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
                    <span>•</span>
                    <span className="font-inter flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
                        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                        <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                      {duration}
                    </span>
                    <span>•</span>
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

        {/* Topics You Follow */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-bold text-[14px] text-black/60 tracking-[1.4px] uppercase">
              Topics You Follow
            </h2>
            <span className="font-inter text-[12px] text-[#666]">{SUBSCRIPTIONS.length} topics</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {SUBSCRIPTIONS.map(({ id, title, color, imageUrl }) => (
              <div key={id} className="flex flex-col gap-2">
                <div
                  className="relative aspect-square rounded-[10px] overflow-hidden"
                  style={{ backgroundColor: color }}
                >
                  {imageUrl && (
                    <Image src={imageUrl} alt={title} fill className="object-cover opacity-80" />
                  )}
                </div>
                <p className="font-serif text-[12px] leading-[15px] text-[#111] line-clamp-2">{title}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
