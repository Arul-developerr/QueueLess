interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** A single shimmering placeholder block. */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton rounded-md ${className}`} style={style} aria-hidden />;
}

/** Placeholder that mirrors the shape of a KPI card. */
export function MetricCardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div className="w-2/3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
        <Skeleton className="size-9 rounded-[10px]" />
      </div>
      <Skeleton className="mt-4 h-3 w-32" />
    </div>
  );
}

/** Placeholder that mirrors the shape of a chart card. */
export function ChartCardSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-xs">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-2 h-3 w-52" />
      <Skeleton className="mt-5 w-full rounded-lg" style={{ height }} />
    </div>
  );
}

/** Placeholder rows for the queue table. */
export function TableRowsSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-line">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-3.5">
              <Skeleton className="h-3.5" style={{ width: `${45 + ((rowIndex + colIndex) % 4) * 14}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}