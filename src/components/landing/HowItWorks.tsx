import { motion, useReducedMotion } from 'motion/react';
import { BellRing, CheckCircle2, Ticket } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '../motion/Reveal';

const STEPS = [
  {
    icon: Ticket,
    step: '01',
    title: 'Join your queue',
    body: 'Pick a service desk, choose what you need, and get a digital token instantly. No standing around to ask.',
    detail: 'Token issued in seconds',
  },
  {
    icon: CheckCircle2,
    step: '02',
    title: 'Track your estimated wait',
    body: 'See your position, how many people are ahead, and a realistic waiting range that updates as the queue moves.',
    detail: 'Range recalculated on every change',
  },
  {
    icon: BellRing,
    step: '03',
    title: 'Get ready when your turn approaches',
    body: 'A clear call signal tells you when to head over — so you keep the slot instead of missing it.',
    detail: 'Grace period protects your turn',
  },
];

/** Three-step process with animated connectors between the steps. */
export function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="scroll-mt-24 border-b border-line bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-teal uppercase">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Three steps, start to finish
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            From the moment you arrive to the moment you are called, everything you need is on one
            screen.
          </p>
        </Reveal>

        <div className="relative mt-16">
          {/* Animated connector */}
          <motion.div
            aria-hidden
            initial={reduceMotion ? undefined : { scaleX: 0 }}
            whileInView={reduceMotion ? undefined : { scaleX: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="absolute top-[38px] right-[16%] left-[16%] hidden h-px origin-left bg-gradient-to-r from-teal/0 via-teal/40 to-teal/0 lg:block"
          />

          <RevealGroup className="grid gap-10 lg:grid-cols-3 lg:gap-8" stagger={0.14}>
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <RevealItem key={step.step}>
                  <div className="relative text-center lg:text-left">
                    <div className="flex flex-col items-center lg:items-start">
                      <span className="relative grid size-[76px] place-items-center rounded-2xl border border-line bg-white shadow-sm">
                        <span className="grid size-[58px] place-items-center rounded-xl bg-navy text-mint">
                          <Icon aria-hidden className="size-6" strokeWidth={1.9} />
                        </span>
                        <span className="tnum absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-teal text-[11px] font-bold text-white ring-4 ring-white">
                          {step.step}
                        </span>
                      </span>
                    </div>

                    <h3 className="mt-6 text-[18px] font-semibold text-navy">{step.title}</h3>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">{step.body}</p>
                    <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-mint-soft px-2.5 py-1 text-[11.5px] font-medium text-teal-700">
                        <CheckCircle2 aria-hidden className="size-3" strokeWidth={2.4} />
                        {step.detail}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}