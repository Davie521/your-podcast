import Image from 'next/image';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { PauseIcon } from '@/components/icons/PauseIcon';

interface EpisodeRowProps {
  readonly title: string;
  readonly subtitle: string;
  readonly creator: string;
  readonly duration: string;
  readonly imageUrl?: string;
  readonly color: string;
  readonly isPlaying?: boolean;
  readonly onPlay?: () => void;
  readonly onTap?: () => void;
}

export function EpisodeRow({ title, subtitle, creator, duration, imageUrl, color, isPlaying = false, onPlay, onTap }: EpisodeRowProps) {
  const Icon = isPlaying ? PauseIcon : PlayIcon;

  return (
    <div
      className="flex gap-4 items-start border-b border-border-warm pb-4 cursor-pointer tap-feedback"
      onClick={onTap}
      role={onTap ? 'button' : undefined}
      tabIndex={onTap ? 0 : undefined}
      onKeyDown={onTap ? (e) => { if (e.key === 'Enter') { onTap(); } } : undefined}
    >
      <div
        className="relative size-20 shrink-0 rounded-[10px] overflow-hidden"
        style={{ backgroundColor: color }}
      >
        {imageUrl && (
          <Image src={imageUrl} alt={title} fill className="object-cover opacity-80" />
        )}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <h3 className="font-serif font-bold text-[16px] leading-5 text-[#111] line-clamp-2">{title}</h3>
        <p className="font-serif text-[12px] leading-4 text-[rgba(17,17,17,0.7)] mt-1">{subtitle}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-inter text-[12px] text-[#666]">{creator}</span>
          <span className="text-[#666]">&middot;</span>
          <span className="font-inter text-[12px] text-[#666]">{duration}</span>
        </div>
      </div>
      {onPlay && (
        <div className="flex items-center self-center shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
            className="size-10 rounded-full bg-[#111] shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center pl-0.5 transition-transform duration-150 active:scale-90"
          >
            <Icon className="size-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
