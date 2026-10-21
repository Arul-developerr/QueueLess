import type { ReactNode } from 'react';
import type { StatusMeta } from '../../types/queue';

export type BadgeTone = 'neutral' | 'teal' | 'amber' | 'coral' | 'success' | 'navy' | 'mint';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-canvas text-ink-muted ring-line',
  teal: 'bg-teal/10 text-teal-700 ring-teal/20',
  mint: 'bg-mint-soft text-teal-700 ring-mint/40',
  amber: 'bg-amber/12 text-amber ring-amber/25',
  coral: 'bg-coral/12 text-coral ring-coral/25',
  success: 'bg-success/12 text-success ring-success/25',
  navy: 'bg-navy/8 text-navy ring-navy/15',
};

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** Renders a small status dot before the label. */
  dot?: boolean;
  /** Continuously pulsing dot, for genuinely live demo states. */
  pulse?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  pulse = false,
  className = '',
  size = 'sm',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${
        TONES[tone]
      } ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} ${className}`}
    >
      {dot && (
        <span className="relative flex size-1.5">
          {pulse && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

/** Maps a status tone to the matching badge tone. */
export function statusTone(tone: StatusMeta['tone']): BadgeTone {
  return tone;
}