import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'px-4 py-8' : 'px-6 py-14'
      } ${className}`}
    >
      {Icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-canvas text-ink-muted">
          <Icon aria-hidden className="size-[22px]" strokeWidth={1.8} />
        </span>
      )}
      <h3 className="text-[15px] font-semibold text-navy">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}