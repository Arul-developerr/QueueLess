import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  /** Optional formatter; defaults to a rounded integer. */
  format?: (value: number) => string;
  className?: string;
  duration?: number;
}

/**
 * Animates between numeric values without a jarring layout jump.
 *
 * The element always reserves the width of the *current* string so the
 * surrounding layout never reflows while the number is counting.
 */
export function AnimatedNumber({
  value,
  format,
  className,
  duration = 0.5,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      previous.current = value;
      return undefined;
    }

    const from = previous.current;
    const to = value;
    previous.current = value;

    if (from === to) return undefined;

    const controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });

    frame.current = controls.time;
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  const text = format ? format(display) : String(Math.round(display));

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {text}
    </span>
  );
}