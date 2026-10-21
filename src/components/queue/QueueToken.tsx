import { motion, useReducedMotion } from 'motion/react';
import { Hash } from 'lucide-react';
import type { QueueStatus } from '../../types/queue';
import { STATUS_META } from '../../lib/statusMeta';

interface QueueTokenProps {
  token: string;
  status?: QueueStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Renders on a dark surface. */
  onDark?: boolean;
}

const SIZES = {
  sm: { box: 'text-[15px] px-2.5 py-1 tracking-tight', icon: 'size-3' },
  md: { box: 'text-lg px-3 py-1.5', icon: 'size-3.5' },
  lg: { box: 'text-2xl px-3.5 py-2', icon: 'size-4' },
  xl: { box: 'text-[34px] sm:text-[42px] px-4 py-3 leading-none', icon: 'size-5' },
} as const;

const STATUS_TINT: Record<QueueStatus, string> = {
  waiting: 'text-ink',
  called: 'text-amber',
  'in-service': 'text-teal',
  completed: 'text-success',
  'no-show': 'text-coral',
  cancelled: 'text-ink-muted',
};

/**
 * The digital queue token. Uses tabular numerals so the value never
 * shifts layout as it changes.
 */
export function QueueToken({
  token,
  status = 'waiting',
  size = 'md',
  className = '',
  onDark = false,
}: QueueTokenProps) {
  const reduceMotion = useReducedMotion();
  const meta = STATUS_META[status];

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex flex-col items-start gap-1 ${className}`}
    >
      <span
        className={`tnum inline-flex items-center gap-1.5 rounded-[10px] font-semibold ${SIZES[size].box} ${
          onDark ? 'bg-white/10 text-white' : 'bg-canvas'
        } ${STATUS_TINT[status]}`}
      >
        <Hash aria-hidden className={SIZES[size].icon} strokeWidth={2.6} />
        {token}
      </span>
      <span className={`text-[11.5px] font-medium ${onDark ? 'text-white/60' : 'text-ink-muted'}`}>
        {meta.label}
      </span>
    </motion.div>
  );
}