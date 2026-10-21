import {
  Activity as ActivityIcon,
  Clock,
  RefreshCw,
  TrendingUp,
  UserX,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { SERVICE_TYPE_MAP } from '../data/demoData';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { ChartCard } from '../components/ui/ChartCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ActivityFeed } from '../components/queue/ActivityFeed';
import { QueueTable } from '../components/queue/QueueTable';
import { DemoNotice } from '../components/queue/DemoNotice';
import { ProgressBar } from '../components/queue/ProgressBar';
import {
  QueueLengthChart,
  type QueueLengthPoint,
} from '../components/charts/QueueLengthChart';
import {
  ServiceDurationChart,
  type ServiceDurationPoint,
} from '../components/charts/ServiceDurationChart';
import {
  WaitDistributionChart,
  type DistributionBucket,
} from '../components/charts/WaitDistributionChart';
import {
  StatusBreakdownChart,
  type StatusSlice,
} from '../components/charts/StatusBreakdownChart';
import { mean, median, queuePosition } from '../lib/queueEngine';

export default function StaffOverviewPage() {
  const { state, entries, events, metrics, getEstimate, dispatch, settings, desks } = useQueue();

  const activeEntries = useMemo(
    () =>
      entries
        .filter((e) => e.status === 'waiting' || e.status === 'called' || e.status === 'in-service')
        .sort((a, b) => queuePosition(entries, a.id) - queuePosition(entries, b.id)),
    [entries],
  );

  /* ---------------- Chart data ---------------- */

  // Queue length over time, reconstructed from the current queue and events.
  const queueLengthData = useMemo<QueueLengthPoint[]>(() => {
    const points: QueueLengthPoint[] = [];
    const now = Date.now();
    let waiting = activeEntries.length;
    for (let i = 6; i >= 0; i -= 1) {
      const label = i === 0 ? 'Now' : `-${i * 10}m`;
      // Reconstruct a plausible shape from the current count, then blend
      // with how many have been served in that window.
      const servedRecently = events.filter(
        (e) =>
          e.type === 'service-completed' && now - e.timestamp <= i * 10 * 60_000,
      ).length;
      const joinedRecently = events.filter(
        (e) => e.type === 'queue-joined' && now - e.timestamp <= i * 10 * 60_000,
      ).length;
      points.push({
        label,
        waiting: Math.max(0, waiting - joinedRecently + servedRecently),
        served: servedRecently,
      });
    }
    return points;
  }, [activeEntries.length, events]);

  const serviceDurationData = useMemo<ServiceDurationPoint[]>(() => {
    const groups = new Map<string, { estimated: number[]; actual: number[] }>();

    for (const service of Object.values(SERVICE_TYPE_MAP)) {
      groups.set(service.id, {
        estimated: Array(service.baseDurationMin).fill(service.baseDurationMin),
        actual: [],
      });
    }

    for (const entry of state.entries) {
      if (entry.actualDurationMin === null) continue;
      const group = groups.get(entry.serviceId);
      if (group) group.actual.push(entry.actualDurationMin);
    }

    return [...groups.entries()]
      .filter(([, group]) => group.actual.length > 0)
      .map(([id, group]) => ({
        service: SERVICE_TYPE_MAP[id].shortName,
        estimated: Math.round(mean(group.estimated)),
        actual: Math.round(mean(group.actual)),
      }))
      .sort((a, b) => b.actual - a.actual);
  }, [state.entries]);

  const waitDistribution = useMemo<DistributionBucket[]>(() => {
    const bands = [
      { bucket: '0–5', min: 0, max: 5 },
      { bucket: '5–10', min: 5, max: 10 },
      { bucket: '10–15', min: 10, max: 15 },
      { bucket: '15–20', min: 15, max: 20 },
      { bucket: '20–30', min: 20, max: 30 },
      { bucket: '30+', min: 30, max: Infinity },
    ];

    const counts = new Map(bands.map((b) => [b.bucket, 0]));
    for (const entry of activeEntries) {
      const estimate = getEstimate(entry.id);
      if (!estimate) continue;
      const wait = estimate.expectedWaitMin;
      const band = bands.find((b) => wait >= b.min && wait < b.max);
      if (band) counts.set(band.bucket, (counts.get(band.bucket) ?? 0) + 1);
    }

    return bands.map((b) => ({ bucket: b.bucket, visitors: counts.get(b.bucket) ?? 0 }));
  }, [activeEntries, getEstimate]);

  const statusSlices = useMemo<StatusSlice[]>(() => {
    const labels: Record<string, string> = {
      waiting: 'Waiting',
      called: 'Called',
      'in-service': 'In service',
      completed: 'Completed',
      'no-show': 'No-show',
      cancelled: 'Cancelled',
    };
    return Object.entries(labels)
      .map(([key, name]) => ({
        name,
        value: entries.filter((e) => e.status === key).length,
      }))
      .filter((slice) => slice.value > 0);
  }, [entries]);

  const getWait = (entryId: string) => {
    const estimate = getEstimate(entryId);
    return estimate ? { min: estimate.min, max: estimate.max } : undefined;
  };

  const activeDeskCount = desks.filter((d) => !d.isPaused).length;
  const observedServiceDurations = state.entries
    .filter((e) => e.actualDurationMin !== null)
    .map((e) => e.actualDurationMin as number);
  const medianService = Math.round(median(observedServiceDurations));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff workspace"
        title="Queue overview"
        description="Live operational view of the demo queue. Every number below is computed from the current synthetic dataset."
        actions={
          <>
            <Badge tone={state.isSimulating ? 'teal' : 'neutral'} dot pulse={state.isSimulating}>
              {state.isSimulating ? 'Simulated live' : 'Simulation paused'}
            </Badge>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'recalculate' })}
              icon={<RefreshCw aria-hidden className="size-4" strokeWidth={2.1} />}
            >
              Recalculate
            </Button>
          </>
        }
      />

      <DemoNotice />

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
        <MetricCard
          label="Visitors waiting"
          value={metrics.waitingCount}
          icon={Users}
          accent="teal"
          comparison={{
            label: `${metrics.calledCount} called · ${metrics.inServiceCount} in service`,
            direction: 'flat',
          }}
          hint={`${metrics.capacityUsed} of ${settings.queueCapacity} queue slots in use`}
        />
        <MetricCard
          label="Median estimated wait"
          value={metrics.medianWaitMin}
          unit="min"
          icon={Clock}
          accent="mint"
          comparison={{
            label: `Average ${metrics.averageWaitMin} min across the queue`,
            direction: 'flat',
          }}
          hint="Estimated from queue position and recent service durations"
        />
        <MetricCard
          label="Average service duration"
          value={metrics.averageServiceMin || medianService}
          unit="min"
          icon={TrendingUp}
          accent="navy"
          comparison={{
            label: `Configured estimate ${settings.estimatedServiceDurationMin} min`,
            direction: 'flat',
          }}
          hint={`Across ${observedServiceDurations.length} completed service${observedServiceDurations.length === 1 ? '' : 's'} in this session`}
        />
        <MetricCard
          label="No-show rate"
          value={`${Math.round(metrics.noShowRate * 100)}%`}
          icon={UserX}
          accent="amber"
          comparison={{
            label:
              metrics.noShowRate > 0.15
                ? 'Above the 15% reference point'
                : 'Within the 15% reference point',
            direction: metrics.noShowRate > 0.15 ? 'up' : 'down',
            isPositive: metrics.noShowRate <= 0.15,
          }}
          hint="Measured across completed, no-show, and cancelled entries"
        />
      </section>

      {/* Capacity strip */}
      <section className="rounded-card border border-line bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-navy">Service desks</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              {activeDeskCount} of {desks.length} desks currently serving
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {desks.map((desk) => (
              <span
                key={desk.id}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${
                  desk.isPaused
                    ? 'bg-canvas text-ink-muted'
                    : 'bg-teal/10 text-teal-700'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${desk.isPaused ? 'bg-navy-600' : 'bg-teal'}`}
                />
                {desk.name}
                {desk.isPaused ? '· paused' : ''}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar
            value={metrics.capacityUsed}
            max={settings.queueCapacity}
            label="Queue capacity in use"
            tone={metrics.capacityUsed / settings.queueCapacity > 0.85 ? 'amber' : 'teal'}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Queue length over time"
          description="How many visitors were waiting versus how many were served, in the last hour of the demo session."
          footnote="Reconstructed from the current queue and the recorded event history."
        >
          <QueueLengthChart data={queueLengthData} />
        </ChartCard>

        <ChartCard
          title="Estimated versus actual service duration"
          description="How the configured service estimate compares with the durations actually observed in this session."
          footnote="Actual averages are computed from completed services in the current demo dataset."
        >
          {serviceDurationData.length > 0 ? (
            <ServiceDurationChart data={serviceDurationData} />
          ) : (
            <div className="grid h-[240px] place-items-center text-[13px] text-ink-muted">
              No services have completed yet — actual averages will appear here.
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Wait-time distribution"
          description="How the current estimated waits spread across the visitors who are still waiting."
        >
          <WaitDistributionChart data={waitDistribution} />
        </ChartCard>

        <ChartCard
          title="Queue status breakdown"
          description="How every entry in the session is distributed across queue states."
        >
          <StatusBreakdownChart data={statusSlices} />
        </ChartCard>
      </section>

      {/* Live queue table */}
      <section className="overflow-hidden rounded-card border border-line bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-[15px] font-semibold text-navy">Live queue</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Search, filter, and act on every visitor currently in the queue
            </p>
          </div>
          <Badge tone="neutral" dot>
            {activeEntries.length} active
          </Badge>
        </div>
        <QueueTable
          entries={activeEntries}
          getPosition={(id) => queuePosition(entries, id)}
          getWait={getWait}
          onAction={(entryId, action) => {
            if (action === 'call') dispatch({ type: 'call-token', entryId });
            if (action === 'start') dispatch({ type: 'start-service', entryId });
            if (action === 'complete') dispatch({ type: 'complete-service', entryId });
          }}
        />
      </section>

      {/* Activity feed */}
      <section className="rounded-card border border-line bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-navy">Queue activity</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              A chronological log of every check-in, call, service, and recalculation
            </p>
          </div>
          <ActivityIcon aria-hidden className="size-4 text-ink-muted" strokeWidth={2} />
        </div>
        <div className="mt-5">
          <ActivityFeed events={events} limit={10} />
        </div>
      </section>
    </div>
  );
}