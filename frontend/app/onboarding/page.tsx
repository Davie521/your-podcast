'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const INTERESTS = [
  { id: 'arts', label: 'Arts & Culture', size: 150, top: 0, left: 40 },
  { id: 'lifestyle', label: 'Lifestyle', size: 130, top: 10, left: 214 },
  { id: 'thought', label: 'Thought & Ideas', size: 120, top: 179, left: 55 },
  { id: 'music', label: 'Music', size: 130, top: 174, left: 199 },
  { id: 'business', label: 'Business', size: 120, top: 328, left: 132 },
] as const;

type InterestId = (typeof INTERESTS)[number]['id'];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<Set<InterestId>>(new Set());
  const router = useRouter();

  function toggleInterest(id: InterestId) {
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

  function handleClear() {
    setSelected(new Set());
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top nav */}
      <div className="flex items-center justify-between px-6 h-17">
        <Link
          href="/signup"
          className="flex items-center gap-2"
        >
          <div className="flex items-center justify-center size-9 rounded-full bg-white/50 border border-[#e0e0d8] shadow-sm">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12 15L7 10L12 5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* Content */}
      <div className="flex-1 flex flex-col px-6">
        {/* Heading */}
        <div className="flex flex-col items-center gap-3 pt-6">
          <h1 className="font-serif text-[36px] leading-[45px] text-[#111] text-center">
            What moves you?
          </h1>
          <p className="font-serif italic text-[14px] text-[#666] leading-5 text-center opacity-60">
            Explore the spheres of interest
          </p>
        </div>

        {/* Bubbles */}
        <div className="relative h-[480px] mx-auto w-[384px] mt-6 shrink-0">
          {INTERESTS.map(({ id, label, size, top, left }) => {
            const isSelected = selected.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleInterest(id)}
                style={{ width: size, height: size, top, left }}
                className={`absolute rounded-full border flex flex-col items-center justify-center gap-2 shadow-[0px_10px_15px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)] transition-colors ${
                  isSelected
                    ? 'bg-[#111] border-[#111]'
                    : 'bg-white border-[#e0e0d8]'
                }`}
              >
                <span
                  className={`font-serif text-[14px] leading-[17.5px] text-center px-3 ${
                    isSelected ? 'text-white' : 'text-[#111]'
                  }`}
                >
                  {label}
                </span>
                <div
                  className={`h-1 w-4 rounded-full ${
                    isSelected ? 'bg-white/40' : 'bg-[#111]/20'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Selection indicator */}
        {selected.size > 0 && (
          <div className="flex justify-center pt-6">
            <div className="flex items-center gap-4 px-5 py-2 bg-black/5 border border-black/10 rounded-full shadow-sm">
              <span className="font-sans font-bold text-[10px] text-black/60 tracking-[2px] uppercase">
                {selected.size} RESONANCE{selected.size !== 1 ? 'S' : ''} SELECTED
              </span>
              <div className="size-[6px] rounded-full bg-black/20" />
              <button
                type="button"
                onClick={handleClear}
                className="font-sans font-bold text-[10px] text-black/40 tracking-[1px] uppercase"
              >
                CLEAR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-cream/90 border-t border-[#e0e0d8] shadow-[0px_-4px_30px_rgba(0,0,0,0.03)] px-8 pt-8 pb-10">
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
