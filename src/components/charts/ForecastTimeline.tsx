import { motion, useReducedMotion } from 'motion/react';
import type { ProjectionPoint } from '../../types/queue';

interface ForecastTimelineProps {
  points: ProjectionPoint[];
  className?: string;
}

/**
 * Timeline of expected call times.
 * The band shows how much service-duration variability widens the range.
 */
export function ForecastTimeline({ points, className = '' }: ForecastTimelineProps) {
  const reduceMotion = useReducedMotion();
  if (points.length === 0) return null;

  const maxValue = Math.max(...points.map((p) => p.band.max), 1);

  return (
    <div className={className}>
      <div className="relative">
        {points.map((point, index) => {
          const left = (point.minutesFromNow / maxValue) * 100;
          const width = Math.max(2, ((point.band.max - point.band.min) / maxValue) * 100);
          const isTarget = point.isTarget;
          return (
            <div key={`${point.label}-${index}`} className="relative py-2.5">
              <div className="flex items-center gap-3">
                <span
                  className={`w-24 shrink-0 text-[12px] font-medium ${
                    isTarget ? 'text-teal-700' : 'text-ink-muted'
                  }`}
                >
                  {point.label}
                </span>

                <div className="relative h-7 flex-1 rounded-md bg-canvas">
                  {/* Baseline */}
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-px bg-navy/10"
                    style={{ left: `${left}%` }}
                  />
                  {/* Band */}
                  <motion.div
                    initial={reduceMotion ? undefined : { width: 0, opacity: 0 }}
                    animate={{ width: `${width}%`, opacity: 1 }}
                    transition={{
                      duration: 0.7,
                      delay: index * 0.07,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full ${
                      isTarget ? 'bg-teal' : 'bg-mint'
                    }`}
                    style={{ left: `${left}%` }}
                  />
                  {/* Point marker */}
                  <motion.span
                    initial={reduceMotion ? undefined : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.07 }}
                    className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${
                      isTarget ? 'bg-teal' : 'bg-navy-600'
                    }`}
                    style={{ left: `${left}%` }}
                  />
                </div>

                <span className="tnum w-24 shrink-0 text-right text-[12px] font-semibold text-navy">
                  {point.minutesFromNow} min
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-muted">
          <span className="size-2.5 rounded-full bg-mint" />
          Expected call range
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-muted">
          <span className="size-2.5 rounded-full bg-teal" />
          Your projected call
        </span>
        <span className="text-[11.5px] text-ink-muted">
          The band widens as more services are stacked ahead of you.
        </span>
      </div>
    </div>
  );
}