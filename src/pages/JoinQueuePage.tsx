import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Info,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { CLINICS, SERVICE_TYPES } from '../data/demoData';
import type { ServiceId } from '../types/queue';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DemoNotice } from '../components/queue/DemoNotice';
import { Logo } from '../components/ui/Logo';
import { Link } from 'react-router-dom';

const STEPS = ['Clinic & service', 'Your details', 'Review', 'Confirmed'];

interface FormState {
  clinicId: string;
  serviceId: ServiceId;
  name: string;
}

export default function JoinQueuePage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { dispatch, state, settings, entries } = useQueue();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    clinicId: settings.clinicId,
    serviceId: SERVICE_TYPES[0].id,
    name: '',
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);

  const clinic = useMemo(
    () => CLINICS.find((c) => c.id === form.clinicId) ?? CLINICS[0],
    [form.clinicId],
  );
  const service = useMemo(
    () => SERVICE_TYPES.find((s) => s.id === form.serviceId) ?? SERVICE_TYPES[0],
    [form.serviceId],
  );
  const availableServices = useMemo(
    () => SERVICE_TYPES.filter((s) => clinic.serviceIds.includes(s.id)),
    [clinic],
  );

  const waitingCount = entries.filter(
    (e) => e.status === 'waiting' || e.status === 'called',
  ).length;
  const activeDesks = state.desks.filter((d) => !d.isPaused).length;

  // Pre-estimate shown on the review step (mirrors the engine's rough shape).
  const peopleAhead = waitingCount;
  const roughWait = Math.round(peopleAhead * service.baseDurationMin * 0.5);
  const roughRange: [number, number] = [Math.max(2, roughWait - 4), roughWait + 6];

  const validateName = () => {
    const trimmed = form.name.trim();
    if (trimmed.length < 2) {
      setNameError('Please enter a name with at least 2 characters.');
      return false;
    }
    if (trimmed.length > 40) {
      setNameError('Please keep the name under 40 characters.');
      return false;
    }
    setNameError(null);
    return true;
  };

  const next = () => {
    if (step === 1 && !validateName()) return;
    setStep((s) => Math.min(STEPS.length - 2, s + 1));
  };

  const back = () => {
    if (step === 0) {
      navigate('/');
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  const confirm = () => {
    setSubmitting(true);
    // Simulated network latency so the button's loading state is visible.
    window.setTimeout(() => {
      const token = `QL-${String(state.tokenCounter).padStart(3, '0')}`;
      const deskId = state.desks.find((d) => !d.isPaused)?.id ?? state.desks[0].id;
      dispatch({
        type: 'join-queue',
        visitorName: form.name.trim(),
        serviceId: form.serviceId,
        deskId,
        token,
      });
      setIssuedToken(token);
      setSubmitting(false);
      setStep(3);
    }, 620);
  };

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[900px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="rounded-lg">
            <Logo size={30} />
          </Link>
          <Link
            to="/staff"
            className="text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Staff demo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-[30px]">
            Join a queue
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            Pick a service, tell us who you are, and we will issue a token with a live wait
            estimate.
          </p>
        </div>

        {/* Progress indicator */}
        <ol className="mb-8 flex items-center gap-1.5 sm:gap-2" aria-label="Progress">
          {STEPS.map((label, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <motion.span
                    animate={{ scaleX: index <= step ? 1 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-1 w-full origin-left rounded-full ${
                      index <= step ? 'bg-teal' : 'bg-navy/10'
                    }`}
                  />
                  <span
                    className={`hidden truncate text-[11px] font-medium sm:block ${
                      active ? 'text-navy' : done ? 'text-teal' : 'text-ink-muted'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ---- Step 0: clinic & service ---- */}
            {step === 0 && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-[15px] font-semibold text-navy">Choose a clinic</h2>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    All clinics in this demo are fictional.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {CLINICS.map((option) => {
                      const selected = form.clinicId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setForm((f) => {
                              const nextServices = CLINICS.find((c) => c.id === option.id)!;
                              const stillValid = nextServices.serviceIds.includes(f.serviceId);
                              return {
                                ...f,
                                clinicId: option.id,
                                serviceId: stillValid
                                  ? f.serviceId
                                  : nextServices.serviceIds[0],
                              };
                            })
                          }
                          aria-pressed={selected}
                          className={`rounded-card border p-4 text-left transition-all duration-200 ${
                            selected
                              ? 'border-teal bg-mint-soft shadow-sm'
                              : 'border-line bg-white hover:border-navy/20 hover:shadow-xs'
                          }`}
                        >
                          <span
                            className={`grid size-9 place-items-center rounded-[10px] ${
                              selected ? 'bg-teal text-white' : 'bg-canvas text-ink-muted'
                            }`}
                          >
                            <Building2 aria-hidden className="size-4.5" strokeWidth={2} />
                          </span>
                          <p className="mt-3 text-[13.5px] leading-snug font-semibold text-navy">
                            {option.name}
                          </p>
                          <p className="mt-1 text-[11.5px] text-ink-muted">{option.locality}</p>
                          <p className="mt-2 text-[11.5px] text-ink-muted">
                            <Clock aria-hidden className="mr-1 inline size-3" strokeWidth={2.2} />
                            {option.hours}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h2 className="text-[15px] font-semibold text-navy">What do you need?</h2>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {availableServices.map((option) => {
                      const selected = form.serviceId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, serviceId: option.id }))}
                          aria-pressed={selected}
                          className={`flex items-start gap-3 rounded-control border p-3.5 text-left transition-all duration-200 ${
                            selected
                              ? 'border-teal bg-mint-soft shadow-sm'
                              : 'border-line bg-white hover:border-navy/20'
                          }`}
                        >
                          <span
                            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                              selected ? 'border-teal bg-teal' : 'border-line'
                            }`}
                          >
                            {selected && (
                              <Check aria-hidden className="size-3 text-white" strokeWidth={3.2} />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[13.5px] font-semibold text-navy">
                              {option.name}
                            </span>
                            <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-muted">
                              {option.description}
                            </span>
                            <span className="mt-1.5 inline-block rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink-muted">
                              ~{option.baseDurationMin} min typical
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ---- Step 1: details ---- */}
            {step === 1 && (
              <div className="rounded-card border border-line bg-white p-6 shadow-xs">
                <h2 className="text-[15px] font-semibold text-navy">Who is joining?</h2>
                <p className="mt-1 text-[13px] text-ink-muted">
                  This name appears on the staff console so they know who to call.
                </p>
                <label htmlFor="visitor-name" className="mt-5 block text-[13px] font-medium text-ink">
                  Display name
                </label>
                <input
                  id="visitor-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    if (nameError) setNameError(null);
                  }}
                  onBlur={validateName}
                  placeholder="e.g. Anita Whitfield"
                  maxLength={40}
                  autoComplete="off"
                  aria-invalid={nameError ? 'true' : 'false'}
                  aria-describedby={nameError ? 'name-error' : 'name-hint'}
                  className={`mt-2 h-11 w-full rounded-control border bg-white px-3.5 text-[14px] text-ink transition-colors placeholder:text-ink-muted/60 focus:ring-2 focus:outline-none ${
                    nameError
                      ? 'border-coral focus:border-coral focus:ring-coral/15'
                      : 'border-line focus:border-teal focus:ring-teal/15'
                  }`}
                />
                {nameError ? (
                  <p id="name-error" role="alert" className="mt-2 text-[12.5px] font-medium text-coral">
                    {nameError}
                  </p>
                ) : (
                  <p id="name-hint" className="mt-2 text-[12px] text-ink-muted">
                    2–40 characters. Please do not use a real patient identifier.
                  </p>
                )}
              </div>
            )}

            {/* ---- Step 2: review ---- */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="rounded-card border border-line bg-white p-6 shadow-xs">
                  <h2 className="text-[15px] font-semibold text-navy">Check your details</h2>
                  <dl className="mt-5 divide-y divide-line">
                    {[
                      { label: 'Clinic', value: clinic.name },
                      { label: 'Service', value: service.name },
                      { label: 'Name', value: form.name.trim() },
                      { label: 'Service desk', value: settings.deskName },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                        <dt className="text-[13px] text-ink-muted">{row.label}</dt>
                        <dd className="text-[13.5px] font-semibold text-navy">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="rounded-card border border-line bg-white p-6 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-[10px] bg-mint-soft text-teal">
                      <Clock aria-hidden className="size-4" strokeWidth={2.1} />
                    </span>
                    <div>
                      <h3 className="text-[14px] font-semibold text-navy">
                        Current waiting conditions
                      </h3>
                      <p className="text-[11.5px] text-ink-muted">
                        A preview before you commit — the real estimate is calculated when you join.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[10px] bg-canvas p-3.5">
                      <p className="text-[11px] text-ink-muted">Estimated wait</p>
                      <p className="tnum mt-1.5 text-xl font-semibold text-navy">
                        {roughRange[0]}–{roughRange[1]} min
                      </p>
                    </div>
                    <div className="rounded-[10px] bg-canvas p-3.5">
                      <p className="text-[11px] text-ink-muted">People ahead</p>
                      <p className="tnum mt-1.5 text-xl font-semibold text-navy">{peopleAhead}</p>
                    </div>
                    <div className="rounded-[10px] bg-canvas p-3.5">
                      <p className="text-[11px] text-ink-muted">Desks serving</p>
                      <p className="tnum mt-1.5 text-xl font-semibold text-navy">{activeDesks}</p>
                    </div>
                  </div>

                  <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-ink-muted">
                    <Info aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2} />
                    <span>
                      Estimates are a range based on recent service durations. They update whenever the
                      queue changes, and they are not a guarantee of when you will be called.
                    </span>
                  </p>
                </div>

                <DemoNotice />
              </div>
            )}

            {/* ---- Step 3: confirmed ---- */}
            {step === 3 && (
              <div className="rounded-card border border-line bg-white p-8 text-center shadow-xs">
                <motion.span
                  initial={reduceMotion ? undefined : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="mx-auto grid size-14 place-items-center rounded-full bg-success/12 text-success"
                >
                  <Check aria-hidden className="size-7" strokeWidth={2.6} />
                </motion.span>
                <h2 className="mt-5 text-xl font-semibold text-navy">You are in the queue</h2>
                <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-ink-muted">
                  {form.name.trim()}, you have been added to the {service.name} queue at{' '}
                  {clinic.name}.
                </p>

                <div className="mx-auto mt-6 max-w-sm rounded-[12px] border border-line bg-canvas p-5">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                    Your token
                  </p>
                  <p className="tnum mt-2 text-[40px] leading-none font-semibold tracking-tight text-navy">
                    {issuedToken ?? 'QL-000'}
                  </p>
                </div>

                <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
                  <Button
                    size="lg"
                    trailingIcon={<ArrowRight aria-hidden className="size-4" strokeWidth={2.5} />}
                    onClick={() => issuedToken && navigate(`/queue/${issuedToken}`)}
                  >
                    Track my token
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => navigate('/')}>
                    Back to home
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer actions */}
        {step < 3 && (
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} icon={<ArrowLeft aria-hidden className="size-4" strokeWidth={2.2} />}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < 2 ? (
              <Button onClick={next} trailingIcon={<ArrowRight aria-hidden className="size-4" strokeWidth={2.4} />}>
                Continue
              </Button>
            ) : (
              <Button
                onClick={confirm}
                loading={submitting}
                success={!submitting && step === 2}
                trailingIcon={<ChevronRight aria-hidden className="size-4" strokeWidth={2.4} />}
              >
                {submitting ? 'Joining queue…' : 'Join the queue'}
              </Button>
            )}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-[900px] px-5 pb-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <p className="text-[12px] text-ink-muted">
            <Users aria-hidden className="mr-1.5 inline size-3.5" strokeWidth={2.2} />
            {waitingCount} people currently waiting in this demo queue
          </p>
          <Badge tone="amber">
            <Stethoscope aria-hidden className="size-3" strokeWidth={2.4} />
            Simulated demo
          </Badge>
        </div>
      </footer>
    </div>
  );
}
