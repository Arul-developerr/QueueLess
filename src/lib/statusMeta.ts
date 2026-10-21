import type { QueueStatus, StatusMeta } from '../types/queue';

/**
 * Status labels are written so the meaning is clear without relying on colour
 * alone — every badge also carries a text label and, where useful, a short
 * description.
 */
export const STATUS_META: Record<QueueStatus, StatusMeta> = {
  waiting: {
    label: 'Waiting',
    description: 'Checked in and waiting to be called.',
    tone: 'neutral',
  },
  called: {
    label: 'Called',
    description: 'Token has been called — please proceed to the desk.',
    tone: 'amber',
  },
  'in-service': {
    label: 'In service',
    description: 'Service is currently under way.',
    tone: 'teal',
  },
  completed: {
    label: 'Completed',
    description: 'Service finished successfully.',
    tone: 'success',
  },
  'no-show': {
    label: 'No-show',
    description: 'Visitor did not arrive before the grace period ended.',
    tone: 'coral',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Queue entry was cancelled.',
    tone: 'navy',
  },
};

export const STATUS_ORDER: QueueStatus[] = [
  'waiting',
  'called',
  'in-service',
  'completed',
  'no-show',
  'cancelled',
];

export const EVENT_META: Record<string, { label: string; tone: StatusMeta['tone'] }> = {
  'checked-in': { label: 'Checked in', tone: 'neutral' },
  called: { label: 'Called', tone: 'amber' },
  'service-started': { label: 'Service started', tone: 'teal' },
  'service-completed': { label: 'Service completed', tone: 'success' },
  'no-show': { label: 'No-show', tone: 'coral' },
  cancelled: { label: 'Cancelled', tone: 'navy' },
  'estimate-recalculated': { label: 'Estimate updated', tone: 'teal' },
  'desk-paused': { label: 'Desk paused', tone: 'amber' },
  'desk-resumed': { label: 'Desk resumed', tone: 'teal' },
  'queue-joined': { label: 'Joined queue', tone: 'teal' },
};