import { FlaskConical } from 'lucide-react';
import type { ReactNode } from 'react';

interface DemoNoticeProps {
  children?: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
  compact?: boolean;
}

/**
 * Persistent, clearly-worded notice that the product is showing simulated
 * data. Used on every surface that displays queue values.
 */
export function DemoNotice({
  children = 'Demo data — every visitor, token, and duration shown here is simulated for the product demo. It is not live clinic data.',
  className = '',
  tone = 'light',
  compact = false,
}: DemoNoticeProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-control border px-3 ${
        compact ? 'py-2' : 'py-2.5'
      } ${
        tone === 'dark'
          ? 'border-white/12 bg-white/[0.05] text-white/65'
          : 'border-amber/20 bg-amber/[0.07] text-amber-700'
      } ${className}`}
      role="note"
    >
      <FlaskConical aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2} />
      <p className="text-[11.5px] leading-relaxed">{children}</p>
    </div>
  );
}