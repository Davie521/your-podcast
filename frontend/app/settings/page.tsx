'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SettingsRowProps {
  label: string;
  href?: string;
  onPress?: () => void;
}

function SettingsRow({ label, href, onPress }: SettingsRowProps) {
  const chevron = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M8 5L13 10L8 15"
        stroke="#999"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const inner = (
    <>
      <span className="font-serif font-bold text-[16px] text-[#111] flex-1">{label}</span>
      {chevron}
    </>
  );

  const rowClass =
    'flex items-center gap-3 px-4 h-[56px] w-full last:border-0 border-b border-[#e0e0d8]';

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onPress} className={`${rowClass} text-left`}>
      {inner}
    </button>
  );
}

interface SettingsGroupProps {
  heading?: string;
  children: React.ReactNode;
}

function SettingsGroup({ heading, children }: SettingsGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      {heading && (
        <p className="font-serif font-bold text-[10px] text-[rgba(17,17,17,0.6)] tracking-[2px] uppercase px-1">
          {heading}
        </p>
      )}
      <div className="bg-white border border-[#e0e0d8] rounded-[16px] shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 h-16 shrink-0 relative">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 flex items-center justify-center"
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 19L8 12L15 5"
              stroke="#111"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="font-serif font-bold text-[24px] text-[#111] absolute left-1/2 -translate-x-1/2">
          Settings
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="flex flex-col gap-5 pt-2">
          {/* Profile card */}
          <div className="bg-white border border-[#e0e0d8] rounded-[16px] shadow-sm">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-[18px] py-[18px]"
            >
              <div className="size-14 rounded-full bg-[#e0e0d8] shrink-0 overflow-hidden" />
              <div className="flex-1 min-w-0">
                <p className="font-serif font-bold text-[18px] text-[#111] leading-7">
                  Eleanor Davies
                </p>
                <p className="font-sans text-[14px] text-[rgba(17,17,17,0.6)] leading-5">
                  @eleanor.d
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M8 5L13 10L8 15"
                  stroke="#999"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Account section */}
          <SettingsGroup>
            <SettingsRow label="My Profile" href="/profile" />
            <SettingsRow label="History" href="#" />
            <SettingsRow label="Downloads" href="#" />
          </SettingsGroup>

          {/* Content & Preferences */}
          <SettingsGroup heading="Content & Preferences">
            <SettingsRow label="Interests" href="/onboarding?back=/settings" />
            <SettingsRow label="Playback Settings" href="#" />
            <SettingsRow label="Region & Language" href="#" />
          </SettingsGroup>

          {/* Support & About */}
          <SettingsGroup heading="Support & About">
            <SettingsRow label="Help & FAQ" href="#" />
          </SettingsGroup>

          {/* Log Out */}
          <button
            type="button"
            className="w-full pt-4 font-serif font-bold text-[18px] text-[#e7000b] text-center"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
