import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-5">
      <div className="w-full max-w-md text-center">
        <Logo size={40} withWordmark={false} className="mx-auto" />
        <p className="tnum mt-8 text-[64px] leading-none font-semibold tracking-tight text-navy">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold text-navy">This page is not in the queue</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
          The link you followed does not match any part of the QueueLess demo. Try the dashboard or
          join a queue to get started.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Link to="/">
            <Button variant="secondary" fullWidth>
              Back to home
            </Button>
          </Link>
          <Link to="/staff">
            <Button fullWidth>Open demo dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}