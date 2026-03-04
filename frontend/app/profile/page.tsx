import Image from 'next/image';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';

interface SavedEpisode {
  id: string;
  title: string;
  subtitle: string;
  creator: string;
  duration: string;
  imageUrl?: string;
  color: string;
}

const FAVORITES: SavedEpisode[] = [
  {
    id: '1',
    title: 'GPT-5 and the Future of Reasoning',
    subtitle: 'What chain-of-thought means for devs',
    creator: '@marcus.li',
    duration: '8 min',
    color: '#009689',
    imageUrl: '/covers/gpt5.png',
  },
  {
    id: '2',
    title: 'How the Fed Rate Cut Reshapes Markets',
    subtitle: 'Bonds, stocks, and your wallet',
    creator: '@finance.guru',
    duration: '9 min',
    color: '#432dd7',
    imageUrl: '/covers/ai-strategy.png',
  },
  {
    id: '3',
    title: 'CRISPR 3.0: Editing the Human Genome',
    subtitle: 'The ethics of gene therapy',
    creator: '@biotech.nina',
    duration: '11 min',
    color: '#ff637e',
    imageUrl: '/covers/rust-vs-go.png',
  },
  {
    id: '4',
    title: 'Mars Colony: SpaceX 2026 Update',
    subtitle: 'Starship, life support, and timelines',
    creator: '@space.kate',
    duration: '13 min',
    color: '#155dfc',
    imageUrl: '/covers/vision-pro.png',
  },
];

const LISTEN_LATER: SavedEpisode[] = [
  {
    id: '5',
    title: 'Why Every Startup Needs an AI Strategy',
    subtitle: 'From YC to indie hackers',
    creator: '@jenny.w',
    duration: '12 min',
    color: '#f54900',
    imageUrl: '/covers/claude-coding.png',
  },
  {
    id: '6',
    title: 'The Science of Sleep & Productivity',
    subtitle: 'Optimize your deep work hours',
    creator: '@sarah.k',
    duration: '10 min',
    color: '#432dd7',
    imageUrl: '/covers/death-podcasts.png',
  },
  {
    id: '7',
    title: 'Quantum Computing Explained Simply',
    subtitle: 'Qubits, entanglement, and you',
    creator: '@physics.dan',
    duration: '9 min',
    color: '#009689',
    imageUrl: '/covers/quantum.png',
  },
];

function EpisodeRow({ title, subtitle, creator, duration, imageUrl, color }: Omit<SavedEpisode, 'id'>) {
  return (
    <div className="flex gap-4 items-start border-b border-border-warm pb-4">
      <div
        className="relative size-20 shrink-0 rounded-[10px] overflow-hidden"
        style={{ backgroundColor: color }}
      >
        {imageUrl && (
          <Image src={imageUrl} alt={title} fill className="object-cover opacity-80" />
        )}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <h3 className="font-serif font-bold text-[16px] leading-5 text-[#111] line-clamp-2">{title}</h3>
        <p className="font-serif text-[12px] leading-4 text-[rgba(17,17,17,0.7)] mt-1 line-clamp-1">{subtitle}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-inter text-[12px] text-[#666]">{creator}</span>
          <span className="text-[#666]">·</span>
          <span className="font-inter text-[12px] text-[#666]">{duration}</span>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto w-full max-w-[428px] px-6 pt-6 pb-24">
        {/* Header — same pattern as Explore/Shows */}
        <div className="flex items-start justify-between mb-8">
          <h1 className="font-serif text-[36px] leading-10 text-[#111]">
            Profile
          </h1>
          <Link href="/settings" aria-label="Settings" className="p-1 mt-2 text-[#111]">
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
        <div className="flex items-center gap-4 mb-10">
          <div className="relative size-16 shrink-0 rounded-full border-2 border-[rgba(17,17,17,0.1)] shadow-sm overflow-hidden bg-[#e0e0d8]">
            <Image src="/covers/avatar.png" alt="Alex Chen" fill className="object-cover" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-[20px] leading-6 text-[#111]">Alex Chen</h2>
            <p className="font-serif text-[14px] leading-5 text-[#666]">@alex.chen</p>
          </div>
        </div>

        {/* Favorites */}
        <section className="mb-10">
          <h2 className="font-serif font-bold text-[14px] text-black/60 tracking-[1.4px] uppercase mb-4">
            Favorites
          </h2>
          <div className="flex flex-col gap-4">
            {FAVORITES.map((ep) => (
              <EpisodeRow key={ep.id} {...ep} />
            ))}
          </div>
        </section>

        {/* Listen Later */}
        <section>
          <h2 className="font-serif font-bold text-[14px] text-black/60 tracking-[1.4px] uppercase mb-4">
            Listen Later
          </h2>
          <div className="flex flex-col gap-4">
            {LISTEN_LATER.map((ep) => (
              <EpisodeRow key={ep.id} {...ep} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
