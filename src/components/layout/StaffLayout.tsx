import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQueue } from '../../context/QueueContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { IconButton } from '../ui/Button';
import { ActivityFeed } from '../queue/ActivityFeed';
import { formatRelativeTime } from '../../lib/queueEngine';
import { pageVariants } from '../motion/variants';
import { EmptyState } from '../ui/EmptyState';

/**
 * The staff application shell: collapsible sidebar, compact top bar, and
 * an animated content region that transitions between routes.
 */
export function StaffLayout() {
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const { events, state } = useQueue();
  const [navOpen, setNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const unreadCount = Math.min(9, events.filter((e) => Date.now() - e.timestamp < 120_000).length);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenNav={() => setNavOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          notificationCount={unreadCount}
        />

        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-5 sm:py-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Notification panel */}
      <AnimatePresence>
        {notificationsOpen && (
          <div className="fixed inset-0 z-[95]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setNotificationsOpen(false)}
              className="absolute inset-0 bg-navy/35 backdrop-blur-[2px]"
              aria-hidden
            />
            <motion.aside
              initial={reduceMotion ? { opacity: 0 } : { x: '100%' }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Notifications"
              className="absolute top-0 right-0 flex h-full w-[min(380px,90vw)] flex-col border-l border-line bg-white shadow-xl"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-navy">Notifications</h2>
                  <p className="text-[11.5px] text-ink-muted">Simulated queue events</p>
                </div>
                <IconButton
                  label="Close notifications"
                  onClick={() => setNotificationsOpen(false)}
                  variant="ghost"
                >
                  <X aria-hidden className="size-4.5" strokeWidth={2.2} />
                </IconButton>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {events.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title="Nothing to show yet"
                    description="Queue events will appear here as the demo runs."
                    compact
                  />
                ) : (
                  <ActivityFeed events={events} limit={20} />
                )}
              </div>
              <div className="shrink-0 border-t border-line px-4 py-3 text-[11.5px] text-ink-muted">
                Last updated {formatRelativeTime(state.lastUpdated)}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { pageVariants };