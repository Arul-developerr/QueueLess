import { motion, useReducedMotion } from 'motion/react';
import { Activity, Clock, Info, SlidersHorizontal, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { SERVICE_TYPE_MAP } from '../data/demoData';
import { buildComparison, CONFIDENCE_COPY } from '../lib/forecastEngine';
import { mean, queuePosition, stdDev } from '../lib/queueEngine';
import type { ForecastInputs } from '../types/queue';
import { PageHeader } from '../components/ui/PageHeader';
import { ChartCard } from '../components/ui/ChartCard';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DemoNotice } from '../components/queue/DemoNotice';
import { ForecastTimeline } from '../components/charts/ForecastTimeline';
import { ScenarioRangeChart, type ScenarioRange } from '../components/charts/ScenarioRangeChart';

interface SliderRowProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
  onChange: (value: number) => void;
}

function SliderRow({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  hint,
  onChange,
}: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-navy">
          {label}
        </label>
        <span className="tnum text-[13px] font-semibold text-teal">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-navy/10 accent-teal"
        style={{
          background: `linear-gradient(to right, #0F766E 0%, #0F766E ${pct}%, rgba(16,24,40,0.1) ${pct}%, rgba(16,24,40,0.1) 100%)`,
        }}
      />
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-muted">{hint}</p>
    </div>
  );
}

