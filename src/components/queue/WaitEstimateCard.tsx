import { motion, useReducedMotion } from 'motion/react';
import { Clock, Info } from 'lucide-react';
import type { WaitEstimate } from '../../types/queue';
import { formatRange } from '../../lib/queueEngine';
import { AnimatedNumber } from '../motion/AnimatedNumber';
import { Badge } from '../ui/Badge';

interface WaitEstimateCardProps {
  estimate: WaitEstimate;
  className?: string;
  onDark?: boolean;
  /** Shows the number of visitors ahead beneath the range. */
  showPeopleAhead?: boolean;
}

const CONFIDENCE_TONE = {
  high: 'success',
  moderate: 'amber',
  low: 'coral',
} as const;

/**
 * Presents the wait estimate as a *range* rather than a single precise
 * number, with the confidence level stated in words.
 */
export function WaitEstimateCard({
  estimate,
  className = '',
  onDark = false,
  showPeopleAhead = true,
}: WaitEstimateCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`rounded-card border p-5 ${
        onDark ? 'border-white/12 bg-white/[0.06]' : 'border-line bg-white shadow-xs'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
            onDark ? 'text-white/70' : 'text-ink-muted'
          }`}
        >
          <Clock aria-hidden className="size-3.5" strokeWidth={2.2} />
          Estimated waiting time
        </span>
        <Badge tone={CONFIDENCE_TONE[estimate.confidence]} className="capitalize">
          {estimate.confidence} confidence
        </Badge>
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <motion.span
          key={`${estimate.min}-${estimate.max}`}
          initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`tnum text-[38px] leading-none font-semibold tracking-tight sm:text-[44px] ${
            onDark ? 'text-white' : 'text-navy'
          }`}
        >
          {estimate.min}
        </motion.span>
        <span
          className={`tnum pb-1 text-[24px] leading-none font-medium ${
            onDark ? 'text-white/50' : 'text-ink-muted/60'
          }`}
        >
          –
        </span>
        <motion.span
          key={`max-${estimate.max}`}
          initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
          className={`tnum text-[38px] leading-none font-semibold tracking-tight sm:text-[44px] ${
            onDark ? 'text-white' : 'text-navy'
          }`}
        >
          {estimate.max}
        </motion.span>
        <span
          className={`pb-1.5 text-sm font-medium ${onDark ? 'text-white/60' : 'text-ink-muted'}`}
        >
          min
        </span>
      </div>

      {showPeopleAhead && (
        <div
          className={`mt-3.5 flex items-center gap-2 border-t pt-3.5 text-[13px] ${
            onDark ? 'border-white/10 text-white/70' : 'border-line text-ink-muted'
          }`}
        >
          <AnimatedNumber
            value={estimate.peopleAhead}
            className="font-semibold text-current"
          />
          <span>{estimate.peopleAhead === 1 ? 'person' : 'people'} ahead of you</span>
        </div>
      )}

      <p
        className={`mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed ${
          onDark ? 'text-white/55' : 'text-ink-muted'
        }`}
      >
        <Info aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2} />
        <span>
          A range, not a promise. It reflects the queue position and how much recent services at
          this desk have varied.
        </span>
      </p>
    </div>
  );
}

export { formatRange };