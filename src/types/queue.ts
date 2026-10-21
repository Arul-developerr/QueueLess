/**
 * QueueLess domain model.
 *
 * Every value in this file is either a synthetic demo constant or a type that
 * describes synthetic data. Nothing here is sourced from a real hospital,
 * clinic, or patient record.
 */

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

export type ServiceId =
  | 'general-consult'
  | 'blood-draw'
  | 'vaccination'
  | 'dental'
  | 'physiotherapy'
  | 'prescription-refill';

export type ClinicId = 'harbourpoint' | 'northgate' | 'riverside';

export type DeskId = string;

/** Lifecycle of a single queue entry. */
export type QueueStatus =
  | 'waiting'
  | 'called'
  | 'in-service'
  | 'completed'
  | 'no-show'
  | 'cancelled';

export type ServiceCategory = 'consultation' | 'procedure' | 'follow-up';

/* ------------------------------------------------------------------ *
 * Configuration
 * ------------------------------------------------------------------ */

export interface ServiceType {
  id: ServiceId;
  name: string;
  shortName: string;
  category: ServiceCategory;
  /** Baseline minutes of service, before observed variance is applied. */
  baseDurationMin: number;
  /** Observed spread of service durations, in minutes (one standard deviation). */
  variabilityMin: number;
  icon: string;
  description: string;
}

export interface Clinic {
  id: ClinicId;
  name: string;
  address: string;
  /** Synthetic coordinates used only for map-style presentation. */
  locality: string;
  hours: string;
  serviceIds: ServiceId[];
  accent: 'teal' | 'navy' | 'amber';
}

export interface ServiceDesk {
  id: DeskId;
  name: string;
  clinicId: ClinicId;
  isPaused: boolean;
  /** Minutes remaining on the service currently running at this desk. */
  activeEntryId: string | null;
}

export interface AppSettings {
  deskName: string;
  clinicId: ClinicId;
  estimatedServiceDurationMin: number;
  activeDeskCount: number;
  queueCapacity: number;
  noShowGraceMin: number;
  demoUpdateIntervalSec: number;
  motionScale: 'full' | 'reduced';
  notifyOnCalled: boolean;
  notifyOnEstimateChange: boolean;
  notifyOnNoShow: boolean;
  notificationsEnabled: boolean;
}

/* ------------------------------------------------------------------ *
 * Queue data
 * ------------------------------------------------------------------ */

export interface QueueEntry {
  id: string;
  /** Human-facing token, e.g. "QL-024". */
  token: string;
  visitorName: string;
  serviceId: ServiceId;
  deskId: DeskId;
  status: QueueStatus;
  /** Epoch milliseconds when the visitor joined the queue. */
  joinedAt: number;
  /** Epoch milliseconds when service actually began. */
  startedAt: number | null;
  /** Epoch milliseconds when service actually completed. */
  completedAt: number | null;
  /** Epoch milliseconds the token was called. */
  calledAt: number | null;
  /** Minutes of service already consumed, for in-service entries. */
  elapsedServiceMin: number;
  /** Total minutes of service observed, once completed. */
  actualDurationMin: number | null;
  /** Monotonic per-entry ordering key; drives queue position. */
  sequence: number;
  /** True when the entry was created by the demo simulator. */
  isSimulated: boolean;
  notes?: string;
}

export type QueueEventType =
  | 'checked-in'
  | 'called'
  | 'service-started'
  | 'service-completed'
  | 'no-show'
  | 'cancelled'
  | 'estimate-recalculated'
  | 'desk-paused'
  | 'desk-resumed'
  | 'queue-joined';

export interface QueueEvent {
  id: string;
  type: QueueEventType;
  entryId: string | null;
  token: string | null;
  visitorName: string | null;
  message: string;
  /** Minute delta applied to the affected visitor's estimate, if any. */
  deltaMin?: number;
  timestamp: number;
  isSimulated: boolean;
}

/* ------------------------------------------------------------------ *
 * Estimation
 * ------------------------------------------------------------------ */

