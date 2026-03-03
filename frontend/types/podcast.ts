export interface Podcast {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly description: string;
  readonly color: string;
  readonly imageUrl?: string;
}
