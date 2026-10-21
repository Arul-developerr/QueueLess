import { Calendar, ChartNoAxesColumn, Clock, TrendingUp, UserX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { createHistoricalVisits, SERVICE_TYPE_MAP } from '../data/demoData';
import { formatDateLabel, mean, median } from '../lib/queueEngine';
import type { AnalyticsSummary, DateRangeKey, HistoricalVisit, ServiceId } from '../types/queue';
import { PageHeader } from '../components/ui/PageHeader';
import { ChartCard } from '../components/ui/ChartCard';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FilterBar } from '../components/ui/FilterBar';
import { EmptyState } from '../components/ui/EmptyState';
import { DemoNotice } from '../components/queue/DemoNotice';
import {
  HourlyArrivalChart,
  ServiceComparisonChart,
  ServiceDurationDistributionChart,
  WaitTrendChart,
  type HourPoint,
  type ServiceComparisonPoint,
  type TrendPoint,
} from '../components/charts/AnalyticsCharts';

const RANGE_OPTIONS: { value: DateRangeKey; label: string; days: number }[] = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '14d', label: 'Last 14 days', days: 14 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
];

/** The synthetic history is generated once and held in module scope. */
const HISTORY: HistoricalVisit[] = createHistoricalVisits(90);

export default function AnalyticsPage() {
  const { settings } = useQueue();
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [serviceFilter, setServiceFilter] = useState<ServiceId | 'all'>('all');

  const days = RANGE_OPTIONS.find((r) => r.value === range)?.days ?? 30;
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  const filtered = useMemo(
    () =>
      HISTORY.filter(
        (visit) =>
          visit.date >= cutoff &&
          (serviceFilter === 'all' || visit.serviceId === serviceFilter),
      ),
    [cutoff, serviceFilter],
  );

  const summary = useMemo<AnalyticsSummary>(() => {
    if (filtered.length === 0) {
      return {
        totalVisits: 0,
        completed: 0,
        noShows: 0,
        cancelled: 0,
        averageWaitMin: 0,
        medianWaitMin: 0,
        averageServiceMin: 0,
        medianServiceMin: 0,
        completionRate: 0,
        noShowRate: 0,
        onTimeRate: 0,
      };
    }

    const completed = filtered.filter((v) => v.outcome === 'completed');
    const noShows = filtered.filter((v) => v.outcome === 'no-show');
    const cancelled = filtered.filter((v) => v.outcome === 'cancelled');
    const waits = filtered.map((v) => v.waitMin);
    const services = completed.map((v) => v.serviceMin);
    const withinEstimate = filtered.filter((v) => v.waitMin <= v.serviceMin * 2).length;

    return {
      totalVisits: filtered.length,
      completed: completed.length,
      noShows: noShows.length,
      cancelled: cancelled.length,
      averageWaitMin: Math.round(mean(waits)),
      medianWaitMin: Math.round(median(waits)),
      averageServiceMin: Math.round(mean(services)),
      medianServiceMin: Math.round(median(services)),
      completionRate: Math.round((completed.length / filtered.length) * 100),
      noShowRate: Math.round((noShows.length / filtered.length) * 100),
      onTimeRate: Math.round((withinEstimate / filtered.length) * 100),
    };
  }, [filtered]);

  const trendData = useMemo<TrendPoint[]>(() => {
    const byDate = new Map<string, number[]>();
    for (const visit of filtered) {
      const list = byDate.get(visit.date) ?? [];
      list.push(visit.waitMin);
      byDate.set(visit.date, list);
    }
    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, waits]) => ({
        date: formatDateLabel(date),
        average: Math.round(mean(waits)),
        median: Math.round(median(waits)),
      }));
  }, [filtered]);

  const hourlyData = useMemo<HourPoint[]>(() => {
    const buckets = new Map<number, { waits: number[]; count: number }>();
    for (const visit of filtered) {
      const bucket = buckets.get(visit.hour) ?? { waits: [], count: 0 };
      bucket.waits.push(visit.waitMin);
      bucket.count += 1;
      buckets.set(visit.hour, bucket);
    }
    return Array.from({ length: 12 }, (_, index) => {
      const hour = index + 8;
      const bucket = buckets.get(hour);
      return {
        hour: `${String(hour).padStart(2, '0')}:00`,
        arrivals: bucket?.count ?? 0,
        averageWait: bucket ? Math.round(mean(bucket.waits)) : 0,
      };
    });
  }, [filtered]);

  const serviceComparison = useMemo<ServiceComparisonPoint[]>(() => {
    const groups = new Map<string, { waits: number[]; services: number[] }>();
    for (const visit of filtered) {
      const group = groups.get(visit.serviceId) ?? { waits: [], services: [] };
      group.waits.push(visit.waitMin);
      if (visit.outcome === 'completed') group.services.push(visit.serviceMin);
      groups.set(visit.serviceId, group);
    }
    return [...groups.entries()]
      .map(([id, group]) => ({
        service: SERVICE_TYPE_MAP[id]?.shortName ?? id,
        averageWait: Math.round(mean(group.waits)),
        averageService: group.services.length ? Math.round(mean(group.services)) : 0,
        visits: group.waits.length,
      }))
      .sort((a, b) => b.averageWait - a.averageWait);
  }, [filtered]);

  const durationDistribution = useMemo(() => {
    const buckets = [
      { label: '0–5m', min: 0, max: 5 },
      { label: '5–10m', min: 5, max: 10 },
      { label: '10–15m', min: 10, max: 15 },
      { label: '15–20m', min: 15, max: 20 },
      { label: '20–25m', min: 20, max: 25 },
      { label: '25m+', min: 25, max: Infinity },
    ];
    const completed = filtered.filter((v) => v.outcome === 'completed');
    return buckets.map((bucket) => ({
      label: bucket.label,
      count: completed.filter((v) => v.serviceMin >= bucket.min && v.serviceMin < bucket.max).length,
    }));
  }, [filtered]);

  const serviceOptions = [
    { value: 'all', label: 'All services', count: HISTORY.length },
    ...Object.values(SERVICE_TYPE_MAP).map((service) => ({
      value: service.id,
      label: service.shortName,
      count: HISTORY.filter((v) => v.serviceId === service.id).length,
    })),
  ];

  const isEmpty = filtered.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Queue analytics"
        description="Performance across the synthetic historical dataset. Every chart responds to the filters below."
        actions={
          <Badge tone="amber">
            <ChartNoAxesColumn aria-hidden className="size-3" strokeWidth={2.4} />
            Synthetic history
          </Badge>
        }
      />

      {/* Filters */}
      <section className="rounded-card border border-line bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted">
              <Calendar aria-hidden className="size-3.5" strokeWidth={2.1} />
              Date range
            </span>
            <FilterBar
              label="Date range"
              options={RANGE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
              value={range}
              onChange={(value) => setRange(value as DateRangeKey)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-ink-muted">Service</span>
            <FilterBar
              label="Filter by service type"
              options={serviceOptions}
              value={serviceFilter}
              onChange={(value) => setServiceFilter(value as ServiceId | 'all')}
            />
          </div>
        </div>
      </section>

      {isEmpty ? (
        <section className="rounded-card border border-line bg-white shadow-xs">
          <EmptyState
            icon={ChartNoAxesColumn}
            title="No visits match these filters"
            description="Try widening the date range or choosing a different service type."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setRange('30d');
                  setServiceFilter('all');
                }}
              >
                Reset filters
              </Button>
            }
          />
        </section>
      ) : (
        <>
          {/* Summary metrics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Analytics summary">
            <MetricCard
              label="Total visitors served"
              value={summary.totalVisits}
              icon={TrendingUp}
              accent="teal"
              comparison={{
                label: `${summary.completed} completed · ${summary.cancelled} cancelled`,
                direction: 'flat',
              }}
              hint={`Across ${days} day${days === 1 ? '' : 's'} in the selected range`}
            />
            <MetricCard
              label="Average wait"
              value={summary.averageWaitMin}
              unit="min"
              icon={Clock}
              accent="mint"
              comparison={{
                label: `Median ${summary.medianWaitMin} min`,
                direction: 'flat',
              }}
              hint="Wait measured from queue join to the moment the token was called"
            />
            <MetricCard
              label="Service completion rate"
              value={`${summary.completionRate}%`}
              icon={TrendingUp}
              accent="navy"
              comparison={{
                label: `${summary.onTimeRate}% waited under 2× the service duration`,
                direction: 'flat',
              }}
              hint="Completed visits as a share of all visits in the range"
            />
            <MetricCard
              label="No-show rate"
              value={`${summary.noShowRate}%`}
              icon={UserX}
              accent="amber"
              comparison={{
                label: `${summary.noShows} no-shows recorded`,
                direction: 'flat',
              }}
              hint="Visits that were never served as a share of all visits"
            />
          </section>

          {/* Charts */}
          <section className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Wait-time trend"
              description="Average and median wait per day across the selected range."
              footnote="Wait = time from joining the queue to the token being called."
            >
              <WaitTrendChart data={trendData} />
            </ChartCard>

            <ChartCard
              title="Hourly arrival pattern"
              description="Arrivals by hour of the day with the average wait at each hour."
              footnote="The morning block shows a clear arrival rush in the synthetic dataset."
            >
              <HourlyArrivalChart data={hourlyData} />
            </ChartCard>

            <ChartCard
              title="Service-type comparison"
              description="Average wait and average service duration for each service type."
              footnote="Only services with completed visits contribute to the service-duration average."
            >
              <ServiceComparisonChart data={serviceComparison} />
            </ChartCard>

            <ChartCard
              title="Service-duration distribution"
              description="How many completed services fell into each duration band."
              footnote={`Average completed service: ${summary.averageServiceMin} min · median ${summary.medianServiceMin} min.`}
            >
              <ServiceDurationDistributionChart data={durationDistribution} />
            </ChartCard>
          </section>

          {/* Definitions */}
          <section className="rounded-card border border-line bg-white p-5 shadow-xs">
            <h2 className="text-[15px] font-semibold text-navy">How these metrics are defined</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  term: 'Wait',
                  detail: 'Minutes between joining the queue and the token being called.',
                },
                {
                  term: 'Service duration',
                  detail: 'Minutes from starting service to completing it, for completed visits only.',
                },
                {
                  term: 'Completion rate',
                  detail: 'Completed visits divided by all visits (completed, no-show, and cancelled).',
                },
                {
                  term: 'No-show rate',
                  detail: 'Visits that were never served divided by all visits in the range.',
                },
                {
                  term: 'On-time share',
                  detail: 'Visits whose wait was under twice the service duration they eventually received.',
                },
                {
                  term: 'Data source',
                  detail: `A generated 90-day synthetic dataset for ${settings.deskName}. Not real clinic data.`,
                },
              ].map((item) => (
                <div key={item.term} className="rounded-control bg-canvas p-3.5">
                  <dt className="text-[13px] font-semibold text-navy">{item.term}</dt>
                  <dd className="mt-1 text-[12px] leading-relaxed text-ink-muted">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}

      <DemoNotice>
        This analytics view is driven by a generated 90-day synthetic dataset. It is included to
        demonstrate how the interface responds to filters — the underlying figures do not describe a
        real clinic.
      </DemoNotice>
    </div>
  );
}