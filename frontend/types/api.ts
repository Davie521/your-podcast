// API response types mirroring backend/app/schemas.py

// ── Shared ──────────────────────────────────────────────────

export interface CreatorInfo {
  name: string;
  avatar_url: string;
}

// ── Episodes ────────────────────────────────────────────────

export interface SourceItem {
  id: string;
  title: string;
  url: string;
  source: string;
}

export interface TranscriptItem {
  speaker: string;
  text: string;
}

export interface EpisodeListItem {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  audio_url: string;
  duration: number;
  is_public: boolean;
  creator_id: string;
  creator: CreatorInfo;
  published_at: string;
}

export interface EpisodeDetail extends EpisodeListItem {
  sources: SourceItem[];
  transcript: TranscriptItem[];
}

export interface EpisodeListResponse {
  episodes: EpisodeListItem[];
  total: number;
  limit: number;
  offset: number;
}

// ── User ────────────────────────────────────────────────────

export interface UserStats {
  total_episodes: number;
  public_episodes: number;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  interests: string[];
  created_at: string;
  stats: UserStats;
}

// ── Task ────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TaskResponse {
  task_id: string;
  status: TaskStatus;
  progress: string;
  episode_id: string | null;
}
