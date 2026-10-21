import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bell, Menu, Pause, Play, RotateCcw, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Button, IconButton } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatRelativeTime } from '../../lib/queueEngine';

interface TopbarProps {
  onOpenNav: () => void;
  onOpenNotifications: () => void;
  notificationCount: number;
}

/** Compact top navigation with the simulated-live control. */
export function Topbar({ onOpenNav, onOpenNotifications, notificationCount }: TopbarProps) {
  const reduceMotion = useReducedMotion();
  const { state, dispatch, isSimulating } = useQueue();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="flex h-full items-center gap-3 px-4 sm:px-5">
        <IconButton
          label="Open navigation"
          onClick={onOpenNav}
          className="lg:hidden"
          variant="ghost"
        >
          <Menu aria-hidden className="size-5" strokeWidth={2} />
        </IconButton>

        <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
          <Search aria-hidden className="size-4 shrink-0 text-ink-muted" strokeWidth={2} />
          <span className="truncate text-[13px] text-ink-muted">
            {state.settings.deskName} · {state.settings.clinicId === 'harbourpoint' ? 'Harbour Point Medical Centre' : 'Demo clinic'}
          </span>
        </div>
        <div className="flex-1 sm:hidden" />

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'toggle-simulation' })}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 text-[12px] font-medium text-ink-muted transition-colors hover:border-teal/30 hover:text-ink"
            aria-pressed={isSimulating}
            title={isSimulating ? 'Pause the automatic demo ticker' : 'Resume the automatic demo ticker'}
          >
            <span className="relative flex size-2">
              {isSimulating && !reduceMotion && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal opacity-70" />
              )}
              <span
                className={`relative inline-flex size-2 rounded-full ${isSimulating ? 'bg-teal' : 'bg-navy-600'}`}
              />
            </span>
            <span className="hidden sm:inline">{isSimulating ? 'Simulated live' : 'Paused'}</span>
          </button>

          <IconButton
            label={notificationCount > 0 ? `Notifications (${notificationCount} new)` : 'Notifications'}
            onClick={onOpenNotifications}
            variant="ghost"
            className="relative"
          >
            <Bell aria-hidden className="size-[18px]" strokeWidth={2} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-coral text-[9px] font-bold text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </IconButton>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex h-9 items-center gap-2 rounded-control pl-1 pr-2 transition-colors hover:bg-canvas"
            >
              <span className="grid size-7.5 place-items-center rounded-full bg-teal text-[11px] font-bold text-white">
                AR
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-[12.5px] leading-tight font-semibold text-navy">
                  Alex Rowan
                </span>
                <span className="block text-[10.5px] leading-tight text-ink-muted">Reception</span>
              </span>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-card border border-line bg-white p-1.5 shadow-lg"
                >
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="text-[13px] font-semibold text-navy">Alex Rowan</p>
                    <p className="text-[11.5px] text-ink-muted">Reception · Demo account</p>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-[10.5px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                      Demo state
                    </p>
                    <p className="mt-1 text-[11.5px] text-ink-muted">
                      Updated {formatRelativeTime(state.lastUpdated)}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      dispatch({ type: 'reset-demo' });
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-ink transition-colors hover:bg-canvas"
                  >
                    <RotateCcw aria-hidden className="size-3.5" strokeWidth={2} />
                    Reset demo data
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      dispatch({ type: 'toggle-simulation' });
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-ink transition-colors hover:bg-canvas"
                  >
                    {isSimulating ? (
                      <Pause aria-hidden className="size-3.5" strokeWidth={2} />
                    ) : (
                      <Play aria-hidden className="size-3.5" strokeWidth={2} />
                    )}
                    {isSimulating ? 'Pause simulation' : 'Resume simulation'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Badge, Button };