import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CircleSlash, Timer, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Reveal } from '../motion/Reveal';

type Scenario = 'baseline' | 'slow' | 'noshow' | 'join';

interface ScenarioState {
  /** Ordered token list shown in the mini queue. */
  tokens: string[];
  /** Estimated wait range for the highlighted visitor. */
  range: [number, number];
  peopleAhead: number;
  headline: string;
  detail: string;
}

const SCENARIO_COPY: Record<Scenario, { label: string; icon: typeof Timer; description: string }> = {
  baseline: {
    label: 'Current queue',
    icon: Timer,
    description: 'The queue as it stands right now.',
  },
  slow: {
    label: 'Service runs long',
    icon: Timer,
    description: 'A consultation takes 6 minutes longer than expected.',
  },
  noshow: {
    label: 'Visitor no-shows',
    icon: CircleSlash,
    description: 'One visitor does not check in and is recorded as a no-show.',
  },
  join: {
    label: 'New visitor joins',
    icon: UserPlus,
    description: 'Someone new checks in and takes a place at the back of the queue.',
  },
};

const STATES: Record<Scenario, ScenarioState> = {
  baseline: {
    tokens: ['QL-021', 'QL-022', 'QL-023', 'QL-024', 'QL-025'],
    range: [18, 26],
    peopleAhead: 3,
    headline: '18–26 min',
    detail: 'Based on 3 people ahead, 2 desks serving, and 12-minute average services.',
  },
  slow: {
    tokens: ['QL-021', 'QL-022', 'QL-023', 'QL-024', 'QL-025'],
    range: [24, 34],
    peopleAhead: 3,
    headline: '24–34 min',
    detail: 'A consultation ran 6 minutes long, so everyone behind it waits longer.',
  },
  noshow: {
    tokens: ['QL-021', 'QL-022', 'QL-024', 'QL-025'],
    range: [12, 19],
    peopleAhead: 2,
    headline: '12–19 min',
    detail: 'QL-023 did not check in. The slot was released and the queue moved forward.',
  },
  join: {
    tokens: ['QL-021', 'QL-022', 'QL-023', 'QL-024', 'QL-025', 'QL-026'],
    range: [21, 30],
    peopleAhead: 4,
    headline: '21–30 min',
    detail: 'QL-026 joined the queue, so one more person is now ahead of you.',
  },
};

/**
 * Interactive simulation showcase.
 *
 * The numbers here are a small, self-contained illustration of the same
 * ideas the real engine implements. Every value is labelled as simulated.
 */
export function SimulationShowcase() {
  const reduceMotion = useReducedMotion();
  const [scenario, setScenario] = useState<Scenario>('baseline');
  const state = STATES[scenario];

  return (
    <section id="simulation" className="scroll-mt-24 border-y border-line bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-teal uppercase">
            Live simulation
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Watch a queue respond
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            Trigger a scenario and see exactly how the queue order and the estimated waiting range
            change. This is a simplified illustration of the same model that runs behind the demo
            dashboard.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
          {/* Scenario controls */}
          <Reveal y={26}>
            <div className="rounded-card border border-line bg-canvas p-3">
              <p className="px-2 pt-1 pb-3 text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                Simulate an event
              </p>
              <div className="space-y-1.5" role="group" aria-label="Simulation scenarios">
                {(Object.keys(SCENARIO_COPY) as Scenario[]).map((key) => {
                  const copy = SCENARIO_COPY[key];
                  const Icon = copy.icon;
                  const isActive = key === scenario;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setScenario(key)}
                      aria-pressed={isActive}
                      className={`flex w-full items-start gap-3 rounded-[10px] px-3 py-3 text-left transition-colors duration-150 ${
                        isActive
                          ? 'bg-white shadow-sm ring-1 ring-teal/25'
                          : 'hover:bg-white/70'
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${
                          isActive ? 'bg-teal text-white' : 'bg-white text-ink-muted ring-1 ring-line'
                        }`}
                      >
                        <Icon aria-hidden className="size-3.5" strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-[13.5px] font-semibold ${
                            isActive ? 'text-navy' : 'text-ink'
                          }`}
                        >
                          {copy.label}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-muted">
                          {copy.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Simulation output */}
          <Reveal y={26} delay={0.1}>
            <div className="overflow-hidden rounded-card border border-line bg-white shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-teal" />
                  </span>
                  <span className="text-[13px] font-semibold text-navy">Harbour Point · Desk 1</span>
                </div>
                <Badge tone="amber">Simulated values</Badge>
              </div>

              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_260px]">
                {/* Queue order */}
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                    Queue order
                  </p>
                  <ul className="mt-3.5 space-y-2">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {state.tokens.map((token, index) => {
                        const isTarget = token === 'QL-024';
                        const isRemoved = scenario === 'noshow' && token === 'QL-023';
                        return (
                          <motion.li
                            key={token}
                            layout={reduceMotion ? false : 'position'}
                            initial={reduceMotion ? undefined : { opacity: 0, x: 12 }}
                            animate={{ opacity: isRemoved ? 0.4 : 1, x: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
                            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                            className={`flex items-center gap-3 rounded-[10px] border px-3 py-2.5 ${
                              isTarget
                                ? 'border-teal/40 bg-mint-soft'
                                : isRemoved
                                  ? 'border-coral/30 bg-coral/[0.06] line-through'
                                  : 'border-line'
                            }`}
                          >
                            <span className="tnum grid size-6 shrink-0 place-items-center rounded-md bg-navy/6 text-[11px] font-semibold text-ink-muted">
                              {index + 1}
                            </span>
                            <span
                              className={`tnum text-[13px] font-semibold ${
                                isTarget ? 'text-teal-700' : 'text-navy'
                              }`}
                            >
                              {token}
                            </span>
                            {isTarget && (
                              <span className="ml-auto rounded-full bg-teal px-2 py-0.5 text-[10px] font-semibold text-white">
                                You
                              </span>
                            )}
                            {isRemoved && (
                              <span className="ml-auto rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold text-white">
                                No-show
                              </span>
                            )}
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* Estimate panel */}
                <div className="rounded-[12px] border border-line bg-canvas p-4">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                    Your estimate
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={scenario}
                      initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="tnum mt-2.5 text-[34px] leading-none font-semibold tracking-tight text-navy">
                        {state.headline}
                      </p>
                      <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
                        {state.detail}
                      </p>
                      <div className="mt-4 border-t border-line pt-3">
                        <p className="flex items-center justify-between text-[12px]">
                          <span className="text-ink-muted">People ahead</span>
                          <span className="tnum font-semibold text-navy">{state.peopleAhead}</span>
                        </p>
                        <p className="mt-1.5 flex items-center justify-between text-[12px]">
                          <span className="text-ink-muted">Range width</span>
                          <span className="tnum font-semibold text-navy">
                            {state.range[1] - state.range[0]} min
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <p className="mt-4 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-muted">
                    <span className="mt-px shrink-0">▲</span>
                    Simulated illustration. The live demo applies this logic to the full queue
                    state.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal y={20} delay={0.15}>
          <div className="mt-8 flex flex-col items-start gap-3 rounded-card border border-line bg-canvas p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[15px] font-semibold text-navy">
                Try it with the real demo state
              </p>
              <p className="mt-1.5 text-[13.5px] text-ink-muted">
                Join a queue, then use the staff console to change it and watch the estimate move.
              </p>
            </div>
            <Link to="/join" className="shrink-0">
              <Button trailingIcon={<ArrowRight aria-hidden className="size-4" strokeWidth={2.4} />}>
                Join a queue
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}