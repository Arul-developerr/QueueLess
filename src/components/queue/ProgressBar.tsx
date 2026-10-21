import { motion, useReducedMotion } from 'motion/react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  tone?: 'teal' | 'mint' | 'amber';
  size?: 'sm' | 'md';
}

const TONES = {
  teal: 'bg-teal',
  mint: 'bg-mint',
  amber: 'bg-amber',
} as const;

/** Animated progress bar used for queue completion and capacity. */
export function ProgressBar({
  value,
  max = 100,
  label,
  className = '',
  tone = 'teal',
  size = 'md',
}: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-[12px]">
          <span className="font-medium text-ink-muted">{label}</span>
          <span className="tnum font-semibold text-navy">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className={`w-full overflow-hidden rounded-full bg-navy/8 ${
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        }`}
      >
        <motion.div
          className={`h-full rounded-full ${TONES[tone]}`}
          initial={reduceMotion ? undefined : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}