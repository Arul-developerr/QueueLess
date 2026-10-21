import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CircleAlert,
  CircleCheck,
  CircleDot,
  Clock,
  Hourglass,
  PauseCircle,
  PlayCircle,
  UserPlus,
  X,
} from 'lucide-react';
import type { QueueEvent } from '../../types/queue';

interface ActivityFeedProps {
  events: QueueEvent[];
  className?: string;
  limit?: number;
  emptyMessage?: string;
}

const EVENT_ICON: Record<string, typeof Clock> = {
  'checked-in': UserPlus,
  called: CircleDot,
  'service-started': PlayCircle,
  'service-completed': CircleCheck,
  'no-show': CircleAlert,
  cancelled: X,
  'estimate-recalculated': Hourglass,
  'desk-paused': PauseCircle,
  'desk-resumed': PlayCircle,
  'queue-joined': UserPlus,
};

const EVENT_TONE: Record<string, string> = {
  'checked-in': 'bg-navy/6 text-navy-600',
  called: 'bg-amber/12 text-amber',
  'service-started': 'bg-teal/10 text-teal',
  'service-completed': 'bg-success/12 text-success',
  'no-show': 'bg-coral/12 text-coral',
  cancelled: 'bg-navy/6 text-navy-600',
  'estimate-recalculated': 'bg-mint-soft text-teal-700',
  'desk-paused': 'bg-amber/12 text-amber',
  'desk-resumed': 'bg-teal/10 text-teal',
  'queue-joined': 'bg-mint-soft text-teal-700',
};

/**
 * Chronological event feed. New demo events animate in with a short,
 * restrained entrance so attention is drawn without noise.
 */
export function ActivityFeed({
  events,
  className = '',
  limit = 12,
  emptyMessage = 'No activity recorded yet.',
}: ActivityFeedProps) {
  const reduceMotion = useReducedMotion();
  const visible = events.slice(0, limit);

  if (visible.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-ink-muted">{emptyMessage}</p>
    );
  }

  return (
    <ol className={`relative ${className}`}>
      <AnimatePresence initial={false}>
        {visible.map((event, index) => {
          const Icon = EVENT_ICON[event.type] ?? Clock;
          const tone = EVENT_TONE[event.type] ?? 'bg-navy/6 text-navy-600';
          return (
            <motion.li
              key={event.id}
              layout={reduceMotion ? false : 'position'}
              initial={reduceMotion ? undefined : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex gap-3 pb-4 last:pb-0"
            >
              {index !== visible.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-8 bottom-0 left-[15px] w-px bg-line"
                />
              )}
              <span
                className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-white ${tone}`}
              >
                <Icon aria-hidden className="size-[15px]" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[13px] leading-snug text-ink">
                  {event.message}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-ink-muted">
                  <span className="tnum">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {event.token && <span className="tnum">· {event.token}</span>}
                  {event.isSimulated && (
                    <span className="rounded-full bg-amber/10 px-1.5 py-px text-[10px] font-medium text-amber">
                      Simulated
                    </span>
                  )}
                </p>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}