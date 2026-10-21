/**
 * Synthetic demo data.
 *
 * Every visitor, clinic, desk, and history record in this file is invented for
 * the purposes of the product demo. None of it describes a real clinic,
 * patient, or treatment.
 */

import type {
  AppSettings,
  Clinic,
  HistoricalVisit,
  QueueEntry,
  QueueEvent,
  ServiceDesk,
  ServiceType,
} from '../types/queue';

export const SERVICE_TYPES: ServiceType[] = [
  {
    id: 'general-consult',
    name: 'General Consultation',
    shortName: 'Consult',
    category: 'consultation',
    baseDurationMin: 12,
    variabilityMin: 3.5,
    icon: 'stethoscope',
    description: 'A standard consultation slot with a clinician.',
  },
  {
    id: 'blood-draw',
    name: 'Blood Draw',
    shortName: 'Labs',
    category: 'procedure',
    baseDurationMin: 7,
    variabilityMin: 2,
    icon: 'test-tube',
    description: 'Sample collection at the phlebotomy counter.',
  },
  {
    id: 'vaccination',
    name: 'Vaccination',
    shortName: 'Vaccine',
    category: 'procedure',
    baseDurationMin: 6,
    variabilityMin: 1.5,
    icon: 'syringe',
    description: 'A short immunisation appointment.',
  },
  {
    id: 'dental',
    name: 'Dental Check-up',
    shortName: 'Dental',
    category: 'procedure',
    baseDurationMin: 20,
    variabilityMin: 6,
    icon: 'heart-pulse',
    description: 'Routine examination and cleaning.',
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy',
    shortName: 'Physio',
    category: 'follow-up',
    baseDurationMin: 25,
    variabilityMin: 7,
    icon: 'activity',
    description: 'A guided mobility and rehabilitation session.',
  },
  {
    id: 'prescription-refill',
    name: 'Prescription Refill',
    shortName: 'Refill',
    category: 'follow-up',
    baseDurationMin: 5,
    variabilityMin: 1.5,
    icon: 'pill',
    description: 'A quick repeat-prescription review.',
  },
];

export const SERVICE_TYPE_MAP: Record<string, ServiceType> = Object.fromEntries(
  SERVICE_TYPES.map((s) => [s.id, s]),
);

export const CLINICS: Clinic[] = [
  {
    id: 'harbourpoint',
    name: 'Harbour Point Medical Centre',
    address: '18 Harbourfront Road',
    locality: 'Harbour District',
    hours: '08:00 – 18:00',
    serviceIds: ['general-consult', 'blood-draw', 'vaccination', 'prescription-refill'],
    accent: 'teal',
  },
  {
    id: 'northgate',
    name: 'Northgate Family Clinic',
    address: '204 Northgate Avenue',
    locality: 'North Quarter',
    hours: '09:00 – 17:00',
    serviceIds: ['general-consult', 'vaccination', 'dental'],
    accent: 'navy',
  },
  {
    id: 'riverside',
    name: 'Riverside Health Hub',
    address: '7 Riverside Walk',
    locality: 'Riverside',
    hours: '08:30 – 20:00',
    serviceIds: ['general-consult', 'blood-draw', 'dental', 'physiotherapy'],
    accent: 'amber',
  },
];

export const CLINIC_MAP: Record<string, Clinic> = Object.fromEntries(CLINICS.map((c) => [c.id, c]));

export const DEFAULT_SETTINGS: AppSettings = {
  deskName: 'General Service Desk',
  clinicId: 'harbourpoint',
  estimatedServiceDurationMin: 12,
  activeDeskCount: 2,
  queueCapacity: 40,
  noShowGraceMin: 5,
  demoUpdateIntervalSec: 12,
  motionScale: 'full',
  notifyOnCalled: true,
  notifyOnEstimateChange: true,
  notifyOnNoShow: false,
  notificationsEnabled: true,
};

