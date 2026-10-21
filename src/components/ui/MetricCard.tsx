import { motion, useReducedMotion } from 'motion/react';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  /** Contextual comparison, e.g. "vs 12 min yesterday". */
  comparison?: { label: string; direction: 'up' | 'down' | 'flat'; isPositive?: boolean };
  /** Supporting sentence explaining where the number comes from. */
  hint?: string;
  accent?: 'teal' | 'mint' | 'amber' | 'coral' | 'navy';
  className?: string;
  children?: ReactNode;
}

const ACCENTS = {
  teal: 'bg-teal/10 text-teal',
  mint: 'bg-mint-soft text-teal-700',
  amber: 'bg-amber/12 text-amber',
  coral: 'bg-coral/12 text-coral',
  navy: 'bg-navy/8 text-navy',
} as const;

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  comparison,
  hint,
  accent = 'teal',
  className = '',
  children,
}: MetricCardProps) {
  const reduceMotion = useReducedMotion();
  const TrendIcon = comparison?.direction === 'down' ? TrendingDown : TrendingUp;
  const trendTone = !comparison
    ? ''
    : comparison.direction === 'flat'
      ? 'text-ink-muted'
      : comparison.isPositive === false
        ? 'text-coral'
        : 'text-success';

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`group rounded-card border border-line bg-white p-5 shadow-xs transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-muted">{label}</p>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="tnum text-[30px] leading-none font-semibold tracking-tight text-navy">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-ink-muted">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${ACCENTS[accent]}`}
          >
            <Icon aria-hidden className="size-[18px]" strokeWidth={2} />
          </span>
        )}
      </div>

      {comparison && (
        <div className={`mt-3 flex items-center gap-1.5 text-[12px] font-medium ${trendTone}`}>
          {comparison.direction !== 'flat' && (
            <TrendIcon aria-hidden className="size-3.5" strokeWidth={2.4} />
          )}
          <span>{comparison.label}</span>
        </div>
      )}

      {hint && <p className="mt-2.5 text-[12px] leading-relaxed text-ink-muted">{hint}</p>}
      {children}
    </motion.div>
  );
}