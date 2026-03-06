'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthDispatch } from '@/hooks/useAuthDispatch';
import { devLogin, isLocalDev } from '@/lib/api';

const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

export default function LoginPage() {
  const router = useRouter();
  const { status, user } = useAuth();
  const { login } = useAuthDispatch();
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState('');
  const [phase, setPhase] = useState<'init' | 'logo' | 'reveal'>('init');
  const showDevLogin = useSyncExternalStore(
    () => () => {},
    () => isLocalDev(),
    () => false,
  );

  useEffect(() => {
    if (status === 'authenticated') {
      if (user && user.interests.length === 0) {
        router.replace('/onboarding');
      } else {
        router.replace('/explore');
      }
    }
  }, [status, user, router]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const t = setTimeout(() => setPhase('reveal'), 0);
      return () => clearTimeout(t);
    }
    // Double-rAF: guarantees browser paints init (opacity 0) before transition starts
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('logo'));
    });
    const t = setTimeout(() => setPhase('reveal'), 350);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
      </div>
    );
  }

  const revealed = phase === 'reveal';
  const logoVisible = phase !== 'init';

  return (
    <div className="flex min-h-dvh justify-center bg-cream pt-[80px] sm:items-center sm:px-6 sm:pt-0">
      {/* Ripple burst on reveal */}
      {revealed && (
        <div
          className="pointer-events-none fixed left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(17,17,17,0.08)]"
          style={{
            width: 56, height: 56,
            animation: `login-ripple 1.4s ${ease} both`,
          }}
        />
      )}

      <div className="w-full max-w-[393px] bg-cream px-6 py-20 sm:overflow-hidden sm:rounded-2xl sm:shadow-[0px_0px_0px_1px_rgba(224,224,216,0.5),0px_25px_50px_-12px_rgba(0,0,0,0.05)]">
        {/* Logo — fades in large, then shrinks to final position */}
        <div
          className="mb-12 flex items-center justify-center"
          style={{
            opacity: logoVisible ? 1 : 0,
            transform: revealed
              ? 'scale(1) translateY(0)'
              : 'scale(1.3) translateY(100px)',
            transition: `opacity 0.4s ${ease}, transform 0.55s ${ease}`,
          }}
        >
          <span className="font-serif text-2xl font-bold uppercase leading-[32px] tracking-[-1.2px] text-[#111]">
            Your
          </span>
          <span
            className="mx-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#111]"
            style={{
              animation: !revealed && logoVisible
                ? `login-mic-pulse 1s ease-in-out infinite`
                : 'none',
            }}
          >
            <span className="text-[10px] leading-none">&#x1F399;&#xFE0F;</span>
          </span>
          <span className="font-serif text-2xl font-bold uppercase leading-[32px] tracking-[-1.2px] text-[#111]">
            Podcast
          </span>
        </div>

        {/* Content — each element animates individually for clean stagger */}
        <div>
          {/* Heading + subtitle (appear first, 0ms delay) */}
          <h1
            className="mb-4 text-center font-serif text-4xl leading-[40px] text-[#111]"
            style={{
              animation: revealed ? `fade-in 0.4s ${ease} both` : 'none',
              opacity: revealed ? undefined : 0,
            }}
          >
            Welcome
          </h1>
          <p
            className="mx-auto mb-12 max-w-[260px] text-center font-serif italic text-base leading-[26px] text-[#111]/60"
            style={{
              animation: revealed ? `fade-in 0.4s 40ms ${ease} both` : 'none',
              opacity: revealed ? undefined : 0,
            }}
          >
            Your daily tech podcast, curated just for you.
          </p>

          {/* Divider — expands from center (80ms delay) */}
          <div className="relative mb-6 flex items-center">
            <div
              className="flex-1 border-t border-border-warm origin-right"
              style={{
                animation: revealed ? `login-divider-l 0.4s 80ms ${ease} both` : 'none',
                opacity: revealed ? undefined : 0,
              }}
            />
            <span
              className="bg-cream px-4 font-inter text-[10px] uppercase leading-[15px] tracking-[1px] text-[#666]"
              style={{
                animation: revealed ? `fade-in 0.3s 60ms ${ease} both` : 'none',
                opacity: revealed ? undefined : 0,
              }}
            >
              Sign in with
            </span>
            <div
              className="flex-1 border-t border-border-warm origin-left"
              style={{
                animation: revealed ? `login-divider-r 0.4s 80ms ${ease} both` : 'none',
                opacity: revealed ? undefined : 0,
              }}
            />
          </div>

          {/* Google button (130ms delay) */}
          <button
            type="button"
            onClick={() => login('google')}
            className="mb-3 flex h-[56px] w-full items-center justify-between rounded-[10px] border border-border-warm px-[25px] tap-feedback transition-colors hover:bg-[#f5f5ed]"
            style={{
              animation: revealed ? `login-btn-in 0.4s 130ms ${ease} both` : 'none',
              opacity: revealed ? undefined : 0,
            }}
          >
            <span className="font-serif text-lg leading-[28px] text-[#111]">
              Continue with Google
            </span>
            <span className="font-inter text-xl font-bold text-[#111]">G</span>
          </button>

          {/* Dev login (180ms delay) */}
          {showDevLogin && (
            <>
              <div
                className="relative mt-6 flex items-center"
                style={{
                  animation: revealed ? `fade-in 0.3s 160ms ${ease} both` : 'none',
                  opacity: revealed ? undefined : 0,
                }}
              >
                <div className="flex-1 border-t border-border-warm" />
                <span className="bg-cream px-4 font-inter text-[10px] uppercase leading-[15px] tracking-[1px] text-[#666]">
                  Dev only
                </span>
                <div className="flex-1 border-t border-border-warm" />
              </div>
              <button
                type="button"
                disabled={devLoading}
                onClick={async () => {
                  setDevLoading(true);
                  setDevError('');
                  try {
                    await devLogin();
                    // Full reload so AuthContext re-fetches user and checks interests
                    window.location.href = '/';
                  } catch (err) {
                    setDevError(err instanceof Error ? err.message : 'Dev login failed — is the backend running?');
                    setDevLoading(false);
                  }
                }}
                className="mt-3 flex h-[56px] w-full items-center justify-between rounded-[10px] border border-dashed border-[#c0c0b5] px-[25px] tap-feedback transition-colors hover:bg-[#f5f5ed]"
                style={{
                  animation: revealed ? `login-btn-in 0.4s 190ms ${ease} both` : 'none',
                  opacity: revealed ? undefined : 0,
                }}
              >
                <span className="font-serif text-lg leading-[28px] text-[#666]">
                  {devLoading ? 'Logging in...' : 'Dev Login (Seed User)'}
                </span>
                <span className="font-inter text-base text-[#666]">~</span>
              </button>
              {devError && (
                <p className="mt-2 text-center font-inter text-[12px] text-[#c07060]">{devError}</p>
              )}
            </>
          )}

          {/* Footer (240ms delay) */}
          <div
            className="mt-8 flex items-center justify-center gap-2 font-inter"
            style={{
              animation: revealed ? `fade-in 0.35s 240ms ${ease} both` : 'none',
              opacity: revealed ? undefined : 0,
            }}
          >
            <Link href="/privacy" className="text-[10px] leading-[15px] text-[#666] hover:text-[#111]">
              Privacy Policy
            </Link>
            <span className="text-[10px] leading-[15px] text-[#666]">|</span>
            <Link href="/terms" className="text-[10px] leading-[15px] text-[#666] hover:text-[#111]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