export default function ForecastPage() {
  const reduceMotion = useReducedMotion();
  const { entries, state, desks, getEstimate } = useQueue();

  const target = useMemo(() => {
    const active = entries.filter(
      (e) => e.status === 'waiting' || e.status === 'called' || e.status === 'in-service',
    );
    // Forecast for the visitor furthest back in the queue — the most
    // interesting case for waiting-time estimation.
    if (active.length === 0) return undefined;
    return [...active].sort((a, b) => queuePosition(entries, b.id) - queuePosition(entries, a.id))[0];
  }, [entries]);

  const baselineInputs = useMemo<ForecastInputs>(() => {
    const service = target ? SERVICE_TYPE_MAP[target.serviceId] : undefined;
    const observed = entries
      .filter((e) => e.actualDurationMin !== null)
      .map((e) => e.actualDurationMin as number);
    const expected =
      observed.length > 0 ? Math.round(mean(observed)) : (service?.baseDurationMin ?? 12);
    const variability = Math.max(
      0.5,
      observed.length > 1 ? stdDev(observed, service?.variabilityMin ?? 3) : (service?.variabilityMin ?? 3),
    );
    const activeDesks = Math.max(1, desks.filter((d) => !d.isPaused).length);
    const ahead = target ? Math.max(0, queuePosition(entries, target.id) - 1) : 0;
    const serving = entries.find((e) => e.status === 'in-service');
    const remaining = serving
      ? Math.max(0, expected - serving.elapsedServiceMin)
      : 0;

    return {
      expectedServiceMin: expected,
      variabilityMin: Math.round(variability * 10) / 10,
      peopleAhead: ahead,
      activeDesks,
      noShowRate: 0.08,
      inProgressRemainingMin: Math.round(remaining),
      serviceDurationFactor: 1,
    };
  }, [entries, target, desks]);

  // The scenario starts from the live queue values. Slider changes are
  // stored as overrides so the baseline can keep tracking the live queue
  // without fighting the user.
  const [overrides, setOverrides] = useState<Partial<ForecastInputs>>({});
  const inputs: ForecastInputs = { ...baselineInputs, ...overrides };

  const comparison = useMemo(
    () =>
      buildComparison({
        inputs,
        targetPosition: inputs.peopleAhead + 1,
        serviceLabel: target ? SERVICE_TYPE_MAP[target.serviceId].name : 'Service',
      }),
    [inputs, target],
  );

  const update = (patch: Partial<ForecastInputs>) => {
    setOverrides((current) => ({ ...current, ...patch }));
  };

  const scenarioData: ScenarioRange[] = [
    { name: 'Faster', min: comparison.faster.result.min, max: comparison.faster.result.max },
    { name: 'Current', min: comparison.current.result.min, max: comparison.current.result.max },
    { name: 'Slower', min: comparison.slower.result.min, max: comparison.slower.result.max },
  ];

  const liveEstimate = target ? getEstimate(target.id) : undefined;
  const currentRange = comparison.current.result;
  const deltaVsCurrent = currentRange.expectedWaitMin - (liveEstimate?.expectedWaitMin ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Wait-time intelligence"
        title="Predictive forecasting"
        description="Adjust the assumptions and watch the predicted waiting range respond. Every calculation is transparent arithmetic over the current synthetic queue."
        actions={
          <Button
            variant="secondary"
            onClick={() => setOverrides({})}
            icon={<SlidersHorizontal aria-hidden className="size-4" strokeWidth={2.1} />}
          >
            Reset to live values
          </Button>
        }
      />

      <DemoNotice>
        This is a simplified frontend demonstration of a scheduling approximation. It is not a
        validated medical or operational forecasting system, and it is not calibrated to any real
        dataset.
      </DemoNotice>

      {/* Forecast overview */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Forecast overview">
        <MetricCard
          label="Current queue size"
          value={entries.filter((e) => e.status === 'waiting' || e.status === 'called').length}
          unit="waiting"
          icon={Users}
          accent="teal"
          hint={`${inputs.peopleAhead} visitor${inputs.peopleAhead === 1 ? '' : 's'} ahead of the furthest waiting visitor`}
        />
        <MetricCard
          label="Predicted waiting range"
          value={`${currentRange.min}–${currentRange.max}`}
          unit="min"
          icon={Clock}
          accent="mint"
          comparison={{
            label:
              Math.abs(deltaVsCurrent) < 1
                ? 'Matches the live estimate'
                : `${deltaVsCurrent > 0 ? '+' : ''}${deltaVsCurrent} min vs the live estimate`,
            direction: Math.abs(deltaVsCurrent) < 1 ? 'flat' : deltaVsCurrent > 0 ? 'up' : 'down',
            isPositive: deltaVsCurrent <= 0,
          }}
          hint="The range shown for the furthest waiting visitor under the current assumptions"
        />
        <MetricCard
          label="Typical service duration"
          value={inputs.expectedServiceMin}
          unit="min"
          icon={Activity}
          accent="navy"
          comparison={{
            label: `±${inputs.variabilityMin} min observed spread`,
            direction: 'flat',
          }}
          hint="Blended from the configured estimate and completed services in this session"
        />
        <MetricCard
          label="Estimate confidence"
          value={currentRange.confidence}
          icon={Info}
          accent={currentRange.confidence === 'high' ? 'teal' : 'amber'}
          hint={CONFIDENCE_COPY[currentRange.confidence]}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        {/* Scenario simulator */}
        <section className="rounded-card border border-line bg-white p-5 shadow-xs">
          <h2 className="text-[15px] font-semibold text-navy">Scenario simulator</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
            Change an assumption to see how the prediction responds.
          </p>

          <div className="mt-6 space-y-6">
            <SliderRow
              id="expected-service"
              label="Expected service duration"
              value={inputs.expectedServiceMin}
              min={3}
              max={40}
              step={1}
              unit=" min"
              hint="How long one consultation is expected to take."
              onChange={(v) => update({ expectedServiceMin: v })}
            />
            <SliderRow
              id="variability"
              label="Service-duration variability"
              value={inputs.variabilityMin}
              min={0.5}
              max={12}
              step={0.5}
              unit=" min"
              hint="How much recent services have differed. Higher values widen the range."
              onChange={(v) => update({ variabilityMin: v })}
            />
            <SliderRow
              id="people-ahead"
              label="People ahead"
              value={inputs.peopleAhead}
              min={0}
              max={20}
              step={1}
              unit=""
              hint="The number of visitors queued in front of the target visitor."
              onChange={(v) => update({ peopleAhead: v })}
            />
            <SliderRow
              id="desks"
              label="Active service desks"
              value={inputs.activeDesks}
              min={1}
              max={Math.max(3, desks.length)}
              step={1}
              unit=""
              hint="How many desks are serving in parallel right now."
              onChange={(v) => update({ activeDesks: v })}
            />
            <SliderRow
              id="no-show"
              label="No-show assumption"
              value={Math.round(inputs.noShowRate * 100)}
              min={0}
              max={40}
              step={1}
              unit="%"
              hint="The share of visitors ahead assumed not to show up."
              onChange={(v) => update({ noShowRate: v / 100 })}
            />
          </div>

          <div className="mt-6 rounded-control bg-canvas p-3.5">
            <p className="text-[11px] font-semibold tracking-[0.1em] text-ink-muted uppercase">
              Recalculated
            </p>
            <p className="tnum mt-1.5 text-2xl font-semibold text-navy">
              {currentRange.min}–{currentRange.max} min
            </p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-muted">
              Expected wait of {currentRange.expectedWaitMin} min, with a range width of{' '}
              {currentRange.max - currentRange.min} min.
            </p>
          </div>
        </section>

        {/* Timeline + comparison */}
        <div className="space-y-5">
          <ChartCard
            title="Forecast timeline"
            description="Expected progression through the remaining queue, showing how variability widens the range for each visitor ahead."
            footnote={`${state.settings.deskName} · last recalculated ${new Date(state.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          >
            <ForecastTimeline points={comparison.current.projection} />
          </ChartCard>

          <ChartCard
            title="Scenario comparison"
            description="How the predicted waiting range changes under faster and slower service assumptions."
          >
            <ScenarioRangeChart data={scenarioData} />
          </ChartCard>
        </div>
      </div>

      {/* Scenario cards */}
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          comparison.faster,
          comparison.current,
          comparison.slower,
        ].map((scenario) => {
          const isCurrent = scenario.id === 'current';
          const diff = scenario.result.expectedWaitMin - comparison.current.result.expectedWaitMin;
          return (
            <motion.div
              key={scenario.id}
              initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-card border p-5 shadow-xs ${
                isCurrent ? 'border-teal/40 bg-mint-soft' : 'border-line bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[14px] font-semibold text-navy">{scenario.label}</h3>
                {isCurrent && <Badge tone="teal">Baseline</Badge>}
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{scenario.description}</p>

              <p className="tnum mt-4 text-3xl font-semibold tracking-tight text-navy">
                {scenario.result.min}–{scenario.result.max}
                <span className="ml-1.5 text-sm font-medium text-ink-muted">min</span>
              </p>

              <p className="mt-2 text-[12px] text-ink-muted">
                {isCurrent ? (
                  <span className="font-medium text-teal">Baseline scenario</span>
                ) : (
                  <span className={diff < 0 ? 'font-medium text-success' : 'font-medium text-coral'}>
                    {diff > 0 ? '+' : ''}
                    {diff} min vs current
                  </span>
                )}
              </p>

              <dl className="mt-4 space-y-1.5 border-t border-line pt-3.5">
                <div className="flex items-center justify-between text-[12px]">
                  <dt className="text-ink-muted">Service duration</dt>
                  <dd className="tnum font-medium text-navy">
                    {Math.round(scenario.inputs.expectedServiceMin * scenario.inputs.serviceDurationFactor)} min
                  </dd>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <dt className="text-ink-muted">Variability</dt>
                  <dd className="tnum font-medium text-navy">±{scenario.inputs.variabilityMin} min</dd>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <dt className="text-ink-muted">Confidence</dt>
                  <dd className="font-medium text-navy capitalize">{scenario.result.confidence}</dd>
                </div>
              </dl>
            </motion.div>
          );
        })}
      </section>

      {/* Explainability */}
      <section className="rounded-card border border-line bg-white p-5 shadow-xs">
        <h2 className="text-[15px] font-semibold text-navy">What is affecting the estimate?</h2>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
          These are the actual factors behind the number, with their contribution in minutes. Nothing
          here is a prediction produced by a black box — each line is arithmetic you can check.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="text-[13px] font-semibold text-navy">Current factors</h3>
            <ul className="mt-3 space-y-2.5">
              {currentRange.factors.map((factor) => (
                <li key={factor.id} className="rounded-control border border-line p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-semibold text-navy">{factor.label}</span>
                    {Math.abs(factor.impactMin) >= 0.5 && (
                      <span
                        className={`tnum text-[12.5px] font-semibold ${
                          factor.impactMin < 0 ? 'text-success' : 'text-ink-muted'
                        }`}
                      >
                        {factor.impactMin > 0 ? '+' : ''}
                        {Math.round(factor.impactMin)} min
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{factor.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-navy">Scenario drivers</h3>
            <p className="mt-1 text-[12px] text-ink-muted">
              How the faster-service scenario differs from the current one.
            </p>
            <ul className="mt-3 space-y-2.5">
              {comparison.drivers.map((driver) => (
                <li key={driver.id} className="rounded-control border border-line p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-navy">{driver.label}</span>
                    <span
                      className={`tnum text-[12.5px] font-semibold ${
                        driver.impactMin < 0
                          ? 'text-success'
                          : driver.impactMin > 0
                            ? 'text-coral'
                            : 'text-ink-muted'
                      }`}
                    >
                      {driver.direction === 'neutral'
                        ? 'No change'
                        : `${driver.impactMin > 0 ? '+' : ''}${driver.impactMin} min`}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-ink-muted">
                    Current: <span className="tnum font-medium text-navy">{driver.currentValue}</span>
                    {' · '}
                    Alternative:{' '}
                    <span className="tnum font-medium text-navy">{driver.alternativeValue}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-control border border-line bg-canvas p-4">
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-muted">
            <Info aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2} />
            <span>
              <strong className="font-semibold text-navy">How the range is calculated.</strong>{' '}
              Expected wait = (number of service slots ahead × expected service duration) + a small load
              penalty for uncertainty, where slots = ceil(visitors ahead ÷ active desks). The range comes
              from the observed service-duration spread, scaled by √(slots) and multiplied by 1.28, which
              is a chosen approximation — not a statistically calibrated confidence interval.
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
