import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BellOff,
  ChevronRight,
  CircleSlash,
  Clock,
  Info,
  RefreshCw,
  Trash2,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { SERVICE_TYPE_MAP } from '../data/demoData';
import { formatClock, formatRelativeTime, formatRange } from '../lib/queueEngine';
import { Button, IconButton } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Logo } from '../components/ui/Logo';
import { QueueToken } from '../components/queue/QueueToken';
import { WaitEstimateCard } from '../components/queue/WaitEstimateCard';
import { QueueTimeline, type TimelineSlot } from '../components/queue/QueueTimeline';
import { ProgressBar } from '../components/queue/ProgressBar';
import { DemoNotice } from '../components/queue/DemoNotice';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusIndicator } from '../components/ui/StatusIndicator';

export default function QueueTrackingPage() {
  const reduceMotion = useReducedMotion();
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { findEntry, getEstimate, getPeopleAhead, dispatch, state, settings, pushToast } = useQueue();

  const entry = useMemo(() => findEntry(token), [findEntry, token]);
  const estimate = entry ? getEstimate(entry.id) : undefined;
  const peopleAhead = entry ? getPeopleAhead(entry.id) : 0;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(settings.notifyOnCalled);
  const [lastUpdated, setLastUpdated] = useState(state.lastUpdated);

  // Track the moment state last changed so the "updated" label is honest.
  useEffect(() => {
    setLastUpdated(state.lastUpdated);
  }, [state.lastUpdated]);

  const service = entry ? SERVICE_TYPE_MAP[entry.serviceId] : undefined;

  // Timeline: previous visitor, current service, upcoming, and this visitor.
  const slots = useMemo<TimelineSlot[]>(() => {
    if (!entry) return [];
    const active = state.entries
      .filter((e) => e.status === 'waiting' || e.status === 'called' || e.status === 'in-service')
      .sort((a, b) => {
        if (a.status === 'in-service' && b.status !== 'in-service') return -1;
        if (b.status === 'in-service' && a.status !== 'in-service') return 1;
        if (a.status === 'called' && b.status !== 'called') return -1;
        if (b.status === 'called' && a.status !== 'called') return 1;
        return a.sequence - b.sequence;
      });

    const index = active.findIndex((e) => e.id === entry.id);
    if (index === -1) {
      return active.slice(0, 5).map((e, i) => ({
        entry: e,
        position: i + 1,
        isTarget: false,
        label: i === 0 ? 'In service' : `Position ${i + 1}`,
      }));
    }

    const window = active.slice(Math.max(0, index - 3), index + 3);
    const offset = Math.max(0, index - 3);
    return window.map((e, i) => {
      const position = offset + i + 1;
      let label: string;
      if (e.id === entry.id) label = 'Your position';
      else if (e.status === 'in-service') label = 'In service now';
      else if (e.status === 'called') label = 'Called';
      else label = `Position ${position}`;
      return { entry: e, position, isTarget: e.id === entry.id, label };
    });
  }, [entry, state.entries]);

  const changes = useMemo(
    () => (entry ? state.estimateChanges.filter((c) => c.entryId === entry.id).slice(0, 4) : []),
    [entry, state.estimateChanges],
  );

  if (!entry || !estimate) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-5">
        <div className="w-full max-w-md">
          <EmptyState
            icon={CircleSlash}
            title="We could not find that token"
            description={`Token ${token.toUpperCase()} is not in the current demo queue. It may have been completed, cancelled, or reset.`}
            action={
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Link to="/join">
                  <Button>Join a queue</Button>
                </Link>
                <Link to="/staff">
                  <Button variant="secondary">Open staff demo</Button>
                </Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const isActive = entry.status !== 'completed' && entry.status !== 'cancelled';
  const isCalled = entry.status === 'called';

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1000px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="rounded-lg">
            <Logo size={30} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft aria-hidden className="size-3.5" strokeWidth={2.2} />
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-5 py-8 sm:px-8 sm:py-10">
        {/* Token header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-teal uppercase">
              Your queue
            </p>
            <div className="mt-3">
              <QueueToken token={entry.token} status={entry.status} size="xl" />
            </div>
            <p className="mt-3 text-[13.5px] text-ink-muted">
              {service?.name} · {state.settings.deskName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator status={entry.status} withDescription />
          </div>
        </div>

        {isCalled && (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-3 rounded-card border border-amber/30 bg-amber/[0.08] p-4"
            role="status"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber/15 text-amber">
              <Bell aria-hidden className="size-4.5" strokeWidth={2.1} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-navy">Your token has been called</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                Please proceed to {state.settings.deskName}. Your token is held for the grace period
                before it is released.
              </p>
            </div>
          </motion.div>
        )}

        {/* Main grid */}
        <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
          <div className="min-w-0 space-y-6">
            {/* Wait estimate */}
            <WaitEstimateCard estimate={estimate} />

            {/* Queue timeline */}
            <section className="rounded-card border border-line bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-navy">Queue progress</h2>
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    Your position within the current running order
                  </p>
                </div>
                <Badge tone="teal" dot>
                  <Users aria-hidden className="size-3" strokeWidth={2.4} />
                  {peopleAhead} ahead
                </Badge>
              </div>

              <div className="mt-5">
                <QueueTimeline slots={slots} />
              </div>

              {slots.length > 0 && (
                <div className="mt-6">
                  <ProgressBar
                    value={Math.max(1, slots.length - peopleAhead)}
                    max={Math.max(1, slots.length)}
                    label="Progress through this run"
                    tone="teal"
                    size="sm"
                  />
                </div>
              )}
            </section>

            {/* Why your wait changed */}
            <section className="rounded-card border border-line bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-navy">Why your wait changed</h2>
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    Each change to the queue, and what it did to your estimate
                  </p>
                </div>
                <IconButton
                  label="Refresh demo state"
                  onClick={() => {
                    dispatch({ type: 'recalculate' });
                    pushToast({
                      title: 'Demo state refreshed',
                      description: 'Estimates recalculated from the current queue.',
                      tone: 'success',
                      durationMs: 3400,
                    });
                  }}
                  variant="outline"
                >
                  <RefreshCw aria-hidden className="size-4" strokeWidth={2.1} />
                </IconButton>
              </div>

              {changes.length === 0 ? (
                <p className="mt-5 rounded-control border border-dashed border-line px-4 py-6 text-center text-[13px] leading-relaxed text-ink-muted">
                  Your estimate has not changed since you joined. When a service runs long, a
                  visitor is marked as a no-show, or a desk opens, the reason will appear here.
                </p>
              ) : (
                <ul className="mt-5 space-y-3">
                  <AnimatePresence initial={false}>
                    {changes.map((change) => {
                      const increased = change.deltaMin > 0;
                      return (
                        <motion.li
                          key={change.id}
                          layout={reduceMotion ? false : 'position'}
                          initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="rounded-control border border-line p-3.5"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                increased ? 'bg-coral/12 text-coral' : 'bg-success/12 text-success'
                              }`}
                            >
                              {increased ? (
                                <ArrowUpRight aria-hidden className="size-3" strokeWidth={2.6} />
                              ) : (
                                <ArrowDownRight aria-hidden className="size-3" strokeWidth={2.6} />
                              )}
                              {increased ? '+' : ''}
                              {change.deltaMin} min
                            </span>
                            <span className="text-[12.5px] font-semibold text-navy">
                              {change.headline}
                            </span>
                            <span className="tnum ml-auto text-[11.5px] text-ink-muted">
                              {formatRelativeTime(change.at)}
                            </span>
                          </div>

                          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px]">
                            <span className="tnum rounded-md bg-canvas px-2 py-1 text-ink-muted line-through">
                              {formatRange(change.previous.min, change.previous.max)}
                            </span>
                            <ChevronRight aria-hidden className="size-3 text-ink-muted" strokeWidth={2.4} />
                            <span className="tnum rounded-md bg-mint-soft px-2 py-1 font-semibold text-teal-700">
                              {formatRange(change.next.min, change.next.max)}
                            </span>
                          </div>

                          <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-muted">
                            {change.explanation}
                          </p>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </section>
          </div>

          {/* Side column */}
          <div className="min-w-0 space-y-6">
            {/* Details */}
            <section className="rounded-card border border-line bg-white p-5 shadow-xs">
              <h2 className="text-[15px] font-semibold text-navy">Queue details</h2>
              <dl className="mt-4 divide-y divide-line">
                {[
                  { label: 'Service', value: service?.name ?? '—' },
                  { label: 'Service desk', value: state.settings.deskName },
                  { label: 'Joined at', value: formatClock(entry.joinedAt) },
                  { label: 'Last updated', value: formatRelativeTime(lastUpdated) },
                  {
                    label: 'Position',
                    value: entry.status === 'in-service' ? 'Being served' : `Number ${peopleAhead + 1}`,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-[12.5px] text-ink-muted">{row.label}</dt>
                    <dd className="text-[13px] font-semibold text-navy">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                aria-expanded={detailsOpen}
                className="mt-4 flex w-full items-center justify-between rounded-control border border-line px-3.5 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-canvas"
              >
                <span>What affects your estimate</span>
                <ChevronRight
                  aria-hidden
                  className={`size-4 text-ink-muted transition-transform duration-200 ${
                    detailsOpen ? 'rotate-90' : ''
                  }`}
                  strokeWidth={2.2}
                />
              </button>

              <AnimatePresence initial={false}>
                {detailsOpen && (
                  <motion.ul
                    initial={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-4">
                      {estimate.factors.map((factor) => (
                        <li key={factor.id} className="rounded-control bg-canvas p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[12.5px] font-semibold text-navy">
                              {factor.label}
                            </span>
                            {Math.abs(factor.impactMin) >= 0.5 && (
                              <span className="tnum text-[12px] font-semibold text-ink-muted">
                                {factor.impactMin > 0 ? '+' : ''}
                                {Math.round(factor.impactMin)} min
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
                            {factor.detail}
                          </p>
                        </li>
                      ))}
                    </div>
                  </motion.ul>
                )}
              </AnimatePresence>
            </section>

            {/* Notification preferences */}
            <section className="rounded-card border border-line bg-white p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-mint-soft text-teal">
                  {notifyEnabled ? (
                    <Bell aria-hidden className="size-4.5" strokeWidth={2.1} />
                  ) : (
                    <BellOff aria-hidden className="size-4.5" strokeWidth={2.1} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[14px] font-semibold text-navy">Call notifications</h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                    This demo does not send SMS or push messages. The toggle only controls the
                    in-app notification panel.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notifyEnabled}
                onClick={() => {
                  const next = !notifyEnabled;
                  setNotifyEnabled(next);
                  dispatch({ type: 'update-settings', settings: { notifyOnCalled: next } });
                }}
                className={`mt-4 flex w-full items-center justify-between rounded-control border px-3.5 py-3 transition-colors ${
                  notifyEnabled ? 'border-teal/35 bg-mint-soft' : 'border-line bg-white'
                }`}
              >
                <span className="text-[13px] font-medium text-navy">
                  Notify me when my token is called
                </span>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    notifyEnabled ? 'bg-teal' : 'bg-navy/20'
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                    className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm ${
                      notifyEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            </section>

            {/* Actions */}
            <section className="rounded-card border border-line bg-white p-5 shadow-xs">
              <h2 className="text-[15px] font-semibold text-navy">Actions</h2>
              <div className="mt-4 space-y-2.5">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    dispatch({ type: 'recalculate' });
                  }}
                  icon={<RefreshCw aria-hidden className="size-4" strokeWidth={2.1} />}
                >
                  Refresh demo state
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setDetailsOpen(true)}
                  icon={<Info aria-hidden className="size-4" strokeWidth={2.1} />}
                >
                  View queue details
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/')}
                  icon={<ArrowLeft aria-hidden className="size-4" strokeWidth={2.1} />}
                >
                  Return to home
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  disabled={!isActive}
                  onClick={() => setCancelOpen(true)}
                  icon={<Trash2 aria-hidden className="size-4" strokeWidth={2.1} />}
                >
                  Cancel queue entry
                </Button>
                {!isActive && (
                  <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-muted">
                    <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2} />
                    This entry is already {entry.status === 'completed' ? 'completed' : 'closed'}, so it
                    can no longer be cancelled.
                  </p>
                )}
              </div>
            </section>

            <DemoNotice />
          </div>
        </div>
      </main>

      <ConfirmationDialog
        open={cancelOpen}
        title="Cancel your queue entry?"
        description={`${entry.token} will be removed from the queue and your estimated wait will no longer apply. You can join again at any time.`}
        confirmLabel="Cancel my entry"
        cancelLabel="Keep my place"
        tone="warning"
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          dispatch({ type: 'cancel-entry', entryId: entry.id });
          setCancelOpen(false);
          pushToast({
            title: 'Queue entry cancelled',
            description: `${entry.token} has been removed from the queue.`,
            tone: 'neutral',
            durationMs: 4000,
          });
        }}
      >
        <div className="rounded-control bg-canvas px-3 py-2.5">
          <p className="flex items-center gap-2 text-[12.5px] text-ink-muted">
            <Clock aria-hidden className="size-3.5" strokeWidth={2.1} />
            Current estimate:{' '}
            <span className="tnum font-semibold text-navy">
              {formatRange(estimate.min, estimate.max)}
            </span>
          </p>
        </div>
      </ConfirmationDialog>
    </div>
  );
}

