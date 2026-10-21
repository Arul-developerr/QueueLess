/**
 * Shared motion vocabulary.
 *
 * One set of easings and durations keeps the whole product feeling like a
 * single system rather than a collection of one-off effects.
 */

import type { Transition, Variants } from 'motion/react';

export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT_QUART = [0.76, 0, 0.24, 1] as const;

export const DUR = {
  fast: 0.18,
  base: 0.28,
  slow: 0.45,
  reveal: 0.7,
} as const;

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
  mass: 0.9,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 460,
  damping: 32,
  mass: 0.7,
};

/** Standard fade + rise used for section reveals. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

/** Parent variant that staggers its children. */
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

/** Page-level transition used by the router. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.base, ease: EASE_OUT_QUINT },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DUR.fast, ease: EASE_IN_OUT_QUART },
  },
};

/** Scroll-triggered reveal used across the marketing page. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.reveal, ease: EASE_OUT_EXPO },
  },
};

/** Standard viewport configuration for reveal animations. */
export const revealViewport = { once: true, amount: 0.25 } as const;