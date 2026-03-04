import type { EpisodeDetail } from '@/types/audio';

export const EPISODES: readonly EpisodeDetail[] = [
  {
    id: 'ep-1',
    title: 'Rust vs Go in 2026: The Definitive Take',
    subtitle: 'Rust / Go / Performance',
    creator: '@dev.alex',
    duration: '9 min',
    durationSeconds: 540,
    color: '#f54900',
    imageUrl: '/covers/rust-vs-go.png',
    audioUrl: '',
    sources: [
      { title: 'Rust 2026 Edition', publisher: 'Rust Blog', url: '#' },
      { title: 'Go 1.24 Benchmarks', publisher: 'Go Blog', url: '#' },
      { title: 'Systems Programming Survey', publisher: 'StackOverflow', url: '#' },
    ],
  },
  {
    id: 'ep-2',
    title: 'Quantum Computing Explained Simply',
    subtitle: 'Quantum / Qubits / Google',
    creator: '@physics.dan',
    duration: '11 min',
    durationSeconds: 660,
    color: '#009689',
    imageUrl: '/covers/quantum.png',
    audioUrl: '',
    sources: [
      { title: 'Quantum Supremacy Update', publisher: 'Google AI', url: '#' },
      { title: 'Qubits Explained', publisher: 'Nature', url: '#' },
    ],
  },
  {
    id: 'ep-3',
    title: 'Claude Code and the AI Coding Revolution',
    subtitle: 'AI / Coding / Agents',
    creator: '@techie.sam',
    duration: '14 min',
    durationSeconds: 840,
    color: '#432dd7',
    imageUrl: '/covers/claude-coding.png',
    audioUrl: '',
    sources: [
      { title: 'AI-Assisted Development Report', publisher: 'Anthropic', url: '#' },
      { title: 'The Future of Programming', publisher: 'ACM', url: '#' },
      { title: 'Developer Productivity Study', publisher: 'GitHub', url: '#' },
    ],
  },
  {
    id: 'ep-4',
    title: 'Are Podcasts Dying or Evolving?',
    subtitle: 'Media / Audio / Trends',
    creator: '@media.jan',
    duration: '8 min',
    durationSeconds: 480,
    color: '#155dfc',
    imageUrl: '/covers/death-podcasts.png',
    audioUrl: '',
    sources: [
      { title: 'Podcast Industry Report 2026', publisher: 'Edison Research', url: '#' },
      { title: 'Audio Content Trends', publisher: 'Spotify', url: '#' },
    ],
  },
  {
    id: 'ep-5',
    title: 'The Science of Sleep & Productivity',
    subtitle: 'Sleep / Focus / Deep Work',
    creator: '@sarah.k',
    duration: '10 min',
    durationSeconds: 600,
    color: '#ff637e',
    imageUrl: '/covers/sleep-science.png',
    audioUrl: '',
    sources: [
      { title: 'Sleep and Cognitive Performance', publisher: 'Nature Medicine', url: '#' },
      { title: 'Deep Work Revisited', publisher: 'Cal Newport', url: '#' },
    ],
  },
  {
    id: 'ep-6',
    title: 'GPT-5 and the Future of Reasoning',
    subtitle: 'AI / Chain-of-Thought / LLM',
    creator: '@marcus.li',
    duration: '8 min',
    durationSeconds: 480,
    color: '#009689',
    imageUrl: '/covers/gpt5.png',
    audioUrl: '',
    sources: [
      { title: 'GPT-5 Technical Report', publisher: 'OpenAI', url: '#' },
      { title: 'Chain-of-Thought Prompting', publisher: 'Arxiv', url: '#' },
    ],
  },
  {
    id: 'ep-7',
    title: 'Why Every Startup Needs an AI Strategy',
    subtitle: 'Startup / AI / YC',
    creator: '@jenny.w',
    duration: '12 min',
    durationSeconds: 720,
    color: '#432dd7',
    imageUrl: '/covers/ai-strategy.png',
    audioUrl: '',
    sources: [
      { title: 'YC Startup Trends 2026', publisher: 'Y Combinator', url: '#' },
      { title: 'AI Strategy Framework', publisher: 'a16z', url: '#' },
    ],
  },
  {
    id: 'ep-8',
    title: 'Mars Colony: SpaceX 2026 Update',
    subtitle: 'Space / Starship / Mars',
    creator: '@space.kate',
    duration: '13 min',
    durationSeconds: 780,
    color: '#155dfc',
    imageUrl: '/covers/vision-pro.png',
    audioUrl: '',
    sources: [
      { title: 'Starship Progress Report', publisher: 'SpaceX', url: '#' },
    ],
  },
  {
    id: 'ep-9',
    title: 'Inside the Vision Pro Developer Kit',
    subtitle: 'Apple / VR / Spatial Computing',
    creator: '@vr.mike',
    duration: '10 min',
    durationSeconds: 600,
    color: '#f54900',
    imageUrl: '/covers/react-deep.png',
    audioUrl: '',
    sources: [
      { title: 'Vision Pro Dev Kit Review', publisher: 'The Verge', url: '#' },
    ],
  },
] as const;

export function findEpisodeById(id: string): EpisodeDetail | undefined {
  return EPISODES.find((ep) => ep.id === id);
}

/** Discover 页: 前 5 条 */
export function getDiscoverEpisodes(): readonly EpisodeDetail[] {
  return EPISODES.slice(0, 5);
}

/** My Shows Recent: 后 4 条 */
export function getRecentEpisodes(): readonly EpisodeDetail[] {
  return EPISODES.slice(5);
}
