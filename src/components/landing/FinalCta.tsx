import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Reveal } from '../motion/Reveal';

export function FinalCta() {
  return (
    <section id="for-clinics" className="scroll-mt-24 relative overflow-hidden bg-navy py-20 sm:py-24">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.4),transparent_68%)] blur-3xl animate-drift-b" />
        <div className="absolute -right-24 -bottom-24 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.16),transparent_68%)] blur-3xl animate-drift-a" />
        <div className="absolute inset-0 bg-grid-faint" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.75rem]">
            Give people their time back
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/60 sm:text-[16px]">
            A queue that tells the truth. Join the demo, move a visitor, and watch every estimate
            in the building update at once.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/join" className="sm:w-auto">
              <Button
                size="lg"
                variant="mint"
                className="w-full sm:w-auto"
                trailingIcon={<ArrowRight aria-hidden className="size-4" strokeWidth={2.5} />}
              >
                Join a queue
              </Button>
            </Link>
            <Link to="/staff" className="sm:w-auto">
              <Button size="lg" variant="outline-dark" className="w-full sm:w-auto">
                Open staff dashboard
              </Button>
            </Link>
          </div>

          <p className="mx-auto mt-8 max-w-lg text-[12px] leading-relaxed text-white/35">
            QueueLess is a frontend-only demonstration. No backend, database, authentication, or
            messaging service is connected, and no data shown describes a real clinic or patient.
          </p>
        </Reveal>
      </div>
    </section>
  );
}