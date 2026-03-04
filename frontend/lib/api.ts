import type { User } from '@/types/auth';

// ── Base URL ────────────────────────────────────────────────

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function isLocalHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.')
  );
}

function getApiBaseUrl(): string {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envBaseUrl) {
    return normalizeBaseUrl(envBaseUrl);
  }

  // Browser fallback is only safe for local-network development.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (isLocalHost(host)) {
      return `http://${host}:8000`;
    }
    throw new Error(
      'NEXT_PUBLIC_API_URL is required for non-local frontend hosts.',
    );
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }

  throw new Error('NEXT_PUBLIC_API_URL is required outside local development.');
}

// ── Error ───────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Request ─────────────────────────────────────────────────

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ── Auth helpers ────────────────────────────────────────────

export function getOAuthUrl(provider: 'google' | 'github'): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/auth/${provider}`;
}

export function fetchCurrentUser(): Promise<User> {
  return request<User>('/api/auth/me');
}

export function logout(): Promise<void> {
  return request<void>('/api/auth/logout', { method: 'POST' });
}

export function devLogin(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/api/auth/dev-login', { method: 'POST' });
}

export function isLocalDev(): boolean {
  if (typeof window === 'undefined') return process.env.NODE_ENV === 'development';
  return isLocalHost(window.location.hostname);
}
