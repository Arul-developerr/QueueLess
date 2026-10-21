/**
 * Single source of truth for all QueueLess demo state.
 *
 * Every screen (patient, staff, analytics) reads from this state, so a staff
 * action immediately changes what a patient sees and vice versa.
 */

import type {
  AppSettings,
  EstimateChange,
  QueueEntry,
  QueueEvent,
  QueueEventType,
  QueueStatus,
  ServiceDesk,
  ServiceId,
  Toast,
  WaitEstimate,
} from '../types/queue';
import { DEFAULT_SETTINGS, SERVICE_TYPE_MAP, createDemoSeed } from '../data/demoData';
import {
  currentServingEntry,
  estimateWait,
  mean,
  peopleAhead,
  queuePosition,
} from './queueEngine';

export interface QueueState {
  entries: QueueEntry[];
  events: QueueEvent[];
  desks: ServiceDesk[];
  settings: AppSettings;
  tokenCounter: number;
  sequenceCounter: number;
  estimateChanges: EstimateChange[];
  /** Timestamp of the most recent state mutation. */
  lastUpdated: number;
  /** True while the automatic demo ticker is running. */
  isSimulating: boolean;
  /** Counts simulation ticks; makes automatic events deterministic. */
  tick: number;
  /** Set when a manual action needs to raise a toast. */
  pendingToast: Toast | null;
}

export type QueueAction =
  | { type: 'join-queue'; visitorName: string; serviceId: ServiceId; deskId: string; token: string }
  | { type: 'call-next'; deskId: string }
  | { type: 'call-token'; entryId: string }
  | { type: 'start-service'; entryId: string }
  | { type: 'complete-service'; entryId: string }
  | { type: 'mark-no-show'; entryId: string }
  | { type: 'cancel-entry'; entryId: string }
  | { type: 'check-in'; entryId: string }
  | { type: 'recalculate' }
  | { type: 'pause-desk'; deskId: string }
  | { type: 'resume-desk'; deskId: string }
  | { type: 'simulate-slower'; entryId?: string }
  | { type: 'simulate-faster'; entryId?: string }
  | { type: 'simulate-no-show'; entryId?: string }
  | { type: 'simulate-join' }
  | { type: 'tick'; deltaMin: number }
  | { type: 'update-settings'; settings: Partial<AppSettings> }
  | { type: 'toggle-simulation' }
  | { type: 'reset-demo' }
  | { type: 'hydrate'; state: Partial<QueueState>; savedAt: number }
  | { type: 'clear-toast' };

/* ------------------------------------------------------------------ *
 * Status transition rules
 * ------------------------------------------------------------------ */

const TERMINAL: QueueStatus[] = ['completed', 'no-show', 'cancelled'];

/** Which transitions the operations console is allowed to perform. */
export const ALLOWED_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  waiting: ['called', 'in-service', 'no-show', 'cancelled'],
  called: ['in-service', 'no-show', 'cancelled', 'waiting'],
  'in-service': ['completed', 'cancelled'],
  completed: [],
  'no-show': [],
  cancelled: [],
};

