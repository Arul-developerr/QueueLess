import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Button, IconButton } from '../ui/Button';
import { MARKETING_NAV } from './navItems';

/**
 * Sticky marketing navigation with a scroll-state transition and an
 * animated drawer on mobile.
 */
export function MarketingNav() {
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? 'border-b border-line bg-white/88 shadow-sm backdrop-blur-lg'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav
          className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-5 sm:h-[72px] sm:px-8"
          aria-label="Main"
        >
          <Link to="/" className="rounded-lg shrink-0">
            <Logo size={32} />
          </Link>

          <ul className="ml-4 hidden items-center gap-1 lg:flex">
            {MARKETING_NAV.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2.5">
            <Link
              to="/staff"
              className="hidden text-[13.5px] font-medium text-ink-muted transition-colors hover:text-ink sm:inline-flex"
            >
              Sign in
            </Link>
            <Link to="/staff" className="hidden sm:block">
              <Button variant="secondary" size="sm">
                Demo dashboard
              </Button>
            </Link>
            <Link to="/join" className="hidden sm:block">
              <Button size="sm" trailingIcon={<ArrowRight aria-hidden className="size-3.5" strokeWidth={2.4} />}>
                Join a queue
              </Button>
            </Link>

            <IconButton
              label="Open menu"
              onClick={() => setOpen(true)}
              variant="ghost"
              className="lg:hidden"
            >
              <Menu aria-hidden className="size-5" strokeWidth={2} />
            </IconButton>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]"
              aria-hidden
            />
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { y: '-100%' }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { y: '-100%' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="relative flex h-full flex-col bg-white"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
                <Logo size={30} />
                <IconButton label="Close menu" onClick={() => setOpen(false)} variant="ghost">
                  <X aria-hidden className="size-5" strokeWidth={2.2} />
                </IconButton>
              </div>

              <ul className="flex-1 overflow-y-auto p-4">
                {MARKETING_NAV.map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={reduceMotion ? undefined : { opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + index * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-line py-4 text-[17px] font-medium text-navy"
                    >
                      {item.label}
                    </a>
                  </motion.li>
                ))}
                <motion.li
                  initial={reduceMotion ? undefined : { opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.26, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to="/staff"
                    onClick={() => setOpen(false)}
                    className="block border-b border-line py-4 text-[17px] font-medium text-navy"
                  >
                    Demo dashboard
                  </Link>
                </motion.li>
              </ul>

              <div className="shrink-0 space-y-2.5 border-t border-line p-4">
                <Link to="/join" onClick={() => setOpen(false)} className="block">
                  <Button fullWidth size="lg" trailingIcon={<ArrowRight aria-hidden className="size-4" strokeWidth={2.4} />}>
                    Join a queue
                  </Button>
                </Link>
                <Link to="/staff" onClick={() => setOpen(false)} className="block">
                  <Button fullWidth size="lg" variant="secondary">
                    Sign in to demo dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}