'use client';

import { ViewTransition } from 'react';
import type { ReactNode } from 'react';
import { AudioProvider } from '@/contexts/AudioContext';

interface ClientLayoutProps {
  readonly children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AudioProvider>
      <ViewTransition>{children}</ViewTransition>
    </AudioProvider>
  );
}
