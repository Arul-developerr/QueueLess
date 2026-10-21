import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Bell, Check, Clock, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QueueToken } from '../queue/QueueToken';
import { AnimatedNumber } from '../motion/AnimatedNumber';

/**
 * The hero's interactive queue preview.
 *
 * It is a live, self-contained mock of the token screen — it animates through
 * a small deterministic sequence so the hero feels alive without pretending
 * to be a real queue.
 */
export function HeroPreview() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = window.setInterval(() => setStep((s) => (s + 1) % 4), 3600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const states = [
    { position: 4, min: 18, max: 26, people: 3, status: 'waiting' as const, note: 'Desk 2 is running on time' },
    { position: 3, min: 14, max: 21, people: 2, status: 'waiting' as const, note: 'One visitor was a no-show' },
    { position: 2, min: 9, max: 14, people: 1, status: 'called' as const, note: 'A desk just became available' },
    { position: 2, min: 7, max: 11, people: 1, status: 'called' as const, note: 'Service started 3 minutes early' },
  ];
  const current = states[step];

  const timeline = [
    { label: 'Called', time: 'now', done: true },
    { label: 'In service', time: '~7 min', done: false },
    { label: 'Complete', time: '~18 min', done: false },
  ];

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 34, rotateX: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      style={{ transformPerspective: 1400 }}
      className="relative"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[48px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(94,234,212,0.22),transparent_70%)] blur-2xl"
      />

      <div className="overflow-hidden rounded-[20px] border border-white/12 bg-navy shadow-float">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-mint/60" />
          </span>
          <span className="ml-2 text-[11.5px] font-medium text-white/45">
            My queue · queueless.app
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-mint/12 px-2 py-0.5 text-[10px] font-medium text-mint">
            <span className="size-1.5 rounded-full bg-mint" />
            Live preview
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {/* Token header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-white/45 uppercase">
                Your token
              </p>
              <div className="mt-2">
                <QueueToken
                  token="QL-024"
                  status={current.status}
                  size="lg"
                  onDark
                />
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-medium tracking-[0.12em] text-white/45 uppercase">
                Position
              </p>
              <p className="tnum mt-1.5 text-3xl leading-none font-semibold text-white">
                #
                <AnimatedNumber value={current.position} className="ml-0.5" />
              </p>
            </div>
          </div>

          {/* Estimate */}
          <div className="mt-5 rounded-[14px] border border-white/12 bg-white/[0.05] p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/60">
                <Clock aria-hidden className="size-3.5" strokeWidth={2.2} />
                Estimated wait
              </span>
              <span className="rounded-full bg-mint/12 px-2 py-0.5 text-[10px] font-medium text-mint">
                Updated just now
              </span>
            </div>
            <p className="tnum mt-2.5 text-[40px] leading-none font-semibold tracking-tight text-white">
              <AnimatedNumber value={current.min} />
              <span className="px-1 text-white/40">–</span>
              <AnimatedNumber value={current.max} />
              <span className="ml-1.5 text-sm font-medium text-white/50">min</span>
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-white/55">
              <Users aria-hidden className="size-3.5" strokeWidth={2} />
              <span className="tnum">{current.people}</span>
              {current.people === 1 ? 'person' : 'people'} ahead of you
            </p>
          </div>

          {/* Progress timeline */}
          <div className="mt-5">
            <div className="relative flex items-start justify-between">
              <div className="absolute top-[7px] right-3 left-3 h-px bg-white/12" />
              {timeline.map((item) => (
                <div key={item.label} className="relative z-10 flex flex-col items-center gap-1.5">
                  <motion.span
                    animate={
                      item.done
                        ? { scale: [1, 1.14, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 1.6, repeat: item.done ? Infinity : 0 }}
                    className={`grid size-3.5 place-items-center rounded-full border-2 ${
                      item.done ? 'border-mint bg-mint' : 'border-white/25 bg-navy'
                    }`}
                  >
                    {item.done && <Check aria-hidden className="size-2 text-navy" strokeWidth={4} />}
                  </motion.span>
                  <span className={`text-[10.5px] font-medium ${item.done ? 'text-mint' : 'text-white/45'}`}>
                    {item.label}
                  </span>
                  <span className="tnum text-[10px] text-white/35">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notification */}
          <motion.div
            key={current.note}
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 flex items-start gap-2.5 rounded-[12px] border border-mint/20 bg-mint/[0.07] px-3.5 py-3"
          >
            <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
              <Bell aria-hidden className="size-3" strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-mint">Estimate updated</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/60">{current.note}</p>
            </div>
            <ArrowUpRight aria-hidden className="ml-auto size-3.5 shrink-0 text-white/30" strokeWidth={2.2} />
          </motion.div>
        </div>
      </div>

      {/* Floating stat card */}
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, x: 24, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}
        className="absolute -right-3 -bottom-5 hidden rounded-[14px] border border-line bg-white p-3.5 shadow-lg sm:block"
      >
        <p className="text-[10.5px] font-medium tracking-[0.1em] text-ink-muted uppercase">
          Queue length
        </p>
        <p className="tnum mt-1 text-2xl leading-none font-semibold text-navy">4</p>
        <p className="mt-1 text-[10.5px] text-success">↓ 2 in the last 10 min</p>
      </motion.div>
    </motion.div>
  );
}