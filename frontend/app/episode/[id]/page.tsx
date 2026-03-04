import { notFound } from 'next/navigation';
import { EPISODES, findEpisodeById } from '@/data/episodes';
import { NowPlaying } from '@/components/NowPlaying';

export const dynamicParams = false;

export function generateStaticParams() {
  return EPISODES.map((ep) => ({ id: ep.id }));
}

export default async function EpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!findEpisodeById(id)) {
    notFound();
  }
  return <NowPlaying episodeId={id} />;
}
