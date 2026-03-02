'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '../../hooks/useAuth';
import { getOAuthUrl } from '../../lib/api';

export function LoginPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfdf5]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
      </div>
    );
  }

  function handleGoogleLogin() {
    window.location.href = getOAuthUrl('google');
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#fdfdf5] pt-[80px] sm:items-center sm:px-6 sm:pt-0">
      <div className="w-full max-w-[393px] bg-[#fdfdf5] px-6 py-20 sm:overflow-hidden sm:rounded-2xl sm:shadow-[0px_0px_0px_1px_rgba(224,224,216,0.5),0px_25px_50px_-12px_rgba(0,0,0,0.05)]">
        {/* Logo */}
        <div className="mb-12 flex items-center justify-center">
          <span className="font-serif text-2xl font-bold uppercase leading-[32px] tracking-[-1.2px] text-[#111]">
            U
          </span>
          <span className="mx-[-2px] flex h-6 w-6 items-center justify-center rounded-full border border-[#111]">
            <span className="text-[10px] leading-none">🎙️</span>
          </span>
          <span className="font-serif text-2xl font-bold uppercase leading-[32px] tracking-[-1.2px] text-[#111]">
            AST
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-center font-serif text-4xl leading-[40px] text-[#111]">
          Welcome to Ucast
        </h1>
        <p className="mx-auto mb-12 max-w-[240px] text-center font-serif text-base leading-[26px] text-[#111]/80">
          Sign in to explore your world of storytelling.
        </p>

        {/* Divider */}
        <div className="relative mb-6 flex items-center">
          <div className="flex-1 border-t border-[#e0e0d8]" />
          <span className="bg-[#fdfdf5] px-4 font-sans text-[10px] uppercase leading-[15px] tracking-[1px] text-[#666]">
            Or sign in with
          </span>
          <div className="flex-1 border-t border-[#e0e0d8]" />
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex h-[56px] w-full cursor-pointer items-center justify-between rounded-[10px] border border-[#e0e0d8] px-[25px] transition-colors hover:bg-[#f5f5ed]"
        >
          <span className="font-serif text-lg leading-[28px] text-[#111]">
            Continue with Google
          </span>
          <span className="font-sans text-xl font-bold text-[#111]">G</span>
        </button>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 font-sans">
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

export default LoginPage;
