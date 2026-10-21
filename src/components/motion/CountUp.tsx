import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
  durationMs?: number;
}

/**
 * Counts up to a value once the element scrolls into view.
 * Used for the marketing page's headline statistics.
 */
export function CountUp({ value, format, className, durationMs = 1100 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduceMotion) {
      setDisplay(value);
      return undefined;
    }
    if (started.current) return undefined;
    started.current = true;

    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, durationMs, reduceMotion]);

  const text = format ? format(display) : String(Math.round(display));

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {text}
    </span>
  );
}