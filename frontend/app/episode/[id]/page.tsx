import { EPISODES } from '@/data/episodes';
import { NowPlaying } from '@/components/NowPlaying';

export function generateStaticParams() {
  return EPISODES.map((ep) => ({ id: ep.id }));
}

export default async function EpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NowPlaying episodeId={id} />;
}
