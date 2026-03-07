'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Episode } from '@/types/audio';
import { BottomNav } from '@/components/BottomNav';
import { EpisodeRow } from '@/components/EpisodeRow';
import { useAudioState } from '@/hooks/useAudioState';
import { useAudioDispatch } from '@/hooks/useAudioDispatch';
import { useAuth } from '@/hooks/useAuth';
import { ApiError, fetchMyEpisodes, generateEpisode, fetchTaskStatus } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/format';

type LoadState = 'loading' | 'loaded' | 'error';
type GenerateState = 'idle' | 'starting' | 'generating' | 'done' | 'error';

const POLL_INTERVAL_MS = 3000;

const PROGRESS_LABELS: Record<string, string> = {
  queued: 'Queued...',
  starting: 'Starting...',
  fetching_rss: 'Fetching news...',
  filtering_articles: 'Selecting articles...',
  generating_script: 'Writing script...',
  synthesizing_tts: 'Generating audio...',
  merging_audio: 'Merging audio...',
  generating_cover: 'Creating cover...',
  uploading: 'Uploading...',
  saving: 'Saving...',
  done: 'Done!',
};

export default function ShowsPage() {
  const [episodes, setEpisodes] = useState<readonly Episode[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [generateState, setGenerateState] = useState<GenerateState>('idle');
  const [progressText, setProgressText] = useState('');
  const { currentEpisode, isPlaying } = useAudioState();
  const { toggle, play } = useAudioDispatch();
  const { status } = useAuth();
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasPlayer = currentEpisode !== null;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const loadEpisodes = useCallback(() => {
    if (status !== 'authenticated') return;
    fetchMyEpisodes()
      .then((result) => {
        setEpisodes(result.episodes);
        setLoadState('loaded');
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setLoadState('error');
      });
  }, [status, router]);

  useEffect(() => {
    loadEpisodes();
  }, [loadEpisodes]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  function handleGenerate() {
    setGenerateState('starting');
    setProgressText('Starting...');

    generateEpisode()
      .then((res) => {
        setGenerateState('generating');
        pollRef.current = setInterval(() => {
          fetchTaskStatus(res.task_id)
            .then((task) => {
              setProgressText(PROGRESS_LABELS[task.progress] ?? task.progress);

              if (task.status === 'completed') {
                if (pollRef.current) {
                  clearInterval(pollRef.current);
                  pollRef.current = null;
                }
                setGenerateState('done');
                setProgressText('Done!');
                loadEpisodes();
                // Reset to idle after a brief delay
                setTimeout(() => {
                  setGenerateState('idle');
                  setProgressText('');
                }, 2000);
              } else if (task.status === 'failed') {
                if (pollRef.current) {
                  clearInterval(pollRef.current);
                  pollRef.current = null;
                }
                setGenerateState('error');
                setProgressText(task.progress);
              }
            })
            .catch(() => {
              // Polling error — keep trying
            });
        }, POLL_INTERVAL_MS);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 409) {
          setGenerateState('generating');
          setProgressText('Generation already in progress...');
        } else {
          setGenerateState('error');
          setProgressText('Failed to start generation');
        }
      });
  }

  const isGenerating = generateState === 'starting' || generateState === 'generating';

  return (
    <div className="min-h-screen bg-cream">
      <main className={`mx-auto w-full max-w-[428px] px-6 pt-6 ${hasPlayer ? 'pb-36' : 'pb-24'}`}>
        {/* Header */}
        <div className="flex flex-col gap-3 mb-6 animate-fade-in">
          <h1 className="font-serif text-4xl leading-10 text-[#111]">Daily Podcast</h1>
          <p className="font-serif italic text-[14px] text-[#666] leading-5 opacity-70">
            AI-generated podcasts based on your interests
          </p>
        </div>

        {/* Generate Button */}
        {loadState === 'loaded' && (
          <div className="mb-8 animate-fade-in">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || generateState === 'done'}
              className={`w-full rounded-xl py-3 px-4 font-inter text-sm font-medium transition-all duration-200 ${
                isGenerating
                  ? 'bg-[#e5e5e0] text-[#999] cursor-not-allowed'
                  : generateState === 'done'
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : generateState === 'error'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98]'
                      : 'bg-[#111] text-white hover:bg-[#333] active:scale-[0.98]'
              }`}
            >
              {isGenerating && (
                <span className="inline-block mr-2 size-3.5 border-2 border-[#999] border-t-transparent rounded-full animate-spin align-middle" />
              )}
              {generateState === 'idle' && 'Generate New Podcast'}
              {generateState === 'starting' && 'Starting...'}
              {generateState === 'generating' && (progressText || 'Generating...')}
              {generateState === 'done' && 'Done!'}
              {generateState === 'error' && 'Try Again'}
            </button>
            {generateState === 'error' && progressText && (
              <p className="mt-2 font-inter text-xs text-red-500 text-center">{progressText}</p>
            )}
          </div>
        )}

        {/* Content */}
        {loadState === 'loading' && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-start pb-4 animate-pulse">
                <div className="size-20 shrink-0 rounded-[10px] bg-[#e5e5e0]" />
                <div className="flex-1 pt-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-[#e5e5e0]" />
                  <div className="h-3 w-1/2 rounded bg-[#e5e5e0]" />
                  <div className="h-3 w-1/3 rounded bg-[#e5e5e0]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {loadState === 'error' && (
          <p className="font-inter text-sm text-[#666] text-center py-16 animate-fade-in">
            Failed to load podcasts.
          </p>
        )}

        {loadState === 'loaded' && episodes.length === 0 && !isGenerating && (
          <p className="font-inter text-sm text-[#666] text-center py-16 animate-fade-in">
            No podcasts yet. Generate your first one!
          </p>
        )}

        {loadState === 'loaded' && episodes.length > 0 && (
          <section>
            <div className="flex flex-col gap-4">
              {episodes.map((ep, index) => (
                <EpisodeRow
                  key={ep.id}
                  title={ep.title}
                  keywords={ep.keywords}
                  creatorName={formatDate(ep.publishedAt)}
                  duration={formatDuration(ep.duration)}
                  coverUrl={ep.coverUrl}
                  color={ep.color}
                  isPlaying={currentEpisode?.id === ep.id && isPlaying}
                  onPlay={() => toggle(ep)}
                  onTap={() => {
                    play(ep);
                    router.push(`/episode/${ep.id}`);
                  }}
                  className="animate-list-item"
                  style={{ animationDelay: `${200 + index * 60}ms` }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
