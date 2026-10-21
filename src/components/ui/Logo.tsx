import { motion, useReducedMotion } from 'motion/react';

interface LogoProps {
  size?: number;
  /** Uses the light treatment for dark surfaces. */
  variant?: 'dark' | 'light';
  withWordmark?: boolean;
  className?: string;
}

/**
 * The QueueLess mark: three stacked queue lines resolving into a single
 * advancing dot — the queue getting shorter.
 */
export function Logo({ size = 32, variant = 'dark', withWordmark = true, className = '' }: LogoProps) {
  const reduceMotion = useReducedMotion();
  const lineColor = variant === 'light' ? '#5EEAD4' : '#0F766E';
  const wordColor = variant === 'light' ? '#FFFFFF' : '#101828';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        role="img"
        aria-label="QueueLess"
        initial={reduceMotion ? undefined : { rotate: -4, scale: 0.94, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <rect width="64" height="64" rx="16" fill={variant === 'light' ? '#0F766E' : '#101828'} />
        <g stroke={lineColor} strokeWidth="5" strokeLinecap="round">
          <path d="M20 23h24" />
          <path d="M20 36h14" />
        </g>
        <motion.circle
          cx="45"
          cy="36"
          r="5"
          fill={lineColor}
          animate={reduceMotion ? undefined : { x: [0, -3, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>
      {withWordmark && (
        <span
          className="text-[19px] font-semibold tracking-[-0.03em]"
          style={{ color: wordColor }}
        >
          Queue<span style={{ color: lineColor }}>Less</span>
        </span>
      )}
    </span>
  );
}