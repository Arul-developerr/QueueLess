import type { ReactNode } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  children?: ReactNode;
}

/** Segmented filter control. Each option carries a visible text label. */
export function FilterBar({ options, value, onChange, label, className = '', children }: FilterBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div
        role="group"
        aria-label={label}
        className="inline-flex flex-wrap items-center gap-1 rounded-control border border-line bg-canvas p-1"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                active
                  ? 'bg-white text-navy shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {option.label}
              {option.count !== undefined && (
                <span
                  className={`tnum rounded-full px-1.5 py-px text-[11px] ${
                    active ? 'bg-teal/10 text-teal' : 'bg-navy/6 text-ink-muted'
                  }`}
                >
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {children}
    </div>
  );
}