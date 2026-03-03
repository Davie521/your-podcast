"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { request } from "@/lib/api";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { StepDots } from "@/components/StepDots";
import { InterestBubble } from "@/components/InterestBubble";
import type { CategoriesResponse } from "@/types/onboarding";

const BUBBLE_LAYOUT: Record<string, { size: number; left: number; top: number }> = {
  "Arts & Culture": { size: 150, left: 40, top: 0 },
  Lifestyle: { size: 130, left: 214, top: 10 },
  "Thought & Ideas": { size: 120, left: 55, top: 179 },
  Music: { size: 130, left: 199, top: 174 },
  Business: { size: 120, left: 132, top: 328 },
};

const DEFAULT_LAYOUT = { size: 110, left: 140, top: 250 };

export default function InterestsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<readonly string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<CategoriesResponse>("/api/onboarding/categories").catch(() => {
      setError("Failed to load categories");
    }).then((data) => {
      if (data) setCategories(data.categories);
    });
  }, []);

  function toggle(category: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  async function handleSubmit() {
    if (submitting || selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await request("/api/onboarding/interests", {
        method: "POST",
        body: JSON.stringify({ interests: [...selected] }),
      });
      router.push("/");
    } catch {
      setError("Please sign in to save your interests");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col max-w-[428px] mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between h-[68px] px-6 shrink-0">
        {/* Exit */}
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

        {/* Center brand + dots */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-inter font-bold text-[10px] tracking-[3px] text-black/50 uppercase">
            Vox Curation
          </span>
          <StepDots currentStep={0} totalSteps={3} />
        </div>

        {/* Skip */}
        <button
          type="button"
          onClick={() => router.push("/")}
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
      <div className="relative w-[384px] h-[448px] mx-auto mt-6">
        {categories.map((cat) => {
          const layout = BUBBLE_LAYOUT[cat] ?? DEFAULT_LAYOUT;
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
          disabled={submitting || selected.size === 0}
          onClick={handleSubmit}
          className="bg-black rounded-full h-16 w-full shadow-[0px_25px_50px_rgba(0,0,0,0.2)] flex items-center justify-center disabled:opacity-50"
        >
          <span className="font-inter font-bold text-[10px] tracking-[2.5px] text-white uppercase">
            Enter Vox
          </span>
        </button>
      </div>
    </div>
  );
}
