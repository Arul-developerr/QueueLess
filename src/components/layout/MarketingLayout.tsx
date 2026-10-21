import { Outlet } from 'react-router-dom';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';

/** Public-facing shell with the sticky marketing nav and footer. */
export function MarketingLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <MarketingNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}