export interface WaitEstimate {
  /** Lower bound of the estimated waiting range, in minutes. */
  min: number;
  /** Upper bound of the estimated waiting range, in minutes. */
  max: number;
  /** Number of visitors ahead of this entry in the queue. */
  peopleAhead: number;
  /** Expected minutes until service *begins*. */
  expectedWaitMin: number;
  /** Total expected minutes until service *ends*. */
  expectedTotalMin: number;
  /**
   * Breadth of the range as a fraction of the expected wait.
   * Higher means less confidence. Capped at 1.
   */
  uncertainty: number;
  /** Confidence label derived from `uncertainty`. */
  confidence: 'high' | 'moderate' | 'low';
  /** Human-readable factors that produced the estimate. */
  factors: EstimateFactor[];
}

export interface EstimateFactor {
  id: string;
  label: string;
  /** Signed contribution in minutes (negative = reduces the wait). */
  impactMin: number;
  detail: string;
}

export interface EstimateChange {
  id: string;
  entryId: string;
  token: string;
  at: number;
  previous: { min: number; max: number };
  next: { min: number; max: number };
  deltaMin: number;
  headline: string;
  explanation: string;
}

/* ------------------------------------------------------------------ *
 * Forecasting
 * ------------------------------------------------------------------ */

export interface ForecastInputs {
  expectedServiceMin: number;
  variabilityMin: number;
  peopleAhead: number;
  activeDesks: number;
  /** Probability (0-1) that a visitor ahead does not show up. */
  noShowRate: number;
  /** Minutes of service already consumed by the service in progress. */
  inProgressRemainingMin: number;
  /** 0-1 multiplier applied to every expected service duration. */
  serviceDurationFactor: number;
}

export interface ForecastScenario {
  id: 'current' | 'faster' | 'slower';
  label: string;
  description: string;
  inputs: ForecastInputs;
  result: WaitEstimate;
  /** Per-visitor projected call time, minutes from now. */
  projection: ProjectionPoint[];
}

export interface ProjectionPoint {
  label: string;
  /** Minutes from now when this visitor is expected to be called. */
  minutesFromNow: number;
  /** Lower/upper band of that call time. */
  band: { min: number; max: number };
  isTarget: boolean;
}

export interface ScenarioComparison {
  current: ForecastScenario;
  faster: ForecastScenario;
  slower: ForecastScenario;
  /** Factor-level explanation of what differs between scenarios. */
  drivers: ScenarioDriver[];
}

export interface ScenarioDriver {
  id: string;
  label: string;
  currentValue: string;
  alternativeValue: string;
  impactMin: number;
  direction: 'increase' | 'decrease' | 'neutral';
}

/* ------------------------------------------------------------------ *
 * Analytics
 * ------------------------------------------------------------------ */

export interface HistoricalVisit {
  id: string;
  token: string;
  visitorName: string;
  serviceId: ServiceId;
  deskId: DeskId;
  /** ISO date, e.g. "2026-10-14". */
  date: string;
  /** Hour of day, 0-23. */
  hour: number;
  joinedAtMin: number;
  calledAtMin: number;
  serviceStartedMin: number;
  serviceCompletedMin: number;
  waitMin: number;
  serviceMin: number;
  outcome: 'completed' | 'no-show' | 'cancelled';
}

export interface AnalyticsFilters {
  /** Inclusive ISO date. */
  from: string;
  /** Inclusive ISO date. */
  to: string;
  serviceIds: ServiceId[];
}

export interface AnalyticsSummary {
  totalVisits: number;
  completed: number;
  noShows: number;
  cancelled: number;
  averageWaitMin: number;
  medianWaitMin: number;
  averageServiceMin: number;
  medianServiceMin: number;
  completionRate: number;
  noShowRate: number;
  onTimeRate: number;
}

/* ------------------------------------------------------------------ *
 * Toasts
 * ------------------------------------------------------------------ */

export type ToastTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  durationMs: number;
}

/* ------------------------------------------------------------------ *
 * UI helpers
 * ------------------------------------------------------------------ */

export type DateRangeKey = '7d' | '14d' | '30d' | '90d';

export interface StatusMeta {
  label: string;
  /** Plain-language status so the meaning does not depend on colour alone. */
  description: string;
  tone: 'neutral' | 'teal' | 'amber' | 'coral' | 'success' | 'navy';
}