export function canTransition(from: QueueStatus, to: QueueStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isTerminal(status: QueueStatus): boolean {
  return TERMINAL.includes(status);
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

export function observedNoShowRate(entries: QueueEntry[]): number {
  const settled = entries.filter((e) =>
    e.status === 'completed' || e.status === 'no-show' || e.status === 'cancelled',
  );
  if (settled.length < 4) return 0.08;
  const noShows = settled.filter((e) => e.status === 'no-show').length;
  return Math.min(0.45, noShows / settled.length);
}

function nextToken(counter: number): string {
  return `QL-${String(counter).padStart(3, '0')}`;
}

/** Monotonic counter so two events created in the same millisecond still
 *  receive distinct ids. */
let eventCounter = 0;

function makeEvent(
  state: QueueState,
  type: QueueEventType,
  entry: QueueEntry | null,
  message: string,
  isSimulated: boolean,
  deltaMin?: number,
): QueueEvent {
  return {
    id: `event-${(eventCounter += 1)}-${Date.now().toString(36)}`,
    type,
    entryId: entry?.id ?? null,
    token: entry?.token ?? null,
    visitorName: entry?.visitorName ?? null,
    message,
    deltaMin,
    timestamp: Date.now(),
    isSimulated,
  };
}

function withEvent(state: QueueState, event: QueueEvent): QueueEvent[] {
  return [event, ...state.events].slice(0, 200);
}/** Recomputes the estimate for every active entry and records what changed. */
function refreshEstimates(
  state: QueueState,
  previous: Record<string, { min: number; max: number }>,
): { entries: QueueEntry[]; changes: EstimateChange[]; estimates: Record<string, WaitEstimate> } {
  const noShowRate = observedNoShowRate(state.entries);
  const estimates: Record<string, WaitEstimate> = {};
  const changes: EstimateChange[] = [];

  const entries = state.entries.map((entry) => {
    if (isTerminal(entry.status)) return entry;
    const estimate = estimateWait({
      target: entry,
      entries: state.entries,
      desks: state.desks,
      serviceTypes: SERVICE_TYPE_MAP,
      noShowRate,
    });
    estimates[entry.id] = estimate;

    const before = previous[entry.id];
    if (before && Math.abs(before.max - estimate.max) >= 1) {
      const delta = estimate.expectedWaitMin - Math.round((before.min + before.max) / 2);
      changes.push({
        id: `change-${entry.id}-${Date.now().toString(36)}-${changes.length}`,
        entryId: entry.id,
        token: entry.token,
        at: Date.now(),
        previous: { min: before.min, max: before.max },
        next: { min: estimate.min, max: estimate.max },
        deltaMin: delta,
        headline:
          estimate.expectedWaitMin > (before.min + before.max) / 2
            ? 'Wait increased'
            : 'Wait decreased',
        explanation: buildExplanation(entry, estimate, delta, state),
      });
    }
    return entry;
  });

  return { entries, changes: changes.slice(0, 40), estimates };
}

function buildExplanation(
  entry: QueueEntry,
  estimate: WaitEstimate,
  delta: number,
  state: QueueState,
): string {
  const serving = currentServingEntry(state.entries);
  if (serving && serving.id !== entry.id) {
    return `A consultation at ${serving.token} is still in progress, so your estimate moved by about ${Math.abs(delta)} minute${Math.abs(delta) === 1 ? '' : 's'}.`;
  }
  const driver = estimate.factors.find((f) => Math.abs(f.impactMin) > 0.5);
  if (driver) {
    return `${driver.label} shifted your estimate by about ${Math.abs(delta)} minute${Math.abs(delta) === 1 ? '' : 's'}. ${driver.detail}`;
  }
  return `The queue ahead of you changed, moving your estimate by about ${Math.abs(delta)} minute${Math.abs(delta) === 1 ? '' : 's'}.`;
}

function snapshotEstimates(state: QueueState): Record<string, { min: number; max: number }> {
  const noShowRate = observedNoShowRate(state.entries);
  const snapshot: Record<string, { min: number; max: number }> = {};
  for (const entry of state.entries) {
    if (isTerminal(entry.status)) continue;
    const estimate = estimateWait({
      target: entry,
      entries: state.entries,
      desks: state.desks,
      serviceTypes: SERVICE_TYPE_MAP,
      noShowRate,
    });
    snapshot[entry.id] = { min: estimate.min, max: estimate.max };
  }
  return snapshot;
}

function syncDesksToSettings(desks: ServiceDesk[], activeCount: number): ServiceDesk[] {
  const target = Math.max(1, Math.min(desks.length, activeCount));
  return desks.map((desk, index) => ({ ...desk, isPaused: index >= target }));
}

function countActiveDesks(desks: ServiceDesk[]): number {
  return Math.max(1, desks.filter((d) => !d.isPaused).length);
}

/** Picks the next waiting entry for a desk, honouring join order. */
function nextWaitingFor(entries: QueueEntry[], deskId: string): QueueEntry | undefined {
  return entries
    .filter((e) => e.status === 'waiting' && e.deskId === deskId)
    .sort((a, b) => a.sequence - b.sequence)[0];
}

/* ------------------------------------------------------------------ *
 * Reducer
 * ------------------------------------------------------------------ */

export function createInitialState(now = Date.now()): QueueState {
  const seed = createDemoSeed({ now });
  return {
    entries: seed.entries,
    events: seed.events,
    desks: DESKS_INITIAL,
    settings: DEFAULT_SETTINGS,
    tokenCounter: seed.tokenCounter,
    sequenceCounter: seed.sequenceCounter,
    estimateChanges: [],
    lastUpdated: now,
    isSimulating: true,
    tick: 0,
    pendingToast: null,
  };
}

const DESKS_INITIAL: ServiceDesk[] = [
  { id: 'desk-1', name: 'Desk 1', clinicId: 'harbourpoint', isPaused: false, activeEntryId: null },
  { id: 'desk-2', name: 'Desk 2', clinicId: 'harbourpoint', isPaused: false, activeEntryId: null },
  { id: 'desk-3', name: 'Desk 3', clinicId: 'harbourpoint', isPaused: true, activeEntryId: null },
];export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'join-queue': {
      const now = Date.now();
      const entry: QueueEntry = {
        id: `entry-${now.toString(36)}-${state.sequenceCounter}`,
        token: action.token,
        visitorName: action.visitorName,
        serviceId: action.serviceId,
        deskId: action.deskId,
        status: 'waiting',
        joinedAt: now,
        startedAt: null,
        completedAt: null,
        calledAt: null,
        elapsedServiceMin: 0,
        actualDurationMin: null,
        sequence: state.sequenceCounter,
        isSimulated: false,
      };

      const before = snapshotEstimates(state);
      const nextState: QueueState = {
        ...state,
        entries: [...state.entries, entry],
        tokenCounter: state.tokenCounter + 1,
        sequenceCounter: state.sequenceCounter + 1,
        events: withEvent(
          state,
          makeEvent(state, 'checked-in', entry, `${entry.visitorName} joined the queue.`, false),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
      };
    }

    case 'call-next': {
      const desk = state.desks.find((d) => d.id === action.deskId);
      if (!desk || desk.isPaused || desk.activeEntryId) return state;
      const target = nextWaitingFor(state.entries, action.deskId);
      if (!target) return state;

      const before = snapshotEstimates(state);
      const now = Date.now();
      const entries = state.entries.map((e) =>
        e.id === target.id ? { ...e, status: 'called' as QueueStatus, calledAt: now } : e,
      );
      const desks = state.desks.map((d) =>
        d.id === action.deskId ? { ...d, activeEntryId: target.id } : d,
      );
      const nextState: QueueState = {
        ...state,
        entries,
        desks,
        events: withEvent(
          state,
          makeEvent(state, 'called', target, `${target.token} was called to ${desk.name}.`, false),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${now.toString(36)}`,
          title: `${target.token} called`,
          description: `${target.visitorName} has been called to ${desk.name}.`,
          tone: 'info',
          durationMs: 4200,
        },
      };
    }

    case 'call-token': {
      const target = state.entries.find((e) => e.id === action.entryId);
      if (!target || target.status !== 'waiting') return state;
      const desk = state.desks.find((d) => d.id === target.deskId);
      if (!desk || desk.isPaused || desk.activeEntryId) return state;

      const before = snapshotEstimates(state);
      const now = Date.now();
      const entries = state.entries.map((e) =>
        e.id === target.id ? { ...e, status: 'called' as QueueStatus, calledAt: now } : e,
      );
      const desks = state.desks.map((d) =>
        d.id === target.deskId ? { ...d, activeEntryId: target.id } : d,
      );
      const nextState: QueueState = {
        ...state,
        entries,
        desks,
        events: withEvent(
          state,
          makeEvent(state, 'called', target, `${target.token} was called to ${desk.name}.`, false),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${now.toString(36)}`,
          title: `${target.token} called`,
          description: `${target.visitorName} has been called to ${desk.name}.`,
          tone: 'info',
          durationMs: 4200,
        },
      };
    }

    case 'check-in': {
      const target = state.entries.find((e) => e.id === action.entryId);
      if (!target || target.status !== 'called') return state;
      const before = snapshotEstimates(state);
      const entries = state.entries.map((e) =>
        e.id === target.id ? { ...e, status: 'waiting' as QueueStatus, calledAt: null } : e,
      );
      const nextState: QueueState = {
        ...state,
        entries,
        events: withEvent(
          state,
          makeEvent(state, 'checked-in', target, `${target.token} returned to the waiting queue.`, false),
        ),
        lastUpdated: Date.now(),
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
      };
    }

    case 'start-service': {
      const target = state.entries.find((e) => e.id === action.entryId);
      if (!target || !canTransition(target.status, 'in-service')) return state;
      const before = snapshotEstimates(state);
      const now = Date.now();
      const entries = state.entries.map((e) =>
        e.id === target.id
          ? { ...e, status: 'in-service' as QueueStatus, startedAt: now, elapsedServiceMin: 0 }
          : e,
      );
      const nextState: QueueState = {
        ...state,
        entries,
        events: withEvent(
          state,
          makeEvent(state, 'service-started', target, `Service started for ${target.token}.`, false),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
      };
    }    case 'complete-service': {
      const target = state.entries.find((e) => e.id === action.entryId);
      if (!target || !canTransition(target.status, 'completed')) return state;
      const before = snapshotEstimates(state);
      const now = Date.now();
      const duration = Math.max(1, Math.round(target.elapsedServiceMin));

      let entries = state.entries.map((e) =>
        e.id === target.id
          ? {
              ...e,
              status: 'completed' as QueueStatus,
              completedAt: now,
              actualDurationMin: duration,
            }
          : e,
      );

      const desks = state.desks.map((d) =>
        d.id === target.deskId ? { ...d, activeEntryId: null } : d,
      );
      const nextOnDesk = nextWaitingFor(entries, target.deskId);
      if (nextOnDesk) {
        entries = entries.map((e) =>
          e.id === nextOnDesk.id ? { ...e, status: 'called' as QueueStatus, calledAt: now } : e,
        );
        const deskIndex = desks.findIndex((d) => d.id === target.deskId);
        if (deskIndex >= 0) {
          desks[deskIndex] = { ...desks[deskIndex], activeEntryId: nextOnDesk.id };
        }
      }

      const nextState: QueueState = {
        ...state,
        entries,
        desks,
        events: withEvent(
          state,
          makeEvent(
            state,
            'service-completed',
            target,
            `Service completed for ${target.token} in ${duration} minute${duration === 1 ? '' : 's'}.`,
            false,
          ),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
      };
    }

    case 'mark-no-show': {
      const target = state.entries.find((e) => e.id === action.entryId);
      if (!target || !canTransition(target.status, 'no-show')) return state;
      const before = snapshotEstimates(state);
      const now = Date.now();
      const entries = state.entries.map((e) =>
        e.id === target.id ? { ...e, status: 'no-show' as QueueStatus, completedAt: now } : e,
      );
      const desks = state.desks.map((d) =>
        d.id === target.deskId && d.activeEntryId === target.id ? { ...d, activeEntryId: null } : d,
      );
      const nextState: QueueState = {
        ...state,
        entries,
        desks,
        events: withEvent(
          state,
          makeEvent(state, 'no-show', target, `${target.token} was recorded as a no-show.`, false),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${now.toString(36)}`,
          title: `${target.token} marked as no-show`,
          description: 'The queue has been recalculated for everyone behind them.',
          tone: 'warning',
          durationMs: 4200,
        },
      };
    }

    case 'cancel-entry': {
      const target = state.entries.find((e) => e.id === action.entryId);
      if (!target || !canTransition(target.status, 'cancelled')) return state;
      const before = snapshotEstimates(state);
      const now = Date.now();
      const entries = state.entries.map((e) =>
        e.id === target.id ? { ...e, status: 'cancelled' as QueueStatus, completedAt: now } : e,
      );
      const desks = state.desks.map((d) =>
        d.id === target.deskId && d.activeEntryId === target.id ? { ...d, activeEntryId: null } : d,
      );
      const nextState: QueueState = {
        ...state,
        entries,
        desks,
        events: withEvent(
          state,
          makeEvent(state, 'cancelled', target, `${target.token} was cancelled.`, false),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${now.toString(36)}`,
          title: `${target.token} cancelled`,
          description: 'The queue has been recalculated.',
          tone: 'neutral',
          durationMs: 4200,
        },
      };
    }    case 'recalculate': {
      const before = snapshotEstimates(state);
      const nextState: QueueState = {
        ...state,
        events: withEvent(
          state,
          makeEvent(
            state,
            'estimate-recalculated',
            null,
            'Wait estimates recalculated across the queue.',
            false,
          ),
        ),
        lastUpdated: Date.now(),
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${Date.now().toString(36)}`,
          title: 'Estimates recalculated',
          description: 'Every waiting visitor now has a refreshed estimate.',
          tone: 'success',
          durationMs: 3600,
        },
      };
    }

    case 'pause-desk': {
      const desk = state.desks.find((d) => d.id === action.deskId);
      if (!desk || desk.isPaused) return state;
      const before = snapshotEstimates(state);
      const desks = state.desks.map((d) =>
        d.id === action.deskId ? { ...d, isPaused: true, activeEntryId: null } : d,
      );
      const nextState: QueueState = {
        ...state,
        desks,
        settings: { ...state.settings, activeDeskCount: countActiveDesks(desks) },
        events: withEvent(
          state,
          makeEvent(state, 'desk-paused', null, `${desk.name} was paused.`, false),
        ),
        lastUpdated: Date.now(),
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${Date.now().toString(36)}`,
          title: `${desk.name} paused`,
          description: 'Estimates now assume one fewer desk is serving.',
          tone: 'warning',
          durationMs: 3800,
        },
      };
    }

    case 'resume-desk': {
      const desk = state.desks.find((d) => d.id === action.deskId);
      if (!desk || !desk.isPaused) return state;
      const before = snapshotEstimates(state);
      const desks = state.desks.map((d) =>
        d.id === action.deskId ? { ...d, isPaused: false } : d,
      );
      const nextState: QueueState = {
        ...state,
        desks,
        settings: { ...state.settings, activeDeskCount: countActiveDesks(desks) },
        events: withEvent(
          state,
          makeEvent(state, 'desk-resumed', null, `${desk.name} resumed serving.`, false),
        ),
        lastUpdated: Date.now(),
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${Date.now().toString(36)}`,
          title: `${desk.name} resumed`,
          description: 'Estimates now assume one more desk is serving.',
          tone: 'success',
          durationMs: 3800,
        },
      };
    }    /* ---------------- Simulation ---------------- */

    case 'simulate-slower': {
      const serving = currentServingEntry(state.entries);
      if (!serving) return state;
      const extra = 6;
      const before = snapshotEstimates(state);
      const entries = state.entries.map((e) =>
        e.id === serving.id ? { ...e, elapsedServiceMin: e.elapsedServiceMin + extra } : e,
      );
      const nextState: QueueState = {
        ...state,
        entries,
        events: withEvent(
          state,
          makeEvent(
            state,
            'estimate-recalculated',
            serving,
            `A consultation at ${serving.token} ran ${extra} minutes longer than expected.`,
            true,
            extra,
          ),
        ),
        lastUpdated: Date.now(),
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${Date.now().toString(36)}`,
          title: 'Simulated: service ran long',
          description: `A consultation took ${extra} extra minutes. Waiting times increased.`,
          tone: 'warning',
          durationMs: 4200,
        },
      };
    }

    case 'simulate-faster': {
      const serving = currentServingEntry(state.entries);
      if (!serving) return state;
      const before = snapshotEstimates(state);
      const now = Date.now();
      const duration = Math.max(1, Math.round(serving.elapsedServiceMin));
      let entries = state.entries.map((e) =>
        e.id === serving.id
          ? {
              ...e,
              status: 'completed' as QueueStatus,
              completedAt: now,
              actualDurationMin: duration,
            }
          : e,
      );
      const desks = state.desks.map((d) =>
        d.id === serving.deskId ? { ...d, activeEntryId: null } : d,
      );
      const nextOnDesk = nextWaitingFor(entries, serving.deskId);
      if (nextOnDesk) {
        entries = entries.map((e) =>
          e.id === nextOnDesk.id ? { ...e, status: 'called' as QueueStatus, calledAt: now } : e,
        );
        const idx = desks.findIndex((d) => d.id === serving.deskId);
        if (idx >= 0) desks[idx] = { ...desks[idx], activeEntryId: nextOnDesk.id };
      }
      const nextState: QueueState = {
        ...state,
        entries,
        desks,
        events: withEvent(
          state,
          makeEvent(
            state,
            'service-completed',
            serving,
            `A consultation at ${serving.token} finished early.`,
            true,
          ),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${now.toString(36)}`,
          title: 'Simulated: service finished early',
          description: 'The desk moved on and waiting times dropped.',
          tone: 'success',
          durationMs: 4200,
        },
      };
    }

    case 'simulate-no-show': {
      const candidates = state.entries.filter(
        (e) => e.status === 'waiting' || e.status === 'called',
      );
      if (candidates.length === 0) return state;
      const target = candidates[0];
      const before = snapshotEstimates(state);
      const now = Date.now();
      const entries = state.entries.map((e) =>
        e.id === target.id ? { ...e, status: 'no-show' as QueueStatus, completedAt: now } : e,
      );
      const desks = state.desks.map((d) =>
        d.id === target.deskId && d.activeEntryId === target.id ? { ...d, activeEntryId: null } : d,
      );
      const nextState: QueueState = {
        ...state,
        entries,
        desks,
        events: withEvent(
          state,
          makeEvent(state, 'no-show', target, `${target.token} did not check in.`, true),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${now.toString(36)}`,
          title: 'Simulated: no-show recorded',
          description: 'One visitor did not check in, so the queue moved forward.',
          tone: 'info',
          durationMs: 4200,
        },
      };
    }

    case 'simulate-join': {
      const names = [
        'Jordan Ellis',
        'Samir Haddad',
        'Elena Duarte',
        'Mika Anderson',
        'Ravi Menon',
        'Chloe Bennett',
        'Yusuf Karim',
      ];
      const serviceIds = ['general-consult', 'blood-draw', 'vaccination', 'dental'];
      const now = Date.now();
      const name = names[state.tick % names.length];
      const serviceId = serviceIds[(state.tick + 1) % serviceIds.length];
      const deskId = state.desks.find((d) => !d.isPaused)?.id ?? state.desks[0].id;

      const entry: QueueEntry = {
        id: `entry-sim-${now.toString(36)}`,
        token: nextToken(state.tokenCounter),
        visitorName: name,
        serviceId: serviceId as ServiceId,
        deskId,
        status: 'waiting',
        joinedAt: now,
        startedAt: null,
        completedAt: null,
        calledAt: null,
        elapsedServiceMin: 0,
        actualDurationMin: null,
        sequence: state.sequenceCounter,
        isSimulated: true,
      };

      const before = snapshotEstimates(state);
      const nextState: QueueState = {
        ...state,
        entries: [...state.entries, entry],
        tokenCounter: state.tokenCounter + 1,
        sequenceCounter: state.sequenceCounter + 1,
        events: withEvent(
          state,
          makeEvent(state, 'queue-joined', entry, `${name} joined the queue.`, true),
        ),
        lastUpdated: now,
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
        pendingToast: {
          id: `toast-${now.toString(36)}`,
          title: 'Simulated: new visitor joined',
          description: `${name} received ${entry.token} and joined the queue.`,
          tone: 'info',
          durationMs: 4200,
        },
      };
    }    case 'tick': {
      // Advance service time for anything in service, then run one
      // deterministic automatic scenario every few ticks.
      const before = snapshotEstimates(state);
      const now = Date.now();
      const nextTick = state.tick + 1;

      let entries = state.entries.map((e) =>
        e.status === 'in-service'
          ? { ...e, elapsedServiceMin: e.elapsedServiceMin + action.deltaMin }
          : e,
      );

      let desks = state.desks.map((d) => ({ ...d }));
      let events = state.events;

      // Auto-complete services that have run past their expected duration.
      for (const entry of entries.filter((e) => e.status === 'in-service')) {
        const service = SERVICE_TYPE_MAP[entry.serviceId];
        const expected = service?.baseDurationMin ?? 10;
        if (entry.elapsedServiceMin >= expected) {
          entries = entries.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: 'completed' as QueueStatus,
                  completedAt: now,
                  actualDurationMin: Math.round(entry.elapsedServiceMin),
                }
              : e,
          );
          desks = desks.map((d) =>
            d.id === entry.deskId ? { ...d, activeEntryId: null } : d,
          );
          events = withEvent(
            { ...state, events },
            makeEvent(state, 'service-completed', entry, `Service completed for ${entry.token}.`, true),
          );
        }
      }

      // Pull the next waiting visitor onto any freed desk.
      for (const desk of desks.filter((d) => !d.isPaused && !d.activeEntryId)) {
        const next = nextWaitingFor(entries, desk.id);
        if (next) {
          entries = entries.map((e) =>
            e.id === next.id ? { ...e, status: 'called' as QueueStatus, calledAt: now } : e,
          );
          const idx = desks.findIndex((d) => d.id === desk.id);
          desks[idx] = { ...desks[idx], activeEntryId: next.id };
          events = withEvent(
            { ...state, events },
            makeEvent(state, 'called', next, `${next.token} was called to ${desk.name}.`, true),
          );
        }
      }

      const intermediate: QueueState = {
        ...state,
        entries,
        desks,
        events,
        tick: nextTick,
        lastUpdated: now,
      };

      // Every third tick injects a visible scenario event.
      if (nextTick % 3 === 0) {
        if (nextTick % 2 === 0 && currentServingEntry(intermediate.entries)) {
          return queueReducer(intermediate, { type: 'simulate-slower' });
        }
        return queueReducer(intermediate, { type: 'simulate-join' });
      }

      const refreshed = refreshEstimates(intermediate, before);
      return {
        ...intermediate,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
      };
    }

    case 'update-settings': {
      const settings: AppSettings = { ...state.settings, ...action.settings };
      const desks = syncDesksToSettings(state.desks, settings.activeDeskCount);
      const before = snapshotEstimates(state);
      const nextState: QueueState = {
        ...state,
        settings,
        desks,
        lastUpdated: Date.now(),
      };
      const refreshed = refreshEstimates(nextState, before);
      return {
        ...nextState,
        entries: refreshed.entries,
        estimateChanges: [...refreshed.changes, ...state.estimateChanges].slice(0, 40),
      };
    }

    case 'toggle-simulation':
      return { ...state, isSimulating: !state.isSimulating, lastUpdated: Date.now() };

    case 'reset-demo': {
      const fresh = createInitialState();
      return {
        ...fresh,
        settings: state.settings,
        isSimulating: state.isSimulating,
        pendingToast: {
          id: `toast-${Date.now().toString(36)}`,
          title: 'Demo data reset',
          description: 'The queue, event feed, and history are back to their starting state.',
          tone: 'success',
          durationMs: 4000,
        },
      };
    }

    case 'hydrate': {
      const merged: QueueState = {
        ...state,
        ...action.state,
        settings: { ...state.settings, ...(action.state.settings ?? {}) },
        pendingToast: null,
      };
      // Re-anchor in-flight services to wall-clock time so a page refresh
      // does not freeze the simulation.
      const minutesElapsed = Math.max(0, (Date.now() - action.savedAt) / 60_000);
      const entries = merged.entries.map((e) =>
        e.status === 'in-service'
          ? { ...e, elapsedServiceMin: e.elapsedServiceMin + minutesElapsed }
          : e,
      );
      return { ...merged, entries };
    }

    case 'clear-toast':
      return { ...state, pendingToast: null };

    default:
      return state;
  }
}/* ------------------------------------------------------------------ *
 * Derived selectors
 * ------------------------------------------------------------------ */

