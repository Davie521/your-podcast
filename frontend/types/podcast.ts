export interface Episode {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly creator: string;
  readonly duration: string;
  readonly color: string;
  readonly imageUrl?: string;
}
