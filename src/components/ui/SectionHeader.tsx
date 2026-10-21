import type { ReactNode } from 'react';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
  /** Renders the title at a large marketing scale. */
  size?: 'sm' | 'md' | 'lg';
}

const TITLE_SIZES = {
  sm: 'text-xl sm:text-2xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl lg:text-[2.75rem]',
} as const;

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className = '',
  size = 'md',
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${
        align === 'center' ? 'text-center sm:flex-col sm:items-center' : ''
      } ${className}`}
    >
      <div className={align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-teal uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className={`font-semibold text-navy ${TITLE_SIZES[size]}`}>{title}</h2>
        {description && (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}