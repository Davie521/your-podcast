'use client';

import { BottomNav } from '@/components/BottomNav';
import { useAudioState } from '@/hooks/useAudioState';

function ChevronRightIcon() {
  return (
    <svg
      className="size-[18px] text-[#c0c0b5]"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingRow({
  label,
  subtitle,
}: {
  readonly label: string;
  readonly subtitle?: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between py-4 border-b border-border-warm tap-feedback"
    >
      <div className="text-left">
        <p className="font-serif text-[16px] leading-6 text-[#111]">{label}</p>
        {subtitle && (
          <p className="font-inter text-[12px] text-[#666] mt-0.5">{subtitle}</p>
        )}
      </div>
      <ChevronRightIcon />
    </button>
  );
}

export default function ProfilePage() {
  const { currentEpisode } = useAudioState();
  const hasPlayer = currentEpisode !== null;

  return (
    <div className="min-h-screen bg-cream">
      <main
        className={`mx-auto w-full max-w-[428px] px-6 pt-6 ${hasPlayer ? 'pb-36' : 'pb-24'}`}
      >
        {/* Header — same pattern as Shows */}
        <div className="flex flex-col gap-3 mb-10 animate-fade-in">
          <h1 className="font-serif text-4xl leading-10 text-[#111]">Profile</h1>
          <p className="font-serif italic text-[14px] text-[#666] leading-5 opacity-70">
            Your account &amp; preferences
          </p>
        </div>

        {/* Profile row — left-aligned like an episode row */}
        <button
          type="button"
          aria-label="View profile"
          className="flex w-full items-center gap-4 pb-4 border-b border-border-warm tap-feedback animate-fade-in anim-delay-1"
        >
          <div
            className="size-16 shrink-0 rounded-full bg-border-warm flex items-center justify-center"
          >
            <span className="font-serif text-[24px] text-[#111]/30 select-none leading-none">
              M
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-serif font-bold text-[16px] leading-5 text-[#111]">Mark</p>
            <p className="font-inter text-[12px] text-[#666] mt-1">@mark</p>
          </div>
          <ChevronRightIcon />
        </button>

        {/* General section — same pattern as Shows "Recent" */}
        <section className="mt-8 animate-fade-in anim-delay-2">
          <h2 className="font-serif font-bold text-[14px] text-black/60 tracking-[1.4px] uppercase mb-4">
            General
          </h2>
          <SettingRow label="Interests" subtitle="Coming soon" />
          <SettingRow label="Help & FAQ" />
        </section>

        {/* Log Out */}
        <div className="mt-12 flex justify-center animate-fade-in anim-delay-3">
          <button
            type="button"
            className="font-serif text-[14px] text-[#c07060] tap-feedback"
          >
            Log Out
          </button>
        </div>

        {/* Version */}
        <p className="mt-4 text-center font-inter text-[10px] text-[#ccc] tracking-[0.5px] animate-fade-in anim-delay-3">
          v0.1.0
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
