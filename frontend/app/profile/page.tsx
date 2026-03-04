import Image from 'next/image';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';

interface FavoriteEpisode {
  id: string;
  show: string;
  episode: string;
  podcastName: string;
  duration: string;
  imageUrl?: string;
  imageColor: string;
}

const FAVORITES: FavoriteEpisode[] = [
  {
    id: '1',
    show: 'Design Matters with Debbie Millman',
    episode: 'Marina Willer: The Art of Identity',
    podcastName: 'Design Matters',
    duration: '45 min',
    imageColor: '#009689',
  },
  {
    id: '2',
    show: 'The Daily',
    episode: 'Understanding the Shift',
    podcastName: 'The Daily',
    duration: '28 min',
    imageColor: '#432dd7',
  },
  {
    id: '3',
    show: 'The Ezra Klein Show',
    episode: 'How AI Changes Work',
    podcastName: 'Ezra Klein',
    duration: '62 min',
    imageColor: '#ff637e',
  },
  {
    id: '4',
    show: 'HBR IdeaCast',
    episode: 'Leading Through Change',
    podcastName: 'HBR IdeaCast',
    duration: '35 min',
    imageColor: '#155dfc',
  },
];

const LISTEN_LATER: FavoriteEpisode[] = [
  {
    id: '5',
    show: 'Design Matters with Debbie Millman',
    episode: 'Marina Willer: The Art of Identity',
    podcastName: 'Design Matters',
    duration: '45 min',
    imageColor: '#009689',
  },
  {
    id: '6',
    show: 'The Daily',
    episode: 'Understanding the Shift',
    podcastName: 'The Daily',
    duration: '28 min',
    imageColor: '#432dd7',
  },
  {
    id: '7',
    show: 'The Ezra Klein Show',
    episode: 'How AI Changes Work',
    podcastName: 'Ezra Klein',
    duration: '62 min',
    imageColor: '#ff637e',
  },
];

function EpisodeCard({ show, episode, podcastName, duration, imageUrl, imageColor }: Omit<FavoriteEpisode, 'id'>) {
  return (
    <div className="flex gap-3 items-start border border-[#e0e0d8] rounded-[10px] p-[13px]">
      <div
        className="relative size-12 shrink-0 rounded-[4px] overflow-hidden"
        style={{ backgroundColor: imageColor }}
      >
        {imageUrl && (
          <Image src={imageUrl} alt={show} fill className="object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-serif font-bold text-[12px] leading-[15px] text-[#111] truncate">{show}</h4>
        <p className="font-serif text-[10px] leading-[13px] text-[rgba(17,17,17,0.8)] mt-1 truncate">{episode}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-inter text-[9px] text-[#666]">{podcastName}</span>
          <span className="font-inter text-[9px] text-[#666]">{duration}</span>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto w-full max-w-[428px] pb-24">
        {/* Settings button */}
        <div className="flex justify-end px-6 pt-4">
          <Link href="/settings" aria-label="Settings" className="p-2 text-[#111]">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path
                d="M11 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.2 13.8a1.5 1.5 0 0 0 .3 1.7l.05.05a1.8 1.8 0 0 1-2.54 2.54l-.05-.05a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.91 1.38V19a1.8 1.8 0 0 1-3.6 0v-.07A1.5 1.5 0 0 0 8.8 17.5a1.5 1.5 0 0 0-1.7.3l-.05.05a1.8 1.8 0 1 1-2.54-2.54l.05-.05a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.38-.91H3a1.8 1.8 0 0 1 0-3.6h.07A1.5 1.5 0 0 0 4.5 8.8a1.5 1.5 0 0 0-.3-1.7l-.05-.05a1.8 1.8 0 1 1 2.54-2.54l.05.05a1.5 1.5 0 0 0 1.7.3h.07A1.5 1.5 0 0 0 9.42 3.5V3a1.8 1.8 0 0 1 3.6 0v.07a1.5 1.5 0 0 0 .91 1.38 1.5 1.5 0 0 0 1.7-.3l.05-.05a1.8 1.8 0 1 1 2.54 2.54l-.05.05a1.5 1.5 0 0 0-.3 1.7v.07a1.5 1.5 0 0 0 1.38.91H19a1.8 1.8 0 0 1 0 3.6h-.07a1.5 1.5 0 0 0-1.38.91Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-4 px-6 mt-2 mb-8">
          <div className="size-24 rounded-full border-2 border-[rgba(17,17,17,0.1)] shadow-sm overflow-hidden bg-[#e0e0d8]" />
          <div className="flex flex-col items-center gap-0">
            <h2 className="font-serif font-bold text-[24px] leading-8 text-[#111]">Eleanor Davies</h2>
            <p className="font-serif text-[16px] leading-6 text-[#666]">@eleanor.d</p>
          </div>
        </div>

        <div className="px-6 flex flex-col gap-8">
          {/* Favorites */}
          <section>
            <h3 className="font-serif font-bold text-[10px] text-[rgba(17,17,17,0.8)] tracking-[2px] uppercase mb-4">
              Favorites
            </h3>
            <div className="flex flex-col gap-4">
              {FAVORITES.map((ep) => (
                <EpisodeCard key={ep.id} {...ep} />
              ))}
            </div>
          </section>

          {/* Listen Later */}
          <section>
            <h3 className="font-serif font-bold text-[10px] text-[rgba(17,17,17,0.8)] tracking-[2px] uppercase mb-4">
              Listen Later
            </h3>
            <div className="flex flex-col gap-4">
              {LISTEN_LATER.map((ep) => (
                <EpisodeCard key={ep.id} {...ep} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