export interface DashboardMetrics {
  waitingCount: number;
  inServiceCount: number;
  calledCount: number;
  completedCount: number;
  noShowRate: number;
  medianWaitMin: number;
  averageServiceMin: number;
  averageWaitMin: number;
  capacityUsed: number;
  capacity: number;
}

/**
 * Dashboard metrics are always derived from the current entries — never from
 * a separately maintained counter — so the numbers can never drift from the
 * underlying queue.
 */
export function computeMetrics(state: QueueState): DashboardMetrics {
  const active = state.entries.filter((e) => e.status === 'waiting' || e.status === 'called');
  const completed = state.entries.filter((e) => e.status === 'completed');
  const durations = completed
    .map((e) => e.actualDurationMin)
    .filter((v): v is number => v !== null);

  // Estimated waits for everyone currently queued, used for the median.
  const waits: number[] = [];
  for (const entry of active) {
    const service = SERVICE_TYPE_MAP[entry.serviceId];
    const baseline = service?.baseDurationMin ?? 10;
    const ahead = peopleAhead(state.entries, entry.id);
    waits.push(ahead * baseline);
  }
  waits.sort((a, b) => a - b);
  const medianWait = waits.length
    ? waits.length % 2 === 0
      ? (waits[waits.length / 2 - 1] + waits[waits.length / 2]) / 2
      : waits[Math.floor(waits.length / 2)]
    : 0;

  return {
    waitingCount: active.length,
    inServiceCount: state.entries.filter((e) => e.status === 'in-service').length,
    calledCount: state.entries.filter((e) => e.status === 'called').length,
    completedCount: completed.length,
    noShowRate: observedNoShowRate(state.entries),
    medianWaitMin: Math.round(medianWait),
    averageServiceMin: durations.length ? Math.round(mean(durations)) : 0,
    averageWaitMin: waits.length ? Math.round(mean(waits)) : 0,
    capacityUsed: active.length,
    capacity: state.settings.queueCapacity,
  };
}

export function entryPosition(state: QueueState, entryId: string): number {
  return queuePosition(state.entries, entryId);
}