export const DESKS: ServiceDesk[] = [
  { id: 'desk-1', name: 'Desk 1', clinicId: 'harbourpoint', isPaused: false, activeEntryId: null },
  { id: 'desk-2', name: 'Desk 2', clinicId: 'harbourpoint', isPaused: false, activeEntryId: null },
  { id: 'desk-3', name: 'Desk 3', clinicId: 'harbourpoint', isPaused: true, activeEntryId: null },
];

const FIRST_NAMES = [
  'Anita', 'Marcus', 'Priya', 'Daniel', 'Sofia', 'Owen', 'Leila', 'Tom', 'Grace', 'Hassan',
  'Nora', 'Isaac', 'Mei', 'Felix', 'Zara', 'Caleb', 'Ingrid', 'Ravi', 'Elena', 'Jonah',
  'Aisha', 'Peter', 'Lucia', 'Noah', 'Ruth', 'Kwame', 'Clara', 'Hugo', 'Tara', 'Simon',
];

const LAST_NAMES = [
  'Whitfield', 'Osei', 'Raman', 'Bennett', 'Alvarez', 'Novak', 'Haddad', 'Ellery',
  'Farrow', 'Nakamura', 'Kaur', 'Delgado', 'Brandt', 'Iyer', 'Sandoval', 'Mbeki',
  'Lindqvist', 'Chandra', 'Moreau', 'Okafor',
];

/** Deterministic pseudo-random generator so the demo is reproducible. */
export function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length) % list.length];
}

export interface DemoSeedOptions {
  now: number;
  entryCount?: number;
  rngSeed?: number;
}

export interface DemoSeed {
  entries: QueueEntry[];
  events: QueueEvent[];
  tokenCounter: number;
  sequenceCounter: number;
}

/**
 * Builds a realistic starting queue: a couple of desks already serving,
 * a set of waiting visitors, and a short history of completed services.
 */
export function createDemoSeed(options: DemoSeedOptions): DemoSeed {
  const rng = makeRng(options.rngSeed ?? 20261020);
  const entryCount = options.entryCount ?? 9;
  const now = options.now;

  const entries: QueueEntry[] = [];
  const events: QueueEvent[] = [];
  let tokenCounter = 24;
  let sequenceCounter = 0;

  const services = SERVICE_TYPES;
  const deskIds = ['desk-1', 'desk-2'];

  // Two desks already mid-service.
  for (let d = 0; d < 2; d += 1) {
    const service = pick(rng, services);
    const elapsed = Math.floor(rng() * 6) + 2;
    const id = `entry-in-service-${d + 1}`;
    entries.push({
      id,
      token: `QL-${String(tokenCounter).padStart(3, '0')}`,
      visitorName: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
      serviceId: service.id,
      deskId: deskIds[d],
      status: 'in-service',
      joinedAt: now - (elapsed + 20) * 60_000,
      startedAt: now - elapsed * 60_000,
      completedAt: null,
      calledAt: now - (elapsed + 3) * 60_000,
      elapsedServiceMin: elapsed,
      actualDurationMin: null,
      sequence: sequenceCounter++,
      isSimulated: true,
    });
    tokenCounter += 1;
  }

  // A block of waiting visitors.
  for (let i = 0; i < entryCount; i += 1) {
    const service = pick(rng, services);
    const id = `entry-waiting-${i + 1}`;
    const waited = Math.floor(rng() * 26) + 2;
    entries.push({
      id,
      token: `QL-${String(tokenCounter).padStart(3, '0')}`,
      visitorName: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
      serviceId: service.id,
      deskId: deskIds[i % 2],
      status: 'waiting',
      joinedAt: now - waited * 60_000,
      startedAt: null,
      completedAt: null,
      calledAt: null,
      elapsedServiceMin: 0,
      actualDurationMin: null,
      sequence: sequenceCounter++,
      isSimulated: true,
    });
    tokenCounter += 1;
  }

  // A short completed history so service-duration statistics have samples.
  for (let i = 0; i < 6; i += 1) {
    const service = pick(rng, services);
    const duration = Math.max(
      2,
      Math.round(service.baseDurationMin + (rng() - 0.45) * service.variabilityMin * 2.2),
    );
    const startedAt = now - (i + 1) * 47 * 60_000;
    const id = `entry-done-${i + 1}`;
    entries.push({
      id,
      token: `QL-${String(tokenCounter).padStart(3, '0')}`,
      visitorName: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
      serviceId: service.id,
      deskId: deskIds[i % 2],
      status: 'completed',
      joinedAt: startedAt - 24 * 60_000,
      startedAt,
      completedAt: startedAt + duration * 60_000,
      calledAt: startedAt - 3 * 60_000,
      elapsedServiceMin: duration,
      actualDurationMin: duration,
      sequence: sequenceCounter++,
      isSimulated: true,
    });
    tokenCounter += 1;
  }

  // Seed the event feed with matching history.
  const baseEvents: Array<[QueueEvent['type'], QueueEntry, string, number]> = [
    ['checked-in', entries[2], 'Visitor checked in and received a token.', 31],
    ['checked-in', entries[3], 'Visitor checked in and received a token.', 26],
    ['checked-in', entries[4], 'Visitor checked in and received a token.', 19],
    ['service-started', entries[0], 'Service started at Desk 1.', 12],
    ['service-started', entries[1], 'Service started at Desk 2.', 9],
    ['service-completed', entries[entries.length - 1], 'Service completed.', 17],
    ['estimate-recalculated', entries[5], 'Wait estimate recalculated after a service update.', 8],
  ];

  baseEvents.forEach(([type, entry, message, minutesAgo], index) => {
    events.push({
      id: `event-seed-${index + 1}`,
      type,
      entryId: entry.id,
      token: entry.token,
      visitorName: entry.visitorName,
      message,
      timestamp: now - minutesAgo * 60_000,
      isSimulated: true,
    });
  });

  events.sort((a, b) => b.timestamp - a.timestamp);

  return { entries, events, tokenCounter, sequenceCounter };
}

