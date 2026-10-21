import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Removes the default body padding for edge-to-edge charts. */
  flush?: boolean;
  footnote?: string;
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className = '',
  flush = false,
  footnote,
}: ChartCardProps) {
  return (
    <section
      className={`flex flex-col rounded-card border border-line bg-white shadow-xs ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-navy">{title}</h3>
          {description && (
            <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-muted">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={flush ? 'flex-1 px-2 pb-3' : 'flex-1 px-5 pb-5'}>{children}</div>
      {footnote && (
        <p className="border-t border-line px-5 py-3 text-[11.5px] leading-relaxed text-ink-muted">
          {footnote}
        </p>
      )}
    </section>
  );
}