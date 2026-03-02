'use client';

import { useEffect, useState } from 'react';

import type { UserResponse } from '../types/api';
import {
  ApiError,
  devLogin,
  fetchCurrentUser,
  isLocalDev,
  logout as apiLogout,
} from '../lib/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const data = await fetchCurrentUser();
        if (!cancelled) {
          setUser(data);
          setStatus('authenticated');
        }
      } catch (err) {
        if (cancelled) return;

        // On localhost, auto dev-login then retry
        if (err instanceof ApiError && err.status === 401 && isLocalDev()) {
          try {
            await devLogin();
            const data = await fetchCurrentUser();
            if (!cancelled) {
              setUser(data);
              setStatus('authenticated');
            }
            return;
          } catch {
            // dev-login failed (no seed user, etc.) — fall through
          }
        }

        if (!cancelled) {
          setStatus('unauthenticated');
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout(): Promise<void> {
    await apiLogout();
    setUser(null);
    setStatus('unauthenticated');
  }

  return {
    status,
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    logout,
  };
}
