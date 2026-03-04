'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthDispatch } from '@/hooks/useAuthDispatch';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { login } = useAuthDispatch();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/explore');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh justify-center bg-cream pt-[80px] sm:items-center sm:px-6 sm:pt-0">
      <div className="w-full max-w-[393px] bg-cream px-6 py-20 sm:overflow-hidden sm:rounded-2xl sm:shadow-[0px_0px_0px_1px_rgba(224,224,216,0.5),0px_25px_50px_-12px_rgba(0,0,0,0.05)]">
        {/* Logo */}
        <div className="mb-12 flex items-center justify-center">
          <span className="font-serif text-2xl font-bold uppercase leading-[32px] tracking-[-1.2px] text-[#111]">
            Your
          </span>
          <span className="mx-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#111]">
            <span className="text-[10px] leading-none">&#x1F399;&#xFE0F;</span>
          </span>
          <span className="font-serif text-2xl font-bold uppercase leading-[32px] tracking-[-1.2px] text-[#111]">
            Podcast
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-center font-serif text-4xl leading-[40px] text-[#111]">
          Welcome
        </h1>
        <p className="mx-auto mb-12 max-w-[260px] text-center font-serif italic text-base leading-[26px] text-[#111]/60">
          Your daily tech podcast, curated just for you.
        </p>

        {/* Divider */}
        <div className="relative mb-6 flex items-center">
          <div className="flex-1 border-t border-border-warm" />
          <span className="bg-cream px-4 font-inter text-[10px] uppercase leading-[15px] tracking-[1px] text-[#666]">
            Sign in with
          </span>
          <div className="flex-1 border-t border-border-warm" />
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={() => login('google')}
          className="mb-3 flex h-[56px] w-full items-center justify-between rounded-[10px] border border-border-warm px-[25px] tap-feedback transition-colors hover:bg-[#f5f5ed]"
        >
          <span className="font-serif text-lg leading-[28px] text-[#111]">
            Continue with Google
          </span>
          <span className="font-inter text-xl font-bold text-[#111]">G</span>
        </button>

        {/* GitHub button */}
        <button
          type="button"
          onClick={() => login('github')}
          className="flex h-[56px] w-full items-center justify-between rounded-[10px] border border-border-warm px-[25px] tap-feedback transition-colors hover:bg-[#f5f5ed]"
        >
          <span className="font-serif text-lg leading-[28px] text-[#111]">
            Continue with GitHub
          </span>
          <svg className="size-5 text-[#111]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </button>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 font-inter">
          <a href="/privacy" className="text-[10px] leading-[15px] text-[#666] hover:text-[#111]">
            Privacy Policy
          </a>
          <span className="text-[10px] leading-[15px] text-[#666]">|</span>
          <a href="/terms" className="text-[10px] leading-[15px] text-[#666] hover:text-[#111]">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}
