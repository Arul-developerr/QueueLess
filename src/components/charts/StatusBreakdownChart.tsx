import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_ANIMATION, CHART_COLORS, TOOLTIP_STYLE } from './chartTheme';

export interface StatusSlice {
  name: string;
  value: number;
}

const COLORS = [
  CHART_COLORS.teal,
  CHART_COLORS.mint,
  CHART_COLORS.amber,
  CHART_COLORS.success,
  CHART_COLORS.coral,
  CHART_COLORS.navy,
];

/** Donut showing how the queue splits across statuses. */
export function StatusBreakdownChart({ data }: { data: StatusSlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return (
      <div className="grid h-[240px] place-items-center text-center text-[13px] text-ink-muted">
        No queue entries to summarise yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="relative h-[190px] w-[190px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value, name) => [`${value} visitors`, name]}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={2}
              strokeWidth={0}
              animationDuration={CHART_ANIMATION.duration}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="tnum text-2xl leading-none font-semibold text-navy">{total}</p>
            <p className="mt-1 text-[11px] text-ink-muted">entries</p>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {data.map((slice, index) => (
          <li key={slice.name} className="flex items-center gap-2.5 text-[12.5px]">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-ink-muted">{slice.name}</span>
            <span className="tnum ml-auto font-semibold text-navy">{slice.value}</span>
            <span className="tnum w-11 text-right text-ink-muted">
              {Math.round((slice.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}