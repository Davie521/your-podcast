import Image from 'next/image';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { PauseIcon } from '@/components/icons/PauseIcon';

interface PodcastCardProps {
  title: string;
  author: string;
  description: string;
  color: string;
  imageUrl?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
}

export function PodcastCard({
  title,
  author,
  description,
  color,
  imageUrl,
  isPlaying = false,
  onPlay,
}: PodcastCardProps) {
  const Icon = isPlaying ? PauseIcon : PlayIcon;

  return (
    <div className="flex gap-4 items-start border-b border-border-warm pb-4">
      <div
        className="relative size-20 shrink-0 rounded-[10px] overflow-hidden"
        style={{ backgroundColor: color }}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={`${title} cover art`}
            fill
            className="object-cover opacity-80"
          />
        )}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <h3 className="font-serif font-bold text-lg leading-[22.5px] text-[#111]">
          {title}
        </h3>
        <p className="font-serif text-xs leading-4 text-[#111]/70 mt-1">
          {author}
        </p>
        <p className="font-inter text-xs leading-[19.5px] text-[#666] mt-1.5 line-clamp-2">
          {description}
        </p>
      </div>

      <div className="flex items-center self-center shrink-0">
        <button
          type="button"
          onClick={onPlay}
          aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
          className="size-10 rounded-full bg-[#111] shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center pl-0.5"
        >
          <Icon className="size-4 text-white" />
        </button>
      </div>
    </div>
  );
}
