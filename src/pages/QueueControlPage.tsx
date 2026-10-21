import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CircleSlash,
  Clock,
  FastForward,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Timer,
  UserX,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { SERVICE_TYPE_MAP } from '../data/demoData';
import { canTransition } from '../lib/queueReducer';
import { queuePosition } from '../lib/queueEngine';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { DemoNotice } from '../components/queue/DemoNotice';
import { StatusIndicator } from '../components/ui/StatusIndicator';

type ConfirmKind = 'cancel' | 'no-show' | null;

interface ConfirmTarget {
  kind: ConfirmKind;
  entryId: string;
  token: string;
  name: string;
}

const COLUMNS = [
  { key: 'waiting', title: 'Waiting', description: 'Checked in, not yet called' },
  { key: 'called', title: 'Ready to be called', description: 'Called, waiting at the desk' },
  { key: 'in-service', title: 'In service', description: 'Currently being served' },
  { key: 'completed', title: 'Completed', description: 'Service finished' },
] as const;

export default function QueueControlPage() {
  const reduceMotion = useReducedMotion();
  const { entries, desks, dispatch, state, getEstimate } = useQueue();
  const [confirm, setConfirm] = useState<ConfirmTarget | null>(null);

  const grouped = useMemo(() => {
    const result: Record<string, typeof entries> = {
      waiting: [],
      called: [],
      'in-service': [],
      completed: [],
    };
    for (const entry of entries) {
      const key = entry.status as keyof typeof result;
      if (key in result) result[key].push(entry);
    }
    // Re-sort each column by queue order.
    for (const key of Object.keys(result)) {
      result[key].sort((a, b) => {
        if (key === 'completed') {
          return (b.completedAt ?? 0) - (a.completedAt ?? 0);
        }
        return queuePosition(entries, a.id) - queuePosition(entries, b.id);
      });
    }
    return result;
  }, [entries]);

  const openConfirm = (kind: ConfirmKind, entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    setConfirm({ kind, entryId, token: entry.token, name: entry.visitorName });
  };

  const handleTableAction = (entryId: string, action: 'call' | 'start' | 'complete' | 'no-show' | 'cancel') => {
    if (action === 'no-show') {
      openConfirm('no-show', entryId);
      return;
    }
    if (action === 'cancel') {
      openConfirm('cancel', entryId);
      return;
    }
    if (action === 'call') dispatch({ type: 'call-token', entryId });
    if (action === 'start') dispatch({ type: 'start-service', entryId });
    if (action === 'complete') dispatch({ type: 'complete-service', entryId });
  };

  const confirmAction = () => {
    if (!confirm) return;
    if (confirm.kind === 'no-show') dispatch({ type: 'mark-no-show', entryId: confirm.entryId });
    if (confirm.kind === 'cancel') dispatch({ type: 'cancel-entry', entryId: confirm.entryId });
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Queue control"
        description="Move visitors through the queue. Actions that are not valid for a visitor's current state are disabled rather than hidden."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'recalculate' })}
              icon={<RefreshCw aria-hidden className="size-4" strokeWidth={2.1} />}
            >
              Recalculate
            </Button>
            <Button
              onClick={() => dispatch({ type: 'simulate-join' })}
              icon={<Plus aria-hidden className="size-4" strokeWidth={2.4} />}
            >
              Simulate new arrival
            </Button>
          </>
        }
      />

      {/* Event simulation panel */}
      <section className="rounded-card border border-amber/25 bg-amber/[0.05] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-navy">Event simulation</h2>
            <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-muted">
              These buttons inject a <strong className="font-semibold text-amber-700">simulated</strong>{' '}
              event into the live queue. They are deterministic — pressing the same button twice produces the
              same kind of change — and every effect is written to the activity log.
            </p>
          </div>
          <Badge tone="amber" dot>
            Demo controls
          </Badge>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: 'simulate-slower' })}
            icon={<Timer aria-hidden className="size-4" strokeWidth={2.1} />}
          >
            Service runs long
          </Button>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: 'simulate-faster' })}
            icon={<FastForward aria-hidden className="size-4" strokeWidth={2.1} />}
          >
            Service finishes early
          </Button>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: 'simulate-no-show' })}
            icon={<UserX aria-hidden className="size-4" strokeWidth={2.1} />}
          >
            Visitor becomes a no-show
          </Button>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: 'simulate-join' })}
            icon={<Plus aria-hidden className="size-4" strokeWidth={2.2} />}
          >
            New visitor joins
          </Button>
        </div>
      </section>

      {/* Desk controls */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {desks.map((desk) => {
          const active = !desk.isPaused;
          const queueForDesk = entries.filter(
            (e) => e.deskId === desk.id && e.status === 'waiting',
          ).length;
          return (
            <div key={desk.id} className="rounded-card border border-line bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[14px] font-semibold text-navy">{desk.name}</h3>
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">
                    {active ? `${queueForDesk} waiting in this queue` : 'Desk is paused'}
                  </p>
                </div>
                <Badge tone={active ? 'teal' : 'amber'} dot={active}>
                  {active ? 'Serving' : 'Paused'}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!active || desk.activeEntryId !== null}
                  onClick={() => dispatch({ type: 'call-next', deskId: desk.id })}
                  icon={<Play aria-hidden className="size-3" strokeWidth={2.4} />}
                >
                  Call next
                </Button>
                {active ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => dispatch({ type: 'pause-desk', deskId: desk.id })}
                    icon={<Pause aria-hidden className="size-3" strokeWidth={2.4} />}
                  >
                    Pause desk
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => dispatch({ type: 'resume-desk', deskId: desk.id })}
                    icon={<Play aria-hidden className="size-3" strokeWidth={2.4} />}
                  >
                    Resume desk
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Visual queue board */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-navy">Queue board</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Live view of where every visitor currently sits in the flow
            </p>
          </div>
          <span className="tnum text-[12px] text-ink-muted">
            {state.entries.filter((e) => e.status !== 'completed' && e.status !== 'cancelled').length} active
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnEntries = grouped[column.key] ?? [];
            return (
              <div
                key={column.key}
                className="flex min-h-[220px] flex-col rounded-card border border-line bg-canvas/70 p-3"
              >
                <div className="mb-3 flex items-baseline justify-between gap-2 px-1">
                  <div>
                    <h3 className="text-[13px] font-semibold text-navy">{column.title}</h3>
                    <p className="mt-0.5 text-[10.5px] text-ink-muted">{column.description}</p>
                  </div>
                  <span className="tnum rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-muted ring-1 ring-line">
                    {columnEntries.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {columnEntries.map((entry) => {
                      const service = SERVICE_TYPE_MAP[entry.serviceId];
                      const estimate = getEstimate(entry.id);
                      const canCall = entry.status === 'waiting';
                      const canStart = entry.status === 'called';
                      const canComplete = entry.status === 'in-service';
                      return (
                        <motion.div
                          key={entry.id}
                          layout={reduceMotion ? false : 'position'}
                          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="rounded-control border border-line bg-white p-3 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="tnum text-[13.5px] font-semibold text-navy">
                                {entry.token}
                              </p>
                              <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                                {entry.visitorName}
                              </p>
                            </div>
                            {entry.status !== 'completed' && (
                              <StatusIndicator status={entry.status} />
                            )}
                          </div>

                          <p className="mt-2 truncate text-[11px] text-ink-muted">
                            {service?.name}
                          </p>

                          {estimate && (
                            <p className="tnum mt-1.5 flex items-center gap-1 text-[11.5px] text-ink-muted">
                              <Clock aria-hidden className="size-3" strokeWidth={2.2} />
                              {estimate.min}–{estimate.max} min
                            </p>
                          )}

                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {canCall && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleTableAction(entry.id, 'call')}
                              >
                                Call
                              </Button>
                            )}
                            {canStart && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleTableAction(entry.id, 'start')}
                              >
                                Start
                              </Button>
                            )}
                            {canComplete && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleTableAction(entry.id, 'complete')}
                              >
                                Complete
                              </Button>
                            )}
                            {canTransition(entry.status, 'no-show') && (
                              <IconButton
                                label={`Mark ${entry.token} as a no-show`}
                                variant="danger"
                                size="sm"
                                onClick={() => handleTableAction(entry.id, 'no-show')}
                              >
                                <UserX aria-hidden className="size-3.5" strokeWidth={2.1} />
                              </IconButton>
                            )}
                            {canTransition(entry.status, 'cancelled') && (
                              <IconButton
                                label={`Cancel ${entry.token}`}
                                variant="danger"
                                size="sm"
                                onClick={() => handleTableAction(entry.id, 'cancel')}
                              >
                                <X aria-hidden className="size-3.5" strokeWidth={2.2} />
                              </IconButton>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {columnEntries.length === 0 && (
                    <p className="rounded-control border border-dashed border-line px-3 py-6 text-center text-[11.5px] text-ink-muted">
                      Nothing here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <DemoNotice>
        Every action on this page changes the shared queue state. Patient-facing screens and the
        dashboard update immediately, and each event is written to the activity log.
      </DemoNotice>

      <ConfirmationDialog
        open={confirm !== null}
        title={
          confirm?.kind === 'no-show'
            ? `Mark ${confirm?.token} as a no-show?`
            : `Cancel ${confirm?.token}?`
        }
        description={
          confirm?.kind === 'no-show'
            ? `${confirm?.name} will be recorded as a no-show and the queue will move forward. Their wait estimate is removed and everyone behind them gets a shorter estimate.`
            : `${confirm?.name} will be removed from the queue. The slot is released and all remaining estimates are recalculated.`
        }
        confirmLabel={confirm?.kind === 'no-show' ? 'Record no-show' : 'Cancel entry'}
        tone={confirm?.kind === 'no-show' ? 'danger' : 'warning'}
        onCancel={() => setConfirm(null)}
        onConfirm={confirmAction}
      >
        <div className="rounded-control bg-canvas px-3 py-2.5">
          <p className="flex items-center gap-2 text-[12.5px] text-ink-muted">
            <CircleSlash aria-hidden className="size-3.5" strokeWidth={2.1} />
            This action is recorded in the activity feed and cannot be undone.
          </p>
        </div>
      </ConfirmationDialog>
    </div>
  );
}
