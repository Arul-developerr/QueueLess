import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, CircleDot, Clock, X } from 'lucide-react';
import type { QueueEntry, QueueStatus } from '../../types/queue';
import { SERVICE_TYPE_MAP } from '../../data/demoData';
import { formatClock } from '../../lib/queueEngine';

export interface TimelineSlot {
  entry: QueueEntry;
  position: number;
  isTarget: boolean;
  label: string;
}

interface QueueTimelineProps {
  slots: TimelineSlot[];
  className?: string;
}

const STATUS_ICON: Record<QueueStatus, typeof Check> = {
  waiting: Clock,
  called: CircleDot,
  'in-service': CircleDot,
  completed: Check,
  'no-show': X,
  cancelled: X,
};

const STATUS_STYLE: Record<QueueStatus, { ring: string; text: string; dot: string }> = {
  waiting: { ring: 'ring-line', text: 'text-ink-muted', dot: 'bg-navy-600' },
  called: { ring: 'ring-amber/40', text: 'text-amber', dot: 'bg-amber' },
  'in-service': { ring: 'ring-teal/40', text: 'text-teal', dot: 'bg-teal' },
  completed: { ring: 'ring-success/35', text: 'text-success', dot: 'bg-success' },
  'no-show': { ring: 'ring-coral/35', text: 'text-coral', dot: 'bg-coral' },
  cancelled: { ring: 'ring-line', text: 'text-ink-muted', dot: 'bg-navy-600' },
};

/**
 * Horizontal queue timeline showing who is where.
 * Entries animate into place when the ordering changes.
 */
export function QueueTimeline({ slots, className = '' }: QueueTimelineProps) {
  const reduceMotion = useReducedMotion();

  if (slots.length === 0) {
    return (
      <p className="rounded-control border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
        No one else is in the queue right now.
      </p>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Connector line */}
      <div
        aria-hidden
        className="absolute top-[18px] right-0 left-0 hidden h-px bg-line sm:block"
      />

      <ol className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:gap-3 sm:overflow-visible">
        <AnimatePresence mode="popLayout" initial={false}>
          {slots.map((slot) => {
            const service = SERVICE_TYPE_MAP[slot.entry.serviceId];
            const style = STATUS_STYLE[slot.entry.status];
            const Icon = STATUS_ICON[slot.entry.status];

            return (
              <motion.li
                key={slot.entry.id}
                layout={reduceMotion ? false : 'position'}
                initial={reduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="relative min-w-[132px] shrink-0 snap-start sm:min-w-0"
              >
                <div
                  className={`flex items-center gap-2.5 rounded-control border bg-white p-3 ${
                    slot.isTarget ? 'border-teal/45 shadow-sm ring-1 ring-teal/15' : 'border-line'
                  }`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full ring-1 ${style.ring}`}
                  >
                    <Icon aria-hidden className={`size-3.5 ${style.text}`} strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="tnum text-[13px] leading-tight font-semibold text-navy">
                      {slot.entry.token}
                    </p>
                    <p className="truncate text-[11.5px] text-ink-muted">
                      {service?.shortName ?? 'Service'}
                    </p>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-ink-muted">
                  {slot.label}
                  {slot.entry.calledAt && slot.entry.status === 'called'
                    ? ` · ${formatClock(slot.entry.calledAt)}`
                    : ''}
                </p>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}