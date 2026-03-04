import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { PlayerProvider } from '@/context/PlayerContext';
import { Player } from '@/components/Player';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Your Podcast',
  description: '每日中文科技播客',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PlayerProvider>
          {children}
          <Player />
        </PlayerProvider>
      </body>
    </html>
  );
}