/* ------------------------------------------------------------------ *
 * Synthetic analytics history
 * ------------------------------------------------------------------ */

/**
 * Generates 90 days of synthetic visit history with weekday/hour patterns so
 * the analytics page has something meaningful to chart.
 */
export function createHistoricalVisits(days = 90): HistoricalVisit[] {
  const rng = makeRng(77123);
  const visits: HistoricalVisit[] = [];
  const now = new Date();
  let counter = 0;

  for (let d = days - 1; d >= 0; d -= 1) {
    const day = new Date(now.getTime() - d * 86_400_000);
    const date = day.toISOString().slice(0, 10);
    const weekday = day.getDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.55 : 1;

    const dayCount = Math.round((26 + rng() * 16) * weekendFactor);

    for (let i = 0; i < dayCount; i += 1) {
      // Bimodal arrival pattern: a morning rush and a smaller afternoon bump.
      const morning = rng() < 0.62;
      const hour = morning
        ? 8 + Math.floor(rng() * 5)
        : 13 + Math.floor(rng() * 5);

      const service = pick(rng, SERVICE_TYPES);
      const serviceMin = Math.max(
        2,
        Math.round(service.baseDurationMin + (rng() - 0.45) * service.variabilityMin * 2.4),
      );
      const waitMin = Math.max(1, Math.round(3 + rng() * 22 * (morning ? 1.25 : 0.85)));

      const joinedAtMin = hour * 60 + Math.floor(rng() * 60);
      const calledAtMin = joinedAtMin + waitMin;
      const serviceStartedMin = calledAtMin + Math.floor(rng() * 4);
      const serviceCompletedMin = serviceStartedMin + serviceMin;

      const roll = rng();
      const outcome: HistoricalVisit['outcome'] =
        roll < 0.87 ? 'completed' : roll < 0.95 ? 'no-show' : 'cancelled';

      counter += 1;
      visits.push({
        id: `hist-${counter}`,
        token: `QL-${String(1000 + counter).padStart(4, '0')}`,
        visitorName: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
        serviceId: service.id,
        deskId: rng() < 0.5 ? 'desk-1' : 'desk-2',
        date,
        hour,
        joinedAtMin,
        calledAtMin,
        serviceStartedMin,
        serviceCompletedMin,
        waitMin,
        serviceMin,
        outcome,
      });
    }
  }

  return visits;
}