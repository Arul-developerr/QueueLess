import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect } from 'react';
import type { Toast } from '../../types/queue';

const TONE_STYLES = {
  success: {
    icon: CircleCheck,
    iconClass: 'text-success',
    bar: 'bg-success',
  },
  info: { icon: Info, iconClass: 'text-teal', bar: 'bg-teal' },
  warning: { icon: TriangleAlert, iconClass: 'text-amber', bar: 'bg-amber' },
  danger: { icon: CircleAlert, iconClass: 'text-coral', bar: 'bg-coral' },
  neutral: { icon: Info, iconClass: 'text-ink-muted', bar: 'bg-navy-600' },
} as const;

interface NotificationToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

/** Stacked toast notifications with smooth enter/exit. */
export function NotificationToast({ toasts, onDismiss }: NotificationToastProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[110] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[380px]"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const style = TONE_STYLES[toast.tone];
          const Icon = style.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-full overflow-hidden rounded-card border border-line bg-white shadow-lg"
            >
              <div className="flex items-start gap-3 p-3.5">
                <span className={`mt-0.5 shrink-0 ${style.iconClass}`}>
                  <Icon aria-hidden className="size-[18px]" strokeWidth={2.1} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="-m-1 grid size-7 shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                >
                  <X aria-hidden className="size-3.5" strokeWidth={2.2} />
                </button>
              </div>
              <div className={`h-0.5 w-full ${style.bar} opacity-70`} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** Convenience wrapper that auto-dismisses a single toast. */
export function SingleToast({
  toast,
  onDismiss,
}: {
  toast: Toast | null;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  return <NotificationToast toasts={toast ? [toast] : []} onDismiss={onDismiss} />;
}