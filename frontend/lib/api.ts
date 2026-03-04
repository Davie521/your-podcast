import type { EpisodeDetail, EpisodesResponse } from '@/types/podcast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export function getEpisodes(params?: { limit?: number; offset?: number }): Promise<EpisodesResponse> {
  const query = new URLSearchParams();
  if (params?.limit != null) { query.set('limit', String(params.limit)); }
  if (params?.offset != null) { query.set('offset', String(params.offset)); }
  const qs = query.toString();
  return apiFetch<EpisodesResponse>(`/api/episodes${qs ? `?${qs}` : ''}`);
}

export function getEpisode(id: string): Promise<EpisodeDetail> {
  return apiFetch<EpisodeDetail>(`/api/episodes/${id}`);
}
