'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, request } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAuthDispatch } from '@/hooks/useAuthDispatch';
import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon';
import { StepDots } from '@/components/StepDots';
import { InterestBubble } from '@/components/InterestBubble';
import type { CategoriesResponse, InterestsResponse } from '@/types/onboarding';

type BubbleLayout = { size: number; left: number; top: number };

const BUBBLE_LAYOUT: Record<string, BubbleLayout> = {
  'Arts & Culture': { size: 150, left: 40, top: 0 },
  Lifestyle: { size: 130, left: 214, top: 10 },
  'Thought & Ideas': { size: 120, left: 55, top: 179 },
  Music: { size: 130, left: 199, top: 174 },
  Business: { size: 120, left: 132, top: 328 },
};

const BUBBLE_CANVAS_WIDTH = 384;
const BUBBLE_CANVAS_HEIGHT = 448;
const BUBBLE_PADDING = 16;
const MIN_BUBBLE_SIZE = 92;
const MAX_BUBBLE_SIZE = 118;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getFallbackLayout(index: number, total: number): BubbleLayout {
  const safeTotal = Math.max(1, total);
  const cols = safeTotal <= 4 ? 2 : safeTotal <= 9 ? 3 : 4;
  const rows = Math.ceil(safeTotal / cols);

  const sizeFromGrid = Math.min(
    MAX_BUBBLE_SIZE,
    (BUBBLE_CANVAS_WIDTH - BUBBLE_PADDING * 2) / cols - 8,
    (BUBBLE_CANVAS_HEIGHT - BUBBLE_PADDING * 2) / rows - 8,
  );
  const size = Math.max(MIN_BUBBLE_SIZE, Math.floor(sizeFromGrid));

  const cellWidth = (BUBBLE_CANVAS_WIDTH - BUBBLE_PADDING * 2) / cols;
  const cellHeight = (BUBBLE_CANVAS_HEIGHT - BUBBLE_PADDING * 2) / rows;
  const row = Math.floor(index / cols);
  const col = index % cols;

  const left = BUBBLE_PADDING + col * cellWidth + (cellWidth - size) / 2;
  const top = BUBBLE_PADDING + row * cellHeight + (cellHeight - size) / 2;

  return {
    size,
    left: clamp(left, 0, BUBBLE_CANVAS_WIDTH - size),
    top: clamp(top, 0, BUBBLE_CANVAS_HEIGHT - size),
  };
}

export default function InterestsPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { refreshUser } = useAuthDispatch();
  const [categories, setCategories] = useState<readonly string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fallbackIndexByCategory = useMemo(() => {
    const unknown = categories.filter(
      (cat) => !Object.prototype.hasOwnProperty.call(BUBBLE_LAYOUT, cat),
    );
    return new Map(unknown.map((cat, index) => [cat, index]));
  }, [categories]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const controller = new AbortController();
    request<CategoriesResponse>('/api/onboarding/categories', {
      signal: controller.signal,
    })
      .then((data) => setCategories(data.categories))
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('Failed to load categories');
        }
      });
    return () => controller.abort();
  }, [status]);

  function toggle(category: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  async function handleSubmit() {
    if (isSubmitting || selected.size === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await request<InterestsResponse>('/api/onboarding/interests', {
        method: 'POST',
        body: JSON.stringify({ interests: [...selected] }),
      });
      await refreshUser();
      router.push('/explore');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Please sign in to save your interests');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status !== 'authenticated') return null;

  return (
    <div className="min-h-dvh bg-cream flex flex-col max-w-[428px] mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between h-[68px] px-6 shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 h-9 pl-1.5 pr-3 bg-white/50 border border-border-warm shadow-sm rounded-full"
        >
          <ChevronLeftIcon className="size-5 text-[#111]/60" />
          <span className="font-inter font-bold text-[10px] tracking-[1px] text-[#111]/60 uppercase">
            Exit
          </span>
        </button>

        <div className="flex flex-col items-center gap-1">
          <span className="font-inter font-bold text-[10px] tracking-[3px] text-black/50 uppercase">
            Your Podcast
          </span>
          <StepDots currentStep={0} totalSteps={3} />
        </div>

        <button
          type="button"
          onClick={() => router.push('/explore')}
          className="font-inter font-bold text-[10px] tracking-[1px] text-[#111]/40 uppercase"
        >
          Skip
        </button>
      </header>

      {/* Title */}
      <div className="px-6 mt-4 flex flex-col gap-3">
        <h1 className="font-serif text-4xl leading-[45px] text-[#111]">
          What moves you?
        </h1>
        <p className="font-serif italic text-sm leading-5 text-[#666] opacity-60">
          Explore the spheres of interest
        </p>
      </div>

      {/* Bubbles */}
      <div className="relative w-full max-w-[384px] h-[448px] mx-auto mt-6">
        {categories.map((cat) => {
          const layout =
            BUBBLE_LAYOUT[cat] ??
            getFallbackLayout(
              fallbackIndexByCategory.get(cat) ?? 0,
              fallbackIndexByCategory.size,
            );
          return (
            <div
              key={cat}
              className="absolute"
              style={{ left: layout.left, top: layout.top }}
            >
              <InterestBubble
                label={cat}
                size={layout.size}
                isSelected={selected.has(cat)}
                onToggle={() => toggle(cat)}
              />
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Counter */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-4 px-[21px] h-[37px] bg-black/5 border border-black/10 rounded-full shadow-sm">
          <span className="font-inter font-bold text-[10px] tracking-[2px] text-black/60 uppercase">
            {selected.size} resonances selected
          </span>
          <div className="bg-black/20 size-1.5 rounded-full" />
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="font-inter font-bold text-[10px] text-black/40 uppercase"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-center text-sm text-red-600 mb-2 px-8">{error}</p>
      )}

      {/* Bottom CTA */}
      <div className="h-[129px] bg-[rgba(253,253,245,0.9)] border-t border-border-warm shadow-[0px_-4px_30px_rgba(0,0,0,0.03)] pt-[33px] px-8 shrink-0">
        <button
          type="button"
          disabled={isSubmitting || selected.size === 0}
          onClick={handleSubmit}
          className="bg-black rounded-full h-16 w-full shadow-[0px_25px_50px_rgba(0,0,0,0.2)] flex items-center justify-center disabled:opacity-50"
        >
          <span className="font-inter font-bold text-[10px] tracking-[2.5px] text-white uppercase">
            Continue
          </span>
        </button>
      </div>
    </div>
  );
}
