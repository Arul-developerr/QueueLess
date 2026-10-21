import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Features', href: '#features' },
      { label: 'For clinics', href: '#for-clinics' },
      { label: 'Live simulation', href: '#simulation' },
    ],
  },
  {
    heading: 'Demo',
    links: [
      { label: 'Join a queue', to: '/join' },
      { label: 'Staff dashboard', to: '/staff' },
      { label: 'Queue control', to: '/staff/queue' },
      { label: 'Wait-time intelligence', to: '/staff/forecast' },
      { label: 'Analytics', to: '/staff/analytics' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Analytics', to: '/staff/analytics' },
      { label: 'Settings', to: '/staff/settings' },
      { label: 'Queue control', to: '/staff/queue' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo size={30} />
            <p className="mt-4 text-[13.5px] leading-relaxed text-ink-muted">
              Predictive queue management that shows people where they stand and how long they will
              wait — before they are called.
            </p>
            <p className="mt-4 rounded-control border border-amber/20 bg-amber/[0.07] px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-700">
              QueueLess is a product demo. All visitors, tokens, durations, and statistics shown are
              simulated and do not describe real clinics or patients.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="text-[12px] font-semibold tracking-[0.12em] text-navy uppercase">
                {group.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={`${group.heading}-${link.label}`}>
                    {'to' in link && link.to ? (
                      <Link
                        to={link.to}
                        className="text-[13.5px] text-ink-muted transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={(link as { href: string }).href}
                        className="text-[13.5px] text-ink-muted transition-colors hover:text-ink"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-ink-muted">
            © {new Date().getFullYear()} QueueLess. A frontend-only product demonstration.
          </p>
          <p className="text-[12.5px] text-ink-muted">
            No backend, authentication, or messaging service is connected.
          </p>
        </div>
      </div>
    </footer>
  );
}