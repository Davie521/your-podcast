'use client';

import type { ReactNode } from 'react';
import { AudioProvider } from '@/contexts/AudioContext';

interface ClientLayoutProps {
  readonly children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return <AudioProvider>{children}</AudioProvider>;
}
