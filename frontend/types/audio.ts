export interface Source {
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
}

export interface EpisodeDetail {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly creator: string;
  readonly duration: string;
  readonly durationSeconds: number;
  readonly color: string;
  readonly imageUrl?: string;
  readonly audioUrl: string;
  readonly sources: readonly Source[];
}

export interface AudioState {
  readonly currentEpisode: EpisodeDetail | null;
  readonly isPlaying: boolean;
  readonly isLoading: boolean;
  readonly currentTime: number;
  readonly duration: number;
}

export type AudioAction =
  | { readonly type: 'PLAY'; readonly episode: EpisodeDetail }
  | { readonly type: 'PAUSE' }
  | { readonly type: 'RESUME' }
  | { readonly type: 'STOP' }
  | { readonly type: 'SET_LOADING'; readonly isLoading: boolean }
  | { readonly type: 'SET_TIME'; readonly currentTime: number }
  | { readonly type: 'SET_DURATION'; readonly duration: number };

export interface AudioDispatch {
  play: (episode: EpisodeDetail) => void;
  pause: () => void;
  resume: () => void;
  toggle: (episode: EpisodeDetail) => void;
  seek: (time: number) => void;
  skipForward: (seconds?: number) => void;
  skipBack: (seconds?: number) => void;
  stop: () => void;
}
