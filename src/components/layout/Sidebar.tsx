import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { DemoNotice } from '../queue/DemoNotice';
import { STAFF_NAV } from './navItems';

interface SidebarProps {
  /** Mobile drawer state. */
  open: boolean;
  onClose: () => void;
}

/**
 * Collapsible desktop sidebar that becomes an animated drawer on small
 * screens. Navigation items carry `aria-current` from NavLink.
 */
export function Sidebar({ open, onClose }: SidebarProps) {
  const reduceMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
        <NavLink to="/" onClick={onClose} className="rounded-lg">
          <Logo size={30} withWordmark={!collapsed} />
        </NavLink>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-ink lg:hidden"
        >
          <X aria-hidden className="size-4.5" strokeWidth={2.2} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Staff sections">
        {!collapsed && (
          <p className="px-2 pb-2 text-[10.5px] font-semibold tracking-[0.14em] text-ink-muted uppercase">
            Workspace
          </p>
        )}
        <ul className="space-y-0.5">
          {STAFF_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-control px-2.5 py-2.5 text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-teal/8 text-teal-700'
                        : 'text-ink-muted hover:bg-canvas hover:text-ink'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active"
                          aria-hidden
                          className="absolute top-1/2 -left-3 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-teal"
                          transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )}
                      <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={2} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        {!collapsed ? (
          <DemoNotice compact>
            Simulated demo data. No real patient or clinic information is shown.
          </DemoNotice>
        ) : (
          <div
            className="grid size-9 place-items-center rounded-control bg-amber/10 text-amber"
            title="Simulated demo data"
          >
            <span className="text-[11px] font-bold">D</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`relative hidden shrink-0 border-r border-line bg-white transition-[width] duration-300 lg:block ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        <div className="sticky top-0 h-dvh">{content}</div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[70px] z-20 grid size-6 place-items-center rounded-full border border-line bg-white text-ink-muted shadow-sm transition-colors hover:text-ink"
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft aria-hidden className="size-3.5" strokeWidth={2.4} />
          </motion.span>
        </button>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[90] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]"
              aria-hidden
            />
            <motion.aside
              initial={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full w-[280px] max-w-[85vw] border-r border-line bg-white shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}