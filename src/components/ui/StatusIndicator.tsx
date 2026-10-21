import { STATUS_META } from '../../lib/statusMeta';
import type { QueueStatus } from '../../types/queue';
import { Badge, type BadgeTone } from './Badge';

const DOT_COLORS: Record<BadgeTone, string> = {
  neutral: 'bg-navy-600',
  teal: 'bg-teal',
  mint: 'bg-mint',
  amber: 'bg-amber',
  coral: 'bg-coral',
  success: 'bg-success',
  navy: 'bg-navy',
};

interface StatusIndicatorProps {
  status: QueueStatus;
  /** Shows the plain-language description beneath the label. */
  withDescription?: boolean;
  pulse?: boolean;
  className?: string;
}

/**
 * Status is communicated with a text label first, then colour and shape —
 * so the meaning is available without relying on colour alone.
 */
export function StatusIndicator({
  status,
  withDescription = false,
  pulse = false,
  className = '',
}: StatusIndicatorProps) {
  const meta = STATUS_META[status];
  const tone = meta.tone as BadgeTone;

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <Badge tone={tone} dot pulse={pulse && status === 'in-service'}>
        {meta.label}
      </Badge>
      {withDescription && (
        <span className="text-xs text-ink-muted">{meta.description}</span>
      )}
    </span>
  );
}

export { DOT_COLORS };