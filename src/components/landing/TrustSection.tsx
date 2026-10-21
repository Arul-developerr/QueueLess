import { Clock3, Eye, UserCheck } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '../motion/Reveal';

const PROMISES = [
  {
    icon: Eye,
    title: 'Transparent waiting estimates',
    body: 'A clear range, not a false promise. QueueLess shows why your wait changed and what it is based on.',
  },
  {
    icon: Clock3,
    title: 'Live queue progress',
    body: 'Your position, the service in progress, and the next steps update as the queue actually moves.',
  },
  {
    icon: UserCheck,
    title: 'Fewer missed turns',
    body: 'Call notifications and grace periods mean people know when to return — and fewer slots are wasted.',
  },
];

/**
 * Three concise product promises.
 * No customer logos, testimonials, or adoption numbers — nothing here is
 * presented as a real-world claim.
 */
export function TrustSection() {
  return (
    <section className="border-b border-line bg-canvas py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-teal uppercase">
            Why QueueLess
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            A queue you can actually see
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            Three things every waiting visitor should be able to know — and every service desk
            should be able to control.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {PROMISES.map((promise) => {
            const Icon = promise.icon;
            return (
              <RevealItem key={promise.title}>
                <div className="group h-full rounded-card border border-line bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="grid size-11 place-items-center rounded-[12px] bg-mint-soft text-teal transition-transform duration-300 group-hover:scale-105">
                    <Icon aria-hidden className="size-5" strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-5 text-[17px] font-semibold text-navy">{promise.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">{promise.body}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}