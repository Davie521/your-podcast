'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
  readonly id: string;
  readonly label: string;
}

interface Group {
  id: string;
  readonly label: string;
  readonly emoji: string;
  readonly categories: ReadonlyArray<Category>;
}

const INITIAL_GROUPS: Group[] = [
  {
    id: 'technology',
    label: 'Technology',
    emoji: '💻',
    categories: [
      { id: 'android', label: 'Android' },
      { id: 'android-dev', label: 'Android Dev' },
      { id: 'apple', label: 'Apple' },
      { id: 'ios-dev', label: 'iOS Development' },
      { id: 'tech', label: 'Tech' },
      { id: 'web-dev', label: 'Web Development' },
      { id: 'programming', label: 'Programming' },
      { id: 'ui-ux', label: 'UI / UX' },
    ],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    emoji: '🎬',
    categories: [
      { id: 'movies', label: 'Movies' },
      { id: 'television', label: 'Television' },
      { id: 'gaming', label: 'Gaming' },
      { id: 'music', label: 'Music' },
      { id: 'funny', label: 'Funny' },
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    emoji: '⚽',
    categories: [
      { id: 'sports', label: 'Sports' },
      { id: 'football', label: 'Football' },
      { id: 'cricket', label: 'Cricket' },
      { id: 'tennis', label: 'Tennis' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    emoji: '📈',
    categories: [
      { id: 'business-economy', label: 'Business & Economy' },
      { id: 'startups', label: 'Startups' },
      { id: 'personal-finance', label: 'Personal Finance' },
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    emoji: '🌿',
    categories: [
      { id: 'beauty', label: 'Beauty' },
      { id: 'fashion', label: 'Fashion' },
      { id: 'food', label: 'Food' },
      { id: 'travel', label: 'Travel' },
      { id: 'diy', label: 'DIY' },
      { id: 'interior-design', label: 'Interior Design' },
      { id: 'cars', label: 'Cars' },
      { id: 'books', label: 'Books' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    emoji: '🔭',
    categories: [
      { id: 'science', label: 'Science' },
      { id: 'space', label: 'Space' },
      { id: 'history', label: 'History' },
      { id: 'architecture', label: 'Architecture' },
      { id: 'photography', label: 'Photography' },
      { id: 'news', label: 'News' },
    ],
  },
  {
    id: 'world',
    label: 'World News',
    emoji: '🌍',
    categories: [
      { id: 'world-au', label: '🇦🇺 Australia' },
      { id: 'world-bd', label: '🇧🇩 Bangladesh' },
      { id: 'world-br', label: '🇧🇷 Brazil' },
      { id: 'world-ca', label: '🇨🇦 Canada' },
      { id: 'world-de', label: '🇩🇪 Germany' },
      { id: 'world-es', label: '🇪🇸 Spain' },
      { id: 'world-fr', label: '🇫🇷 France' },
      { id: 'world-gb', label: '🇬🇧 United Kingdom' },
      { id: 'world-hk', label: '🇭🇰 Hong Kong' },
      { id: 'world-id', label: '🇮🇩 Indonesia' },
      { id: 'world-ie', label: '🇮🇪 Ireland' },
      { id: 'world-in', label: '🇮🇳 India' },
      { id: 'world-ir', label: '🇮🇷 Iran' },
      { id: 'world-it', label: '🇮🇹 Italy' },
      { id: 'world-jp', label: '🇯🇵 Japan' },
      { id: 'world-mm', label: '🇲🇲 Myanmar' },
      { id: 'world-mx', label: '🇲🇽 Mexico' },
      { id: 'world-ng', label: '🇳🇬 Nigeria' },
      { id: 'world-ph', label: '🇵🇭 Philippines' },
      { id: 'world-pk', label: '🇵🇰 Pakistan' },
      { id: 'world-pl', label: '🇵🇱 Poland' },
      { id: 'world-ru', label: '🇷🇺 Russia' },
      { id: 'world-ua', label: '🇺🇦 Ukraine' },
      { id: 'world-us', label: '🇺🇸 United States' },
      { id: 'world-za', label: '🇿🇦 South Africa' },
    ],
  },
];

interface GroupCardProps {
  group: Group;
  index: number;
  isExpanded: boolean;
  selected: ReadonlySet<string>;
  isDragging: boolean;
  isDragOver: boolean;
  onToggleExpand: (id: string) => void;
  onToggleCategory: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

function GroupCard({
  group,
  index,
  isExpanded,
  selected,
  isDragging,
  isDragOver,
  onToggleExpand,
  onToggleCategory,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: GroupCardProps) {
  const selectedCount = group.categories.filter((c) => selected.has(c.id)).length;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-[0.97]' : 'opacity-100'
      } ${
        isDragOver
          ? 'border-black shadow-[0_0_0_2px_rgba(0,0,0,0.08)] bg-black/[0.02]'
          : 'border-[#e0e0d8] bg-white shadow-sm'
      }`}
    >
      {/* Group header */}
      <button
        type="button"
        onClick={() => onToggleExpand(group.id)}
        className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer"
      >
        <span
          className="text-[#c8c8c0] select-none font-mono leading-none text-[16px] cursor-grab active:cursor-grabbing"
          aria-hidden="true"
        >
          ⠿
        </span>
        <span className="text-[22px] leading-none select-none">{group.emoji}</span>
        <div className="flex-1 text-left">
          <span className="font-serif text-[16px] text-[#111]">{group.label}</span>
          {selectedCount > 0 && (
            <span className="ml-2 font-sans text-[10px] text-black/40 tracking-[1px] uppercase">
              {selectedCount}/{group.categories.length}
            </span>
          )}
        </div>
        {selectedCount === 0 && (
          <span className="font-sans text-[11px] text-[#bbb]">
            {group.categories.length}
          </span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="#999"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Category bubbles */}
      {isExpanded && (
        <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1 border-t border-[#f0f0e8]">
          {group.categories.map((cat) => {
            const isSelected = selected.has(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onToggleCategory(cat.id)}
                className={`rounded-full px-3.5 py-1.5 border text-[13px] font-sans font-medium transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? 'bg-[#111] border-[#111] text-white shadow-sm'
                    : 'bg-white border-[#e0e0d8] text-[#333] hover:border-[#999]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['technology']));
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = searchParams.get('back') ?? '/signup';

  function toggleCategory(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      return;
    }
    const next = [...groups];
    const [dragged] = next.splice(dragIndex, 1);
    next.splice(index, 0, dragged);
    setGroups(next);
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top nav */}
      <div className="flex items-center justify-between px-6 h-17 shrink-0">
        <Link href={backHref} className="flex items-center gap-2">
          <div className="flex items-center justify-center size-9 rounded-full bg-white/50 border border-[#e0e0d8] shadow-sm">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M12 15L7 10L12 5"
                stroke="#111"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-sans font-bold text-[10px] text-[rgba(17,17,17,0.6)] tracking-[1px] uppercase">
            Exit
          </span>
        </Link>

        <div className="flex flex-col items-center gap-1">
          <span className="font-sans font-bold text-[10px] text-[rgba(0,0,0,0.5)] tracking-[3px] uppercase">
            VOX CURATION
          </span>
          <div className="flex gap-1">
            <div className="size-[6px] rounded-full bg-black" />
            <div className="size-[6px] rounded-full bg-black/20" />
            <div className="size-[6px] rounded-full bg-black/20" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/explore')}
          className="font-sans font-bold text-[10px] text-[rgba(17,17,17,0.4)] tracking-[1px] uppercase"
        >
          Skip
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col items-center gap-2 pt-6 pb-6">
          <h1 className="font-serif text-[36px] leading-[45px] text-[#111] text-center">
            What moves you?
          </h1>
          <p className="font-serif italic text-[14px] text-[#666] leading-5 text-center opacity-60">
            Drag to reorder · tap to expand · select your interests
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {groups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              index={index}
              isExpanded={expanded.has(group.id)}
              selected={selected}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index && dragIndex !== index}
              onToggleExpand={toggleExpand}
              onToggleCategory={toggleCategory}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="shrink-0 bg-cream/90 border-t border-[#e0e0d8] shadow-[0px_-4px_30px_rgba(0,0,0,0.03)] px-8 pt-6 pb-10">
        {selected.size > 0 && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-4 px-5 py-2 bg-black/5 border border-black/10 rounded-full shadow-sm">
              <span className="font-sans font-bold text-[10px] text-black/60 tracking-[2px] uppercase">
                {selected.size} RESONANCE{selected.size !== 1 ? 'S' : ''} SELECTED
              </span>
              <div className="size-[6px] rounded-full bg-black/20" />
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="font-sans font-bold text-[10px] text-black/40 tracking-[1px] uppercase"
              >
                CLEAR
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => router.push('/explore')}
          className="w-full h-14 bg-black rounded-full shadow-[0px_25px_50px_rgba(0,0,0,0.2)] font-sans font-bold text-[10px] text-white tracking-[2.5px] uppercase"
        >
          ENTER VOX
        </button>
      </div>
    </div>
  );
}
