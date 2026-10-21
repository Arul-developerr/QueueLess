import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppSettings,
  QueueEntry,
  QueueEvent,
  ServiceDesk,
  Toast,
  WaitEstimate,
} from '../types/queue';
import { SERVICE_TYPE_MAP } from '../data/demoData';
import { estimateWait, peopleAhead, queuePosition } from '../lib/queueEngine';
import {
  computeMetrics,
  createInitialState,
  observedNoShowRate,
  queueReducer,
  type DashboardMetrics,
  type QueueAction,
  type QueueState,
} from '../lib/queueReducer';

const STORAGE_KEY = 'queueless.demo.v1';

interface QueueContextValue {
  state: QueueState;
  dispatch: React.Dispatch<QueueAction>;
  metrics: DashboardMetrics;
  entries: QueueEntry[];
  events: QueueEvent[];
  desks: ServiceDesk[];
  settings: AppSettings;
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  /** Estimate for a given entry, or undefined when the entry is unknown. */
  getEstimate: (entryId: string) => WaitEstimate | undefined;
  getPosition: (entryId: string) => number;
  getPeopleAhead: (entryId: string) => number;
  findEntry: (token: string) => QueueEntry | undefined;
  noShowRate: number;
  /** Toggles and reads the automatic simulation ticker. */
  isSimulating: boolean;
  resetDemo: () => void;
}

const QueueContext = createContext<QueueContextValue | null>(null);

interface PersistedShape {
  entries: QueueEntry[];
  events: QueueEvent[];
  desks: ServiceDesk[];
  settings: AppSettings;
  tokenCounter: number;
  sequenceCounter: number;
  tick: number;
  savedAt: number;
}

function readPersisted(): PersistedShape | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedShape;
    if (!parsed || !Array.isArray(parsed.entries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function QueueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(queueReducer, undefined, () => createInitialState());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const hydrated = useRef(false);

  /* ---------------- Hydration from localStorage ---------------- */
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const persisted = readPersisted();
    if (!persisted) return;
    dispatch({
      type: 'hydrate',
      savedAt: persisted.savedAt,
      state: {
        entries: persisted.entries,
        events: persisted.events,
        desks: persisted.desks,
        settings: persisted.settings,
        tokenCounter: persisted.tokenCounter,
        sequenceCounter: persisted.sequenceCounter,
        tick: persisted.tick,
      },
    });
  }, []);

  /* ---------------- Persistence ---------------- */
  useEffect(() => {
    if (!hydrated.current) return;
    const payload: PersistedShape = {
      entries: state.entries,
      events: state.events,
      desks: state.desks,
      settings: state.settings,
      tokenCounter: state.tokenCounter,
      sequenceCounter: state.sequenceCounter,
      tick: state.tick,
      savedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage can be unavailable (private mode, quota). The demo still works.
    }
  }, [
    state.entries,
    state.events,
    state.desks,
    state.settings,
    state.tokenCounter,
    state.sequenceCounter,
    state.tick,
  ]);

  /* ---------------- Centralised simulation ticker ---------------- */
  const intervalMs = Math.max(4, state.settings.demoUpdateIntervalSec) * 1000;

  useEffect(() => {
    if (!state.isSimulating) return undefined;
    const timer = window.setInterval(() => {
      dispatch({ type: 'tick', deltaMin: 1 });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [state.isSimulating, intervalMs]);

  /* ---------------- Toast plumbing ---------------- */
  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    },
    [],
  );

  // Reducer-produced toasts are surfaced through the same toast channel.
  useEffect(() => {
    if (!state.pendingToast) return;
    const { id, ...rest } = state.pendingToast;
    setToasts((current) => (current.some((t) => t.id === id) ? current : [...current.slice(-3), { ...rest, id }]));
    dispatch({ type: 'clear-toast' });
  }, [state.pendingToast]);

  useEffect(() => {
    if (toasts.length === 0) return undefined;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), toast.durationMs),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [toasts, dismissToast]);

  /* ---------------- Derived values ---------------- */
  const metrics = useMemo(() => computeMetrics(state), [state]);
  const noShowRate = useMemo(() => observedNoShowRate(state.entries), [state.entries]);

  const estimateCache = useMemo(() => {
    const cache: Record<string, WaitEstimate> = {};
    for (const entry of state.entries) {
      if (entry.status === 'completed' || entry.status === 'no-show' || entry.status === 'cancelled') {
        continue;
      }
      cache[entry.id] = estimateWait({
        target: entry,
        entries: state.entries,
        desks: state.desks,
        serviceTypes: SERVICE_TYPE_MAP,
        noShowRate,
      });
    }
    return cache;
  }, [state.entries, state.desks, noShowRate]);

  const getEstimate = useCallback(
    (entryId: string) => estimateCache[entryId],
    [estimateCache],
  );

  const getPosition = useCallback(
    (entryId: string) => queuePosition(state.entries, entryId),
    [state.entries],
  );

  const getPeopleAhead = useCallback(
    (entryId: string) => peopleAhead(state.entries, entryId),
    [state.entries],
  );

  const findEntry = useCallback(
    (token: string) =>
      state.entries.find((e) => e.token.toLowerCase() === token.trim().toLowerCase()),
    [state.entries],
  );

  const resetDemo = useCallback(() => {
    dispatch({ type: 'reset-demo' });
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value: QueueContextValue = {
    state,
    dispatch,
    metrics,
    entries: state.entries,
    events: state.events,
    desks: state.desks,
    settings: state.settings,
    toasts,
    pushToast,
    dismissToast,
    getEstimate,
    getPosition,
    getPeopleAhead,
    findEntry,
    noShowRate,
    isSimulating: state.isSimulating,
    resetDemo,
  };

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue(): QueueContextValue {
  const context = useContext(QueueContext);
  if (!context) throw new Error('useQueue must be used inside a QueueProvider');
  return context;
}