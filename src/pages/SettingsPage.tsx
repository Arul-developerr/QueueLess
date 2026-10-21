import { Check, Info, RotateCcw, Save, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { CLINICS, DEFAULT_SETTINGS, SERVICE_TYPES } from '../data/demoData';
import type { AppSettings } from '../types/queue';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DemoNotice } from '../components/queue/DemoNotice';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-navy">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12px] font-medium text-coral">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-[11.5px] leading-relaxed text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const inputClass =
  'h-10 w-full rounded-control border bg-white px-3 text-[13.5px] text-ink transition-colors placeholder:text-ink-muted/60 focus:ring-2 focus:outline-none';

export default function SettingsPage() {
  const { state, settings, dispatch, pushToast, resetDemo } = useQueue();

  const [draft, setDraft] = useState<AppSettings>(settings);
  const [errors, setErrors] = useState<Partial<Record<keyof AppSettings, string>>>({});
  const [saved, setSaved] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  // Re-sync the draft when settings change from elsewhere (e.g. desk pause).
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setSaved(false);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof AppSettings, string>> = {};

    if (draft.deskName.trim().length < 2) {
      next.deskName = 'Enter a service desk name with at least 2 characters.';
    }
    if (draft.estimatedServiceDurationMin < 1 || draft.estimatedServiceDurationMin > 90) {
      next.estimatedServiceDurationMin = 'Choose a value between 1 and 90 minutes.';
    }
    if (draft.activeDeskCount < 1 || draft.activeDeskCount > 3) {
      next.activeDeskCount = 'This demo supports between 1 and 3 active desks.';
    }
    if (draft.queueCapacity < 5 || draft.queueCapacity > 200) {
      next.queueCapacity = 'Choose a capacity between 5 and 200.';
    }
    if (draft.noShowGraceMin < 0 || draft.noShowGraceMin > 30) {
      next.noShowGraceMin = 'Choose a grace period between 0 and 30 minutes.';
    }
    if (draft.demoUpdateIntervalSec < 4 || draft.demoUpdateIntervalSec > 120) {
      next.demoUpdateIntervalSec = 'Choose an interval between 4 and 120 seconds.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) {
      pushToast({
        title: 'Could not save settings',
        description: 'Fix the highlighted fields and try again.',
        tone: 'danger',
        durationMs: 4200,
      });
      return;
    }
    dispatch({ type: 'update-settings', settings: draft });
    setSaved(true);
    pushToast({
      title: 'Settings saved',
      description: 'Your demo configuration is stored in this browser.',
      tone: 'success',
      durationMs: 3800,
    });
    window.setTimeout(() => setSaved(false), 2600);
  };

  const restoreDefaults = () => {
    setDraft(DEFAULT_SETTINGS);
    setErrors({});
    dispatch({ type: 'update-settings', settings: DEFAULT_SETTINGS });
    setRestoreOpen(false);
    pushToast({
      title: 'Default settings restored',
      description: 'The demo configuration has been reset to its starting values.',
      tone: 'success',
      durationMs: 3800,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Configure the simulated service desk. Changes apply immediately across every screen and are stored in this browser."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setRestoreOpen(true)}
              icon={<RotateCcw aria-hidden className="size-4" strokeWidth={2.1} />}
            >
              Restore defaults
            </Button>
            <Button
              onClick={save}
              success={saved}
              icon={saved ? <Check aria-hidden className="size-4" strokeWidth={2.6} /> : <Save aria-hidden className="size-4" strokeWidth={2.1} />}
            >
              {saved ? 'Saved' : 'Save settings'}
            </Button>
          </>
        }
      />

      <DemoNotice>
        These settings control the browser-side simulation only. No external service is connected, and
        no setting sends a real message, creates a real appointment, or stores any personal data.
      </DemoNotice>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Service desk */}
        <section className="rounded-card border border-line bg-white p-5 shadow-xs">
          <h2 className="text-[15px] font-semibold text-navy">Service desk</h2>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            How this demo queue presents itself to visitors and staff.
          </p>

          <div className="mt-5 space-y-5">
            <Field
              id="desk-name"
              label="Service desk name"
              hint="Shown on the patient token screen and in the staff header."
              error={errors.deskName}
            >
              <input
                id="desk-name"
                type="text"
                value={draft.deskName}
                onChange={(e) => update('deskName', e.target.value)}
                aria-invalid={errors.deskName ? 'true' : 'false'}
                className={`${inputClass} ${
                  errors.deskName
                    ? 'border-coral focus:border-coral focus:ring-coral/15'
                    : 'border-line focus:border-teal focus:ring-teal/15'
                }`}
              />
            </Field>

            <Field id="clinic" label="Clinic" hint="Which sample clinic this desk belongs to.">
              <select
                id="clinic"
                value={draft.clinicId}
                onChange={(e) => update('clinicId', e.target.value as AppSettings['clinicId'])}
                className={`${inputClass} border-line focus:border-teal focus:ring-teal/15`}
              >
                {CLINICS.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="service-duration"
              label="Estimated service duration (minutes)"
              hint="The baseline used when the engine has not yet observed enough completed services."
              error={errors.estimatedServiceDurationMin}
            >
              <input
                id="service-duration"
                type="number"
                min={1}
                max={90}
                value={draft.estimatedServiceDurationMin}
                onChange={(e) => update('estimatedServiceDurationMin', Number(e.target.value))}
                aria-invalid={errors.estimatedServiceDurationMin ? 'true' : 'false'}
                className={`${inputClass} tnum ${
                  errors.estimatedServiceDurationMin
                    ? 'border-coral focus:border-coral focus:ring-coral/15'
                    : 'border-line focus:border-teal focus:ring-teal/15'
                }`}
              />
            </Field>

            <Field
              id="active-desks"
              label="Active service desks"
              hint="How many desks serve in parallel. The wait estimate uses this to schedule slots."
              error={errors.activeDeskCount}
            >
              <select
                id="active-desks"
                value={draft.activeDeskCount}
                onChange={(e) => update('activeDeskCount', Number(e.target.value))}
                aria-invalid={errors.activeDeskCount ? 'true' : 'false'}
                className={`${inputClass} border-line focus:border-teal focus:ring-teal/15`}
              >
                {[1, 2, 3].map((count) => (
                  <option key={count} value={count}>
                    {count} desk{count === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="queue-capacity"
              label="Queue capacity"
              hint="The maximum number of visitors the demo queue will report as in use."
              error={errors.queueCapacity}
            >
              <input
                id="queue-capacity"
                type="number"
                min={5}
                max={200}
                step={5}
                value={draft.queueCapacity}
                onChange={(e) => update('queueCapacity', Number(e.target.value))}
                aria-invalid={errors.queueCapacity ? 'true' : 'false'}
                className={`${inputClass} tnum ${
                  errors.queueCapacity
                    ? 'border-coral focus:border-coral focus:ring-coral/15'
                    : 'border-line focus:border-teal focus:ring-teal/15'
                }`}
              />
            </Field>

            <Field
              id="grace-period"
              label="No-show grace period (minutes)"
              hint="How long a called token is held before it is released back to the queue."
              error={errors.noShowGraceMin}
            >
              <input
                id="grace-period"
                type="number"
                min={0}
                max={30}
                value={draft.noShowGraceMin}
                onChange={(e) => update('noShowGraceMin', Number(e.target.value))}
                aria-invalid={errors.noShowGraceMin ? 'true' : 'false'}
                className={`${inputClass} tnum ${
                  errors.noShowGraceMin
                    ? 'border-coral focus:border-coral focus:ring-coral/15'
                    : 'border-line focus:border-teal focus:ring-teal/15'
                }`}
              />
            </Field>
          </div>
        </section>

        <div className="space-y-5">
          {/* Simulation */}
          <section className="rounded-card border border-line bg-white p-5 shadow-xs">
            <h2 className="text-[15px] font-semibold text-navy">Demo simulation</h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              Controls for the automatic ticker that keeps the demo queue moving.
            </p>

            <div className="mt-5 space-y-5">
              <Field
                id="update-interval"
                label="Demo update interval (seconds)"
                hint="How often the automatic simulation advances the queue. Manual actions always work regardless."
                error={errors.demoUpdateIntervalSec}
              >
                <input
                  id="update-interval"
                  type="number"
                  min={4}
                  max={120}
                  value={draft.demoUpdateIntervalSec}
                  onChange={(e) => update('demoUpdateIntervalSec', Number(e.target.value))}
                  aria-invalid={errors.demoUpdateIntervalSec ? 'true' : 'false'}
                  className={`${inputClass} tnum ${
                    errors.demoUpdateIntervalSec
                      ? 'border-coral focus:border-coral focus:ring-coral/15'
                      : 'border-line focus:border-teal focus:ring-teal/15'
                  }`}
                />
              </Field>

              <div>
                <span className="block text-[13px] font-medium text-navy">Motion behaviour</span>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-muted">
                  The app always respects your operating system&apos;s reduced-motion setting. This
                  option reduces the app&apos;s own decorative motion on top of that.
                </p>
                <div className="mt-2.5 inline-flex rounded-control border border-line bg-canvas p-1">
                  {(['full', 'reduced'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => update('motionScale', option)}
                      aria-pressed={draft.motionScale === option}
                      className={`rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors ${
                        draft.motionScale === option
                          ? 'bg-white text-navy shadow-xs'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {option === 'full' ? 'Full motion' : 'Reduced motion'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-control border border-line p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-navy">Automatic simulation</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-muted">
                      {state.isSimulating
                        ? 'Running — the queue advances on its own.'
                        : 'Paused — the queue only changes when you act on it.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={state.isSimulating ? 'secondary' : 'primary'}
                    onClick={() => dispatch({ type: 'toggle-simulation' })}
                  >
                    {state.isSimulating ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-card border border-line bg-white p-5 shadow-xs">
            <h2 className="text-[15px] font-semibold text-navy">Notification preferences</h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              These control the in-app demo panel only. No SMS, email, or push message is ever sent.
            </p>

            <div className="mt-5 space-y-2.5">
              {[
                {
                  key: 'notificationsEnabled' as const,
                  label: 'Enable in-app notifications',
                  detail: 'Shows a toast when a queue event happens.',
                },
                {
                  key: 'notifyOnCalled' as const,
                  label: 'Notify when a token is called',
                  detail: 'The patient screen shows a call banner.',
                },
                {
                  key: 'notifyOnEstimateChange' as const,
                  label: 'Notify when an estimate changes',
                  detail: 'The patient screen explains why the wait moved.',
                },
                {
                  key: 'notifyOnNoShow' as const,
                  label: 'Notify on no-show recordings',
                  detail: 'Staff see a notification when a slot is released.',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-control border border-line px-3.5 py-3 transition-colors hover:bg-canvas"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-navy">{item.label}</span>
                    <span className="mt-0.5 block text-[11.5px] text-ink-muted">{item.detail}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft[item.key]}
                    onChange={(e) => update(item.key, e.target.checked)}
                    className="size-4.5 shrink-0 cursor-pointer rounded border-line text-teal accent-teal"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Service types reference */}
          <section className="rounded-card border border-line bg-white p-5 shadow-xs">
            <h2 className="text-[15px] font-semibold text-navy">Service types in this demo</h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              Baseline durations and variability used by the wait-time model.
            </p>
            <ul className="mt-4 divide-y divide-line">
              {SERVICE_TYPES.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-navy">{service.name}</span>
                    <span className="mt-0.5 block text-[11.5px] text-ink-muted">
                      {service.description}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-right text-[12px] text-ink-muted">
                    {service.baseDurationMin} min
                    <br />
                    ±{service.variabilityMin}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Simulation vs integration */}
      <section className="rounded-card border border-line bg-white p-5 shadow-xs">
        <h2 className="text-[15px] font-semibold text-navy">What is simulated, and what is not</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-control border border-success/25 bg-success/[0.05] p-4">
            <div className="flex items-center gap-2">
              <Check aria-hidden className="size-4 text-success" strokeWidth={2.4} />
              <h3 className="text-[13px] font-semibold text-navy">Works in this demo</h3>
            </div>
            <ul className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-ink-muted">
              <li>Queue ordering, token issuance, and position tracking</li>
              <li>Wait-time estimates recalculated from live state</li>
              <li>Service-desk actions with guarded status transitions</li>
              <li>Scenario simulation and a full activity log</li>
              <li>Settings persisted to this browser&apos;s local storage</li>
            </ul>
          </div>
          <div className="rounded-control border border-amber/25 bg-amber/[0.05] p-4">
            <div className="flex items-center gap-2">
              <TriangleAlert aria-hidden className="size-4 text-amber" strokeWidth={2.2} />
              <h3 className="text-[13px] font-semibold text-navy">Not implemented</h3>
            </div>
            <ul className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-ink-muted">
              <li>No backend, database, or server-side persistence</li>
              <li>No authentication, accounts, or role-based access</li>
              <li>No SMS, email, or push notification delivery</li>
              <li>No live WebSocket or real-time data feed</li>
              <li>No patient records or real appointment integration</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-control bg-canvas px-3.5 py-3 text-[12px] leading-relaxed text-ink-muted">
          <Info aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2} />
          <span>
            The state layer is designed so a real API and WebSocket feed can replace the local
            reducer without changing the screens that consume it.
          </span>
        </p>
      </section>

      {/* Restore dialog */}
      <ConfirmationDialog
        open={restoreOpen}
        title="Restore the default demo settings?"
        description="Service desk name, durations, desk count, capacity, and the update interval will be returned to their starting values. The queue itself is not affected."
        confirmLabel="Restore defaults"
        tone="warning"
        onCancel={() => setRestoreOpen(false)}
        onConfirm={restoreDefaults}
      />

      {/* Reset */}
      <section className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-navy">Reset the demo queue</h2>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            Clears all queue entries, events, and saved state, returning the demo to its starting point.
          </p>
        </div>
        <Button
          variant="danger"
          onClick={resetDemo}
          icon={<RotateCcw aria-hidden className="size-4" strokeWidth={2.1} />}
          className="shrink-0"
        >
          Reset demo data
        </Button>
      </section>

      <div className="flex justify-end">
        <Badge tone="teal" dot>
          Saved locally in this browser
        </Badge>
      </div>
    </div>
  );
}