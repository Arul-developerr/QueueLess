import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

/**
 * Accessible modal dialog: focus is trapped, Escape closes, and the
 * background is inert to pointer interaction while open.
 */
export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
  children,
}: ConfirmationDialogProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 40);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onCancel]);

  const toneStyles = {
    danger: { icon: 'bg-coral/12 text-coral', button: 'danger' as const },
    warning: { icon: 'bg-amber/12 text-amber', button: 'primary' as const },
    primary: { icon: 'bg-teal/10 text-teal', button: 'primary' as const },
  }[tone];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            className="absolute inset-0 bg-navy/45 backdrop-blur-[3px]"
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-card"
          >
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close dialog"
              className="absolute top-4 right-4 grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <X aria-hidden className="size-4" strokeWidth={2.2} />
            </button>

            <div className="flex gap-4">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${toneStyles.icon}`}>
                <TriangleAlert aria-hidden className="size-5" strokeWidth={2} />
              </span>
              <div className="min-w-0 pr-6">
                <h2 id="confirm-title" className="text-base font-semibold text-navy">
                  {title}
                </h2>
                <p id="confirm-description" className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {description}
                </p>
                {children && <div className="mt-4">{children}</div>}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button ref={confirmRef} variant={toneStyles.button} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}