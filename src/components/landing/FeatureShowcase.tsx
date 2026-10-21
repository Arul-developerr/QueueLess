import { motion } from 'motion/react';
import {
  BarChart3,
  BellRing,
  Clock4,
  Gauge,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { Reveal } from '../motion/Reveal';
import { AnimatedNumber } from '../motion/AnimatedNumber';

interface Feature {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  /** Chooses the visual treatment for this feature. */
  layout: 'split-left' | 'split-right';
  visual: 'token' | 'estimate' | 'noshow' | 'ops' | 'analytics';
}

/**
 * Feature sections alternate their visual side so the page never repeats
 * the same card rhythm.
 */
const FEATURES: Feature[] = [
  {
    id: 'tokens',
    icon: Layers,
    eyebrow: 'Digital tokens',
    title: 'A queue number that lives on the screen',
    body: 'Every visitor gets a token, a position, and a place to look. No paper slips, no asking the front desk, and no "what number is mine?"',
    bullets: [
      'Instant token with the visitor’s name and service',
      'Live position derived from the real queue order',
      'A calm, readable screen that works on any phone',
    ],
    layout: 'split-left',
    visual: 'token',
  },
  {
    id: 'estimates',
    icon: Clock4,
    eyebrow: 'Adaptive wait-time estimates',
    title: 'A range that adapts to reality',
    body: 'QueueLess blends the queue position, the service in progress, and how long recent services actually took — then shows a range instead of a single misleading number.',
    bullets: [
      'Estimates recompute when services run long or finish early',
      'The range widens when service times are inconsistent',
      'Every factor behind the number is shown, not hidden',
    ],
    layout: 'split-right',
    visual: 'estimate',
  },
  {
    id: 'noshow',
    icon: BellRing,
    eyebrow: 'Smart no-show handling',
    title: 'Slots do not disappear quietly',
    body: 'When someone does not arrive, the queue moves on and everyone behind them gets a shorter estimate — with the reason shown in plain language.',
    bullets: [
      'Grace period before a visitor is marked as a no-show',
      'One-tap recording for reception teams',
      'Automatic recalculation for everyone still waiting',
    ],
    layout: 'split-left',
    visual: 'noshow',
  },
  {
    id: 'ops',
    icon: Gauge,
    eyebrow: 'Real-time staff operations',
    title: 'The service desk, in one workspace',
    body: 'Call the next visitor, start service, close it out, pause a desk — with valid state transitions that stop the wrong action from being taken.',
    bullets: [
      'Guarded transitions: no impossible actions offered',
      'Pause and resume desks when staffing changes',
      'A full activity trail of every queue event',
    ],
    layout: 'split-right',
    visual: 'ops',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    eyebrow: 'Queue analytics',
    title: 'See where the queue is actually losing time',
    body: 'Understand arrival patterns, service durations, and wait-time trends across the dataset — with every metric defined rather than implied.',
    bullets: [
      'Arrival patterns by hour and day',
      'Service-duration distribution by service type',
      'No-show and completion rates with clear definitions',
    ],
    layout: 'split-left',
    visual: 'analytics',
  },
];

function FeatureVisual({ kind }: { kind: Feature['visual'] }) {
  if (kind === 'token') {
    return (
      <div className="rounded-card border border-line bg-white p-6 shadow-xs">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
          Your token
        </p>
        <p className="tnum mt-3 text-5xl font-semibold tracking-tight text-navy">QL-024</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[10px] bg-canvas p-3">
            <p className="text-[10.5px] text-ink-muted">Position</p>
            <p className="tnum mt-1 text-xl font-semibold text-navy">#3</p>
          </div>
          <div className="rounded-[10px] bg-canvas p-3">
            <p className="text-[10.5px] text-ink-muted">Service</p>
            <p className="mt-1 text-sm font-semibold text-navy">Consult</p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-navy/8">
          <div className="h-full w-[62%] rounded-full bg-teal" />
        </div>
        <p className="mt-2 text-[11.5px] text-ink-muted">3 of 5 slots in the current run</p>
      </div>
    );
  }

  if (kind === 'estimate') {
    return (
      <div className="rounded-card border border-line bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            Estimated wait
          </p>
          <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10.5px] font-medium text-success">
            High confidence
          </span>
        </div>
        <p className="tnum mt-3 text-4xl font-semibold tracking-tight text-navy">
          14<span className="px-1 text-ink-muted/50">–</span>21
          <span className="ml-1.5 text-sm font-medium text-ink-muted">min</span>
        </p>
        <ul className="mt-5 space-y-2.5">
          {[
            { label: 'Queue position', value: '+9 min' },
            { label: 'Service in progress', value: '+4 min' },
            { label: '2 desks serving', value: '−6 min' },
          ].map((row) => (
            <li key={row.label} className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink-muted">{row.label}</span>
              <span className="tnum font-semibold text-navy">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (kind === 'noshow') {
    return (
      <div className="rounded-card border border-line bg-white p-6 shadow-xs">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
          Why your wait changed
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-[10px] border border-line p-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-coral/12 text-coral">
              <BellRing aria-hidden className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-navy">One visitor did not check in</p>
              <p className="text-[11.5px] text-ink-muted">QL-019 · recorded 2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[10px] bg-canvas p-3">
            <span className="text-[12.5px] text-ink-muted">Previous estimate</span>
            <span className="tnum text-[13px] font-medium text-ink-muted line-through">24–31 min</span>
          </div>
          <div className="flex items-center justify-between rounded-[10px] bg-mint-soft p-3">
            <span className="text-[12.5px] text-teal-700">Updated estimate</span>
            <span className="tnum text-[13px] font-semibold text-teal-700">18–25 min</span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'ops') {
    return (
      <div className="rounded-card border border-line bg-white p-5 shadow-xs">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
          Queue board
        </p>
        <div className="mt-4 space-y-2.5">
          {[
            { token: 'QL-025', state: 'In service', tone: 'bg-teal' },
            { token: 'QL-026', state: 'Called', tone: 'bg-amber' },
            { token: 'QL-027', state: 'Waiting', tone: 'bg-navy-600' },
            { token: 'QL-028', state: 'Waiting', tone: 'bg-navy-600' },
          ].map((row) => (
            <div key={row.token} className="flex items-center gap-3 rounded-[10px] border border-line p-2.5">
              <span className={`size-2 shrink-0 rounded-full ${row.tone}`} />
              <span className="tnum text-[13px] font-semibold text-navy">{row.token}</span>
              <span className="ml-auto text-[11.5px] text-ink-muted">{row.state}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-xs">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
        Wait time by hour
      </p>
      <div className="mt-5 flex h-28 items-end gap-2">
        {[28, 40, 62, 84, 96, 72, 44, 30].map((height, index) => (
          <div key={index} className="flex-1">
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${height}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full rounded-t-[4px] ${index === 4 ? 'bg-teal' : 'bg-teal/25'}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[10.5px] text-ink-muted">
        <span>08:00</span>
        <span>12:00</span>
        <span>16:00</span>
      </div>
      <p className="mt-4 text-[12.5px] text-ink-muted">
        Peak wait: <span className="tnum font-semibold text-navy">
          <AnimatedNumber value={22} />
        </span>{' '}
        min at 11:00
      </p>
    </div>
  );
}

export function FeatureShowcase() {
  return (
    <section id="features" className="scroll-mt-24 bg-canvas py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-teal uppercase">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Everything the queue needs, nothing it doesn&apos;t
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            Five connected capabilities that work from a single shared queue state.
          </p>
        </Reveal>

        <div className="mt-16 space-y-20 sm:space-y-24">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const visualFirst = feature.layout === 'split-right';
            return (
              <div
                key={feature.id}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <Reveal
                  className={visualFirst ? 'lg:order-2' : ''}
                  y={30}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] font-semibold text-teal">
                    <Icon aria-hidden className="size-3.5" strokeWidth={2.2} />
                    {feature.eyebrow}
                  </span>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-navy sm:text-[28px]">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{feature.body}</p>
                  <ul className="mt-6 space-y-3">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5">
                        <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-teal/12 text-teal">
                          <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <path d="M2 6.2l2.6 2.6L10 3.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="text-[14px] leading-relaxed text-ink">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>

                <Reveal className={visualFirst ? 'lg:order-1' : ''} y={30} delay={0.1}>
                  <FeatureVisual kind={feature.visual} />
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}