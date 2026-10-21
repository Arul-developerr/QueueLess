/**
 * Scenario-based wait-time intelligence.
 *
 * Everything here is a transparent arithmetic model over synthetic data.
 * It intentionally avoids "AI"-flavoured black boxes: the scenario panel
 * shows exactly which assumption moved the number.
 */

import type {
  ForecastInputs,
  ForecastScenario,
  ProjectionPoint,
  ScenarioComparison,
  ScenarioDriver,
  WaitEstimate,
} from '../types/queue';
import { buildProjection, clamp, roundTo } from './queueEngine';

/**
 * Core arithmetic shared by every scenario.
 *
 *   effectiveAhead = peopleAhead * (1 - noShowRate)
 *   slots          = ceil(effectiveAhead / activeDesks)
 *   expectedWait   = slots * expectedService + loadPenalty
 *   band           = variability * sqrt(slots + 0.5) * 1.28
 */
export function computeScenarioEstimate(inputs: ForecastInputs): WaitEstimate {
  const desks = Math.max(1, inputs.activeDesks);
  const s = Math.max(1, inputs.expectedServiceMin * inputs.serviceDurationFactor);
  const v = Math.max(0.5, inputs.variabilityMin);
  const noShow = clamp(inputs.noShowRate, 0, 0.6);

  const effectiveAhead = inputs.peopleAhead * (1 - noShow);
  const slots = Math.ceil(effectiveAhead / desks);

  const loadRatio = effectiveAhead / desks;
  const loadPenalty = loadRatio > 0 ? Math.min(1, loadRatio / 12) * s * 0.35 : 0;

  const expectedWait = Math.max(0, slots * s + loadPenalty + inputs.inProgressRemainingMin / desks);

  const sigma = v * Math.sqrt(Math.max(1, slots) + 0.5);
  const band = sigma * 1.28;

  const min = Math.max(0, expectedWait - band * 0.85);
  const max = expectedWait + band * 1.15;
  const uncertainty = expectedWait <= 0 ? 0 : clamp(band / Math.max(expectedWait, 1), 0, 1);

  const factors = [
    {
      id: 'position',
      label: 'Queue position',
      impactMin: roundTo(slots * s, 1),
      detail: `${inputs.peopleAhead} visitor${inputs.peopleAhead === 1 ? '' : 's'} ahead of you.`,
    },
    {
      id: 'service',
      label: 'Expected service duration',
      impactMin: roundTo(slots * s, 1),
      detail: `Each service slot is assumed to take ${roundTo(s, 1)} minutes.`,
    },
    {
      id: 'variability',
      label: 'Service-duration variability',
      impactMin: 0,
      detail: `Recent services vary by about ${roundTo(v, 1)} minutes, which widens the range.`,
    },
    {
      id: 'desks',
      label: 'Active service desks',
      impactMin: roundTo(-(effectiveAhead * s) / desks + effectiveAhead * s * 0.15, 1),
      detail: `${desks} desk${desks === 1 ? '' : 's'} working in parallel.`,
    },
    {
      id: 'no-show',
      label: 'No-show assumption',
      impactMin: roundTo(-(inputs.peopleAhead - effectiveAhead) * s, 1),
      detail: `About ${Math.round(noShow * 100)}% of visitors ahead are assumed not to show up.`,
    },
  ];

  return {
    min: Math.round(min),
    max: Math.round(max),
    peopleAhead: inputs.peopleAhead,
    expectedWaitMin: Math.round(expectedWait),
    expectedTotalMin: Math.round(expectedWait + s),
    uncertainty: roundTo(uncertainty, 2),
    confidence: uncertainty < 0.25 ? 'high' : uncertainty < 0.55 ? 'moderate' : 'low',
    factors,
  };
}

export interface ScenarioSeed {
  inputs: ForecastInputs;
  targetPosition: number;
  serviceLabel: string;
}

export function buildScenario(
  id: ForecastScenario['id'],
  label: string,
  description: string,
  seed: ScenarioSeed,
): ForecastScenario {
  const result = computeScenarioEstimate(seed.inputs);
  const projection: ProjectionPoint[] = buildProjection(
    seed.inputs,
    seed.targetPosition,
    seed.serviceLabel,
  );
  return { id, label, description, inputs: seed.inputs, result, projection };
}

export function buildComparison(seed: ScenarioSeed): ScenarioComparison {
  const current = buildScenario(
    'current',
    'Current scenario',
    'The assumptions the demo is running with right now.',
    seed,
  );

  const fasterInputs: ForecastInputs = {
    ...seed.inputs,
    serviceDurationFactor: 0.75,
    variabilityMin: Math.max(0.5, seed.inputs.variabilityMin * 0.7),
  };
  const faster = buildScenario(
    'faster',
    'Faster service',
    'Services run 25% quicker and more consistently than recently observed.',
    { ...seed, inputs: fasterInputs },
  );

  const slowerInputs: ForecastInputs = {
    ...seed.inputs,
    serviceDurationFactor: 1.3,
    variabilityMin: seed.inputs.variabilityMin * 1.35,
  };
  const slower = buildScenario(
    'slower',
    'Slower service',
    'Services run 30% longer and with more spread than recently observed.',
    { ...seed, inputs: slowerInputs },
  );

  const drivers: ScenarioDriver[] = [
    {
      id: 'duration',
      label: 'Expected service duration',
      currentValue: `${roundTo(seed.inputs.expectedServiceMin * seed.inputs.serviceDurationFactor, 1)} min`,
      alternativeValue: `${roundTo(fasterInputs.expectedServiceMin * fasterInputs.serviceDurationFactor, 1)} min`,
      impactMin: roundTo(faster.result.expectedWaitMin - current.result.expectedWaitMin, 1),
      direction:
        faster.result.expectedWaitMin < current.result.expectedWaitMin ? 'decrease' : 'increase',
    },
    {
      id: 'variability',
      label: 'Service-duration variability',
      currentValue: `±${roundTo(seed.inputs.variabilityMin, 1)} min`,
      alternativeValue: `±${roundTo(fasterInputs.variabilityMin, 1)} min`,
      impactMin: roundTo(faster.result.max - current.result.max, 1),
      direction: faster.result.max < current.result.max ? 'decrease' : 'increase',
    },
    {
      id: 'desks',
      label: 'Active service desks',
      currentValue: `${seed.inputs.activeDesks}`,
      alternativeValue: `${seed.inputs.activeDesks}`,
      impactMin: 0,
      direction: 'neutral',
    },
    {
      id: 'no-show',
      label: 'No-show assumption',
      currentValue: `${Math.round(seed.inputs.noShowRate * 100)}%`,
      alternativeValue: `${Math.round(seed.inputs.noShowRate * 100)}%`,
      impactMin: 0,
      direction: 'neutral',
    },
  ];

  return { current, faster, slower, drivers };
}

/** Human-readable confidence copy. */
export const CONFIDENCE_COPY: Record<WaitEstimate['confidence'], string> = {
  high: 'Narrow range — recent services at this desk have been consistent.',
  moderate: 'Moderate range — some variation between recent services.',
  low: 'Wide range — service durations at this desk have been inconsistent.',
};