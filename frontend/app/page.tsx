'use client';

import { useRouter } from 'next/navigation';

import { useAuth } from '../hooks/useAuth';
import type { EpisodeListItem } from '../types/api';
import { request } from '../lib/api';
import { useEffect, useState } from 'react';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [episodes, setEpisodes] = useState<EpisodeListItem[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    request<{ episodes: EpisodeListItem[] }>('/api/episodes')
      .then((data) => setEpisodes(data.episodes))
      .catch(() => {});
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfdf5]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdf5]">
      {/* Header */}
      <header className="border-b border-[#e0e0d8]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <span className="font-serif text-xl font-bold uppercase tracking-[-1.2px] text-[#111]">
              U
            </span>
            <span className="mx-[-1px] flex h-5 w-5 items-center justify-center rounded-full border border-[#111]">
              <span className="text-[8px] leading-none">🎙️</span>
            </span>
            <span className="font-serif text-xl font-bold uppercase tracking-[-1.2px] text-[#111]">
              AST
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#666]">{user?.name}</span>
            <button
              type="button"
              onClick={logout}
              className="cursor-pointer text-sm text-[#999] hover:text-[#111]"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-2 font-serif text-3xl text-[#111]">
          你好, {user?.name}
        </h1>
        <p className="mb-10 text-[#666]">
          今日科技播客已为你准备好。
        </p>

        {/* Episode list */}
        <div className="flex flex-col gap-4">
          {episodes.length === 0 && (
            <p className="py-20 text-center text-[#999]">暂无播客内容</p>
          )}
          {episodes.map((ep) => (
            <article
              key={ep.id}
              className="rounded-[10px] border border-[#e0e0d8] bg-white p-5 transition-colors hover:bg-[#f9f9f2]"
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-[#999]">
                <span>{formatDate(ep.published_at)}</span>
                <span>·</span>
                <span>{formatDuration(ep.duration)}</span>
              </div>
              <h2 className="mb-1 font-serif text-lg text-[#111]">
                {ep.title}
              </h2>
              <p className="text-sm leading-relaxed text-[#666]">
                {ep.description}
              </p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
