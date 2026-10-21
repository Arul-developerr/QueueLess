import { Search, X } from 'lucide-react';
import { useId, type ChangeEvent } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  className = '',
  autoFocus = false,
}: SearchInputProps) {
  const id = useId();

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
        strokeWidth={2}
      />
      <input
        id={id}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-control border border-line bg-white pr-9 pl-9 text-sm text-ink transition-colors placeholder:text-ink-muted/70 focus:border-teal focus:ring-2 focus:ring-teal/15 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 grid size-5 -translate-y-1/2 place-items-center rounded-md text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <X aria-hidden className="size-3.5" strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}