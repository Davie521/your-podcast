'use client';

import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { EpisodeRow } from '@/components/EpisodeRow';
import { useAudioState } from '@/hooks/useAudioState';
import { useAudioDispatch } from '@/hooks/useAudioDispatch';
import { getRecentEpisodes } from '@/data/episodes';

const RECENT_EPISODES = getRecentEpisodes();

export default function ShowsPage() {
  const { currentEpisode, isPlaying } = useAudioState();
  const { toggle, play } = useAudioDispatch();
  const router = useRouter();

  const hasPlayer = currentEpisode !== null;

  return (
    <div className="min-h-screen bg-cream">
      <main className={`mx-auto w-full max-w-[428px] px-6 pt-6 ${hasPlayer ? 'pb-36' : 'pb-24'}`}>
        {/* Header */}
        <div className="flex flex-col gap-3 mb-10">
          <h1 className="font-serif text-4xl leading-10 text-[#111]">My Shows</h1>
          <p className="font-serif italic text-[14px] text-[#666] leading-5 opacity-70">
            Your saved AI-generated podcasts
          </p>
        </div>

        {/* Recent */}
        <section>
          <h2 className="font-serif font-bold text-[14px] text-black/60 tracking-[1.4px] uppercase mb-4">
            Recent
          </h2>
          <div className="flex flex-col gap-4">
            {RECENT_EPISODES.map((ep) => (
              <EpisodeRow
                key={ep.id}
                title={ep.title}
                subtitle={ep.subtitle}
                creator={ep.creator}
                duration={ep.duration}
                imageUrl={ep.imageUrl}
                color={ep.color}
                isPlaying={currentEpisode?.id === ep.id && isPlaying}
                onPlay={() => toggle(ep)}
                onTap={() => {
                  play(ep);
                  router.push(`/episode/${ep.id}`);
                }}
              />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
