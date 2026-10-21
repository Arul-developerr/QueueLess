/**
 * Transparent, explainable wait-time model.
 *
 * The model is intentionally simple and fully deterministic so a reader can
 * follow the arithmetic. It is a *frontend demonstration* of a scheduling
 * approximation — not a validated clinical or operational forecasting system.
 *
 * Notation used in the comments below:
 *   n    number of visitors ahead of the target entry
 *   d    number of active (unpaused) service desks
 *   s    expected minutes of service per visitor
 *   v    observed standard deviation of service duration, in minutes
 *   r    minutes of service remaining on the desk currently serving someone
 */

import type {
  EstimateFactor,
  ForecastInputs,
  ProjectionPoint,
  QueueEntry,
  ServiceDesk,
  ServiceType,
  WaitEstimate,
} from '../types/queue';

/* ------------------------------------------------------------------ *
 * Basic statistics
 * ------------------------------------------------------------------ */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function stdDev(values: number[], fallback = 0): number {
  if (values.length < 2) return fallback;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/* ------------------------------------------------------------------ *
 * Queue ordering
 * ------------------------------------------------------------------ */

/** Entries that still occupy a place in the queue, in service order. */
export function isActiveStatus(status: QueueEntry['status']): boolean {
  return status === 'waiting' || status === 'called' || status === 'in-service';
}

/**
 * Queue position (1-based) for an entry, derived from actual ordering.
 * Entries already in service hold position 1; called-but-not-started
 * entries follow; everyone else is ordered by join sequence.
 */
export function queuePosition(entries: QueueEntry[], targetId: string): number {
  const active = entries
    .filter((e) => isActiveStatus(e.status))
    .sort((a, b) => {
      if (a.status === 'in-service' && b.status !== 'in-service') return -1;
      if (b.status === 'in-service' && a.status !== 'in-service') return 1;
      if (a.status === 'called' && b.status !== 'called') return -1;
      if (b.status === 'called' && a.status !== 'called') return 1;
      return a.sequence - b.sequence;
    });

  const index = active.findIndex((e) => e.id === targetId);
  return index === -1 ? 0 : index + 1;
}

/** Number of visitors ahead of the given entry. */
export function peopleAhead(entries: QueueEntry[], targetId: string): number {
  const position = queuePosition(entries, targetId);
  return position <= 0 ? 0 : position - 1;
}

/** The visitor currently being served, if any. */
export function currentServingEntry(entries: QueueEntry[]): QueueEntry | undefined {
  return entries.find((e) => e.status === 'in-service');
}

/** Entries waiting to be called, oldest first. */
export function waitingEntries(entries: QueueEntry[]): QueueEntry[] {
  return entries
    .filter((e) => e.status === 'waiting')
    .sort((a, b) => a.sequence - b.sequence);
}

/* ------------------------------------------------------------------ *
 * Service-duration statistics
 * ------------------------------------------------------------------ */

export interface ServiceStats {
  expectedMin: number;
  variabilityMin: number;
  sampleSize: number;
}

/**
 * Blends the configured baseline duration with recently observed durations.
 * With few samples the baseline dominates; as samples accumulate the observed
 * mean takes over. Variability is the sample standard deviation, floored so
 * the estimate never collapses to a falsely precise point.
 */
export function serviceStats(
  entries: QueueEntry[],
  serviceId: string,
  baselineMin: number,
  fallbackVariability: number,
): ServiceStats {
  const observed = entries
    .filter((e) => e.serviceId === serviceId && e.actualDurationMin !== null)
    .map((e) => e.actualDurationMin as number)
    .slice(-20);

  if (observed.length === 0) {
    return {
      expectedMin: baselineMin,
      variabilityMin: fallbackVariability,
      sampleSize: 0,
    };
  }

  const weight = clamp(observed.length / 8, 0, 1);
  const observedMean = mean(observed);
  const observedSd = stdDev(observed, fallbackVariability);

  return {
    expectedMin: baselineMin * (1 - weight) + observedMean * weight,
    variabilityMin: Math.max(fallbackVariability * 0.5, observedSd),
    sampleSize: observed.length,
  };
}

/* ------------------------------------------------------------------ *
 * The core estimate
 * ------------------------------------------------------------------ */

/**
 * Estimates how long `target` will wait before service begins.
 *
 * Model (single desk, d = 1):
 *   wait = n * s + r
 *
 * Model (multiple desks, d > 1):
 *   The workload ahead is spread across `d` desks. A visitor is expected to
 *   be served after roughly ceil(n / d) service slots, so:
 *   wait = ceil(n / d) * s * (1 + smallLoadPenalty) + r/d
 *   where the penalty reflects the chance that a given desk is still busy
 *   when the visitor's slot arrives. This is an approximation, not an
 *   exact schedule.
 */
export function estimateWait(params: {
  target: QueueEntry;
  entries: QueueEntry[];
  desks: ServiceDesk[];
  serviceTypes: Record<string, ServiceType>;
  noShowRate: number;
}): WaitEstimate {
  const { target, entries, desks, serviceTypes, noShowRate } = params;

  const service = serviceTypes[target.serviceId];
  const baseline = service?.baseDurationMin ?? 10;
  const fallbackVar = service?.variabilityMin ?? 3;

  const stats = serviceStats(entries, target.serviceId, baseline, fallbackVar);
  const expectedMin = Math.max(1, stats.expectedMin);
  const variability = Math.max(0.5, stats.variabilityMin);

  const activeDesks = desks.filter((d) => !d.isPaused);
  const deskCount = Math.max(1, activeDesks.length);

  const ahead = peopleAhead(entries, target.id);

  // The service currently in progress, if any, occupies a desk.
  const serving = currentServingEntry(entries);
  const remainingOnServing =
    serving && serving.deskId === target.deskId
      ? Math.max(0, expectedMin - serving.elapsedServiceMin)
      : serving
        ? Math.max(0, expectedMin - serving.elapsedServiceMin)
        : 0;

  // Effective number of visitors who will actually be served ahead of us.
  // The no-show assumption removes a share of the workload.
  const effectiveAhead = ahead * (1 - clamp(noShowRate, 0, 0.6));

  let expectedWait: number;
  if (deskCount === 1) {
    expectedWait = effectiveAhead * expectedMin + remainingOnServing;
  } else {
    const slots = Math.ceil(effectiveAhead / deskCount);
    // Load penalty: with many visitors relative to desks, slots are less
    // predictable, so we add a share of one service duration per slot.
    const loadRatio = effectiveAhead / deskCount;
    const loadPenalty = loadRatio > 0 ? Math.min(1, loadRatio / 12) * expectedMin * 0.35 : 0;
    expectedWait = slots * expectedMin + loadPenalty + remainingOnServing / deskCount;
  }

  expectedWait = Math.max(0, expectedWait);

  // --- Uncertainty band -------------------------------------------------
  // Each additional service slot adds another independent chance for the
  // service to run long, so the spread grows with the number of slots.
  const slotsAhead = deskCount === 1 ? effectiveAhead : Math.ceil(effectiveAhead / deskCount);
  const sigma = variability * Math.sqrt(Math.max(1, slotsAhead) + 0.5);
  // ~1.28 sigma keeps roughly 80% of simulated outcomes inside the band.
  // This is an explicitly chosen approximation, not a calibrated CI.
  const band = sigma * 1.28;

  const min = Math.max(0, expectedWait - band * 0.85);
  const max = expectedWait + band * 1.15;

  const uncertainty = expectedWait <= 0 ? 0 : clamp(band / Math.max(expectedWait, 1), 0, 1);
  const confidence: WaitEstimate['confidence'] =
    uncertainty < 0.25 ? 'high' : uncertainty < 0.55 ? 'moderate' : 'low';

  // --- Explainability ---------------------------------------------------
  const factors: EstimateFactor[] = [];
  factors.push({
    id: 'position',
    label: 'Queue position',
    impactMin: deskCount === 1 ? effectiveAhead * expectedMin : slotsAhead * expectedMin,
    detail: `${ahead} visitor${ahead === 1 ? '' : 's'} ahead of you in the queue.`,
  });
  if (serving) {
    factors.push({
      id: 'in-progress',
      label: 'Service in progress',
      impactMin: remainingOnServing / deskCount,
      detail: `A consultation at ${serving.token} is still running, with roughly ${Math.round(remainingOnServing)} minute${remainingOnServing === 1 ? '' : 's'} of service left.`,
    });
  }
  if (deskCount > 1) {
    factors.push({
      id: 'desks',
      label: 'Available service desks',
      impactMin: -(expectedWait - (effectiveAhead * expectedMin) / deskCount),
      detail: `${deskCount} desks are serving in parallel, which shortens the wait compared with a single desk.`,
    });
  }
  if (noShowRate > 0.01) {
    factors.push({
      id: 'no-show',
      label: 'No-show assumption',
      impactMin: -(ahead - effectiveAhead) * expectedMin,
      detail: `About ${Math.round(noShowRate * 100)}% of visitors ahead are assumed not to show up.`,
    });
  }
  factors.push({
    id: 'variability',
    label: 'Service-duration variability',
    impactMin: 0,
    detail: `Recent services at this desk averaged ${roundTo(expectedMin, 1)} minutes with about ${roundTo(variability, 1)} minutes of spread${stats.sampleSize > 0 ? ` across ${stats.sampleSize} sample${stats.sampleSize === 1 ? '' : 's'}` : ' (using the configured baseline)'}. This widens the range.`,
  });

  return {
    min: Math.round(min),
    max: Math.round(max),
    peopleAhead: ahead,
    expectedWaitMin: Math.round(expectedWait),
    expectedTotalMin: Math.round(expectedWait + expectedMin),
    uncertainty: roundTo(uncertainty, 2),
    confidence,
    factors,
  };
}

/* ------------------------------------------------------------------ *
 * Forecast projection
 * ------------------------------------------------------------------ */

/**
 * Builds a per-visitor projection of when each person ahead will be called.
 * Used by the forecast timeline.
 */
export function buildProjection(
  inputs: ForecastInputs,
  targetPosition: number,
  serviceLabel: string,
): ProjectionPoint[] {
  const { expectedServiceMin: s, variabilityMin: v, activeDesks: d } = inputs;
  const deskCount = Math.max(1, d);
  const points: ProjectionPoint[] = [];

  const total = Math.max(1, Math.min(targetPosition, 12));

  for (let i = 0; i < total; i += 1) {
    const slot = Math.floor(i / deskCount);
    const base = slot * s + (i % deskCount === 0 ? 0 : 0);
    const spread = v * Math.sqrt(slot + 1) * 1.28;
    points.push({
      label: i === 0 ? 'Now' : `+${i} ahead`,
      minutesFromNow: Math.round(base),
      band: {
        min: Math.max(0, Math.round(base - spread * 0.85)),
        max: Math.round(base + spread * 1.15),
      },
      isTarget: i === 0,
    });
  }

  points.push({
    label: 'Your call',
    minutesFromNow: Math.round(Math.max(0, (total - 1) * (s / deskCount))),
    band: {
      min: Math.max(0, Math.round((total - 1) * (s / deskCount) - v * 1.28 * 0.85)),
      max: Math.round((total - 1) * (s / deskCount) + v * 1.28 * 1.15),
    },
    isTarget: true,
  });

  void serviceLabel;
  return points;
}

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */

export function formatMinutes(min: number): string {
  const rounded = Math.max(0, Math.round(min));
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function formatRange(min: number, max: number): string {
  return `${Math.max(0, Math.round(min))}–${Math.max(0, Math.round(max))} min`;
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}