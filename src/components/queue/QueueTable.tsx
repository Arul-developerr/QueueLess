import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  SearchX,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { QueueEntry, QueueStatus } from '../../types/queue';
import { SERVICE_TYPE_MAP } from '../../data/demoData';
import { formatRelativeTime } from '../../lib/queueEngine';
import { STATUS_META } from '../../lib/statusMeta';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { SearchInput } from '../ui/SearchInput';
import { FilterBar } from '../ui/FilterBar';
import { TableRowsSkeleton } from '../ui/SkeletonLoader';

type SortKey = 'token' | 'visitor' | 'service' | 'position' | 'wait' | 'status';

interface QueueTableProps {
  entries: QueueEntry[];
  getPosition: (entryId: string) => number;
  getWait: (entryId: string) => { min: number; max: number } | undefined;
  onAction?: (entryId: string, action: 'call' | 'start' | 'complete') => void;
  loading?: boolean;
  pageSize?: number;
  /** Renders the mobile card layout instead of the table. */
  compact?: boolean;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'called', label: 'Called' },
  { value: 'in-service', label: 'In service' },
  { value: 'completed', label: 'Completed' },
  { value: 'no-show', label: 'No-show' },
];

/**
 * Live queue table with search, filtering, sorting, and pagination.
 * Falls back to a card layout on narrow screens.
 */
export function QueueTable({
  entries,
  getPosition,
  getWait,
  onAction,
  loading = false,
  pageSize = 8,
  compact = false,
}: QueueTableProps) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = entries.filter((entry) => {
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      const service = SERVICE_TYPE_MAP[entry.serviceId];
      return (
        entry.token.toLowerCase().includes(term) ||
        entry.visitorName.toLowerCase().includes(term) ||
        (service?.name.toLowerCase().includes(term) ?? false)
      );
    });

    const direction = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'token':
          return a.token.localeCompare(b.token) * direction;
        case 'visitor':
          return a.visitorName.localeCompare(b.visitorName) * direction;
        case 'service':
          return (
            (SERVICE_TYPE_MAP[a.serviceId]?.name ?? '').localeCompare(
              SERVICE_TYPE_MAP[b.serviceId]?.name ?? '',
            ) * direction
          );
        case 'position': {
          const posA = getPosition(a.id) || 999;
          const posB = getPosition(b.id) || 999;
          return (posA - posB) * direction || a.sequence - b.sequence;
        }
        case 'wait': {
          const waitA = getWait(a.id)?.max ?? 0;
          const waitB = getWait(b.id)?.max ?? 0;
          return (waitA - waitB) * direction;
        }
        case 'status':
          return a.status.localeCompare(b.status) * direction;
        default:
          return 0;
      }
    });
  }, [entries, query, statusFilter, sortKey, sortDir, getPosition, getWait]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <th scope="col" className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 text-[11.5px] font-semibold tracking-[0.06em] text-ink-muted uppercase transition-colors hover:text-ink"
        aria-label={`Sort by ${label}`}
      >
        {label}
        {sortKey === key &&
          (sortDir === 'asc' ? (
            <ArrowUp aria-hidden className="size-3" strokeWidth={2.6} />
          ) : (
            <ArrowDown aria-hidden className="size-3" strokeWidth={2.6} />
          ))}
      </button>
    </th>
  );

  const actionFor = (entry: QueueEntry) => {
    if (!onAction) return null;
    if (entry.status === 'waiting') {
      return (
        <Button size="sm" variant="secondary" onClick={() => onAction(entry.id, 'call')}>
          Call
        </Button>
      );
    }
    if (entry.status === 'called') {
      return (
        <Button size="sm" variant="secondary" onClick={() => onAction(entry.id, 'start')}>
          Start
        </Button>
      );
    }
    if (entry.status === 'in-service') {
      return (
        <Button size="sm" variant="secondary" onClick={() => onAction(entry.id, 'complete')}>
          Complete
        </Button>
      );
    }
    return (
      <span className="text-[12px] text-ink-muted">—</span>
    );
  };

  const hasFilters = query.trim().length > 0 || statusFilter !== 'all';

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(0);
          }}
          placeholder="Search token, visitor, or service…"
          label="Search the queue"
          className="w-full lg:max-w-[300px]"
        />
        <FilterBar
          label="Filter by status"
          options={STATUS_FILTERS.map((f) => ({
            ...f,
            count:
              f.value === 'all'
                ? entries.length
                : entries.filter((e) => e.status === (f.value as QueueStatus)).length,
          }))}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(0);
          }}
        />
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="bg-canvas/60">
              <tr>
                {['Token', 'Visitor', 'Service', 'Position', 'Est. wait', 'Status', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.06em] text-ink-muted uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              <TableRowsSkeleton rows={5} columns={7} />
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={hasFilters ? SearchX : CircleSlash}
          title={hasFilters ? 'No matching visitors' : 'The queue is empty'}
          description={
            hasFilters
              ? 'No visitors match the current search and filter. Try clearing them.'
              : 'Nobody is waiting right now. New check-ins will appear here automatically.'
          }
          action={
            hasFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
          compact
        />
      ) : compact ? (
        /* ---- Mobile card layout ---- */
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {visible.map((entry) => {
              const service = SERVICE_TYPE_MAP[entry.serviceId];
              const wait = getWait(entry.id);
              const meta = STATUS_META[entry.status];
              return (
                <motion.li
                  key={entry.id}
                  layout={reduceMotion ? false : 'position'}
                  initial={reduceMotion ? undefined : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="tnum text-[15px] font-semibold text-navy">{entry.token}</p>
                      <p className="mt-0.5 truncate text-[13px] text-ink">{entry.visitorName}</p>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                    <div>
                      <p className="text-ink-muted">Service</p>
                      <p className="mt-0.5 truncate font-medium text-navy">{service?.shortName}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Position</p>
                      <p className="tnum mt-0.5 font-medium text-navy">
                        {getPosition(entry.id) || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Est. wait</p>
                      <p className="tnum mt-0.5 font-medium text-navy">
                        {wait ? `${wait.min}–${wait.max}m` : '—'}
                      </p>
                    </div>
                  </div>
                  {onAction && (
                    <div className="mt-3">{actionFor(entry)}</div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      ) : (
        /* ---- Desktop table ---- */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-canvas/60">
              <tr>
                <SortHeader label="Token" sortKey="token" />
                <SortHeader label="Visitor" sortKey="visitor" />
                <SortHeader label="Service" sortKey="service" />
                <SortHeader label="Position" sortKey="position" />
                <SortHeader label="Est. wait" sortKey="wait" />
                <SortHeader label="Status" sortKey="status" />
                <th scope="col" className="px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.06em] text-ink-muted uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {visible.map((entry) => {
                  const service = SERVICE_TYPE_MAP[entry.serviceId];
                  const wait = getWait(entry.id);
                  const meta = STATUS_META[entry.status];
                  return (
                    <motion.tr
                      key={entry.id}
                      layout={reduceMotion ? false : 'position'}
                      initial={reduceMotion ? undefined : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0 }}
                      className="border-t border-line transition-colors hover:bg-canvas/50"
                    >
                      <td className="px-4 py-3">
                        <span className="tnum text-[13px] font-semibold text-navy">{entry.token}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] text-ink">{entry.visitorName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] text-ink-muted">{service?.shortName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="tnum text-[13px] font-medium text-ink">
                          {getPosition(entry.id) || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="tnum text-[13px] text-ink">
                          {wait ? `${wait.min}–${wait.max} min` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {actionFor(entry)}
                          <span className="text-[11px] text-ink-muted">
                            {formatRelativeTime(entry.joinedAt)}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <p className="tnum text-[12.5px] text-ink-muted">
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of{' '}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              icon={<ChevronLeft aria-hidden className="size-3.5" strokeWidth={2.4} />}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              trailingIcon={<ChevronRight aria-hidden className="size-3.5" strokeWidth={2.4} />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}