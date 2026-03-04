export interface Creator {
  readonly name: string;
  readonly avatar_url: string | null;
}

export interface EpisodeListItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly cover_url: string | null;
  readonly audio_url: string;
  readonly duration: number;
  readonly is_public: boolean;
  readonly creator_id: string;
  readonly creator: Creator;
  readonly published_at: string;
}

export interface Source {
  readonly title: string;
  readonly url: string;
  readonly source: string;
}

export interface TranscriptLine {
  readonly speaker: 'Alex' | 'Jordan';
  readonly text: string;
}

export interface EpisodeDetail extends EpisodeListItem {
  readonly sources: readonly Source[];
  readonly transcript: readonly TranscriptLine[];
}

export interface EpisodesResponse {
  readonly episodes: readonly EpisodeListItem[];
  readonly total: number;
}
