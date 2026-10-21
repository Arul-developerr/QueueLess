import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { QueueProvider, useQueue } from './context/QueueContext';
import { MarketingLayout } from './components/layout/MarketingLayout';
import { StaffLayout } from './components/layout/StaffLayout';
import { PageTransition } from './components/layout/PageTransition';
import { NotificationToast } from './components/ui/NotificationToast';
import { Logo } from './components/ui/Logo';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const JoinQueuePage = lazy(() => import('./pages/JoinQueuePage'));
const QueueTrackingPage = lazy(() => import('./pages/QueueTrackingPage'));
const StaffOverviewPage = lazy(() => import('./pages/StaffOverviewPage'));
const QueueControlPage = lazy(() => import('./pages/QueueControlPage'));
const ForecastPage = lazy(() => import('./pages/ForecastPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/** Keeps the document title in sync with the active route. */
function useDocumentTitle() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    let title = 'QueueLess — Your time matters. Your queue, under control.';

    if (path === '/') title = 'QueueLess — Waiting less. Knowing more.';
    else if (path === '/join') title = 'Join a queue — QueueLess';
    else if (path.startsWith('/queue/'))
      title = `Token ${path.split('/').pop()?.toUpperCase()} — QueueLess`;
    else if (path === '/staff') title = 'Staff overview — QueueLess';
    else if (path === '/staff/queue') title = 'Queue control — QueueLess';
    else if (path === '/staff/forecast') title = 'Wait-time intelligence — QueueLess';
    else if (path === '/staff/analytics') title = 'Queue analytics — QueueLess';
    else if (path === '/staff/settings') title = 'Settings — QueueLess';

    document.title = title;
  }, [location.pathname]);
}

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="animate-pulse">
          <Logo size={38} withWordmark={false} />
        </span>
        <p className="text-[12.5px] text-ink-muted">Loading…</p>
      </div>
    </div>
  );
}

function ToastHost() {
  const { toasts, dismissToast } = useQueue();
  return <NotificationToast toasts={toasts} onDismiss={dismissToast} />;
}

export default function App() {
  useDocumentTitle();

  return (
    <QueueProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route
              index
              element={
                <PageTransition>
                  <LandingPage />
                </PageTransition>
              }
            />
            <Route
              path="join"
              element={
                <PageTransition>
                  <JoinQueuePage />
                </PageTransition>
              }
            />
            <Route
              path="queue/:token"
              element={
                <PageTransition>
                  <QueueTrackingPage />
                </PageTransition>
              }
            />
          </Route>

          <Route path="staff" element={<StaffLayout />}>
            <Route index element={<StaffOverviewPage />} />
            <Route path="queue" element={<QueueControlPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
            }
          />
        </Routes>
      </Suspense>
      <ToastHost />
    </QueueProvider>
  );
}