import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_PROPS, CHART_ANIMATION, CHART_COLORS, CURSOR_PROPS, GRID_PROPS, TOOLTIP_STYLE } from './chartTheme';

export interface DistributionBucket {
  bucket: string;
  visitors: number;
}

/** Wait-time distribution — how many visitors fall into each wait band. */
export function WaitDistributionChart({ data }: { data: DistributionBucket[] }) {
  const max = Math.max(...data.map((d) => d.visitors), 1);

  return (
    <div className="h-[240px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="bucket" {...AXIS_PROPS} dy={4} />
          <YAxis {...AXIS_PROPS} width={38} allowDecimals={false} />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={CURSOR_PROPS}
            labelFormatter={(label) => `Wait ${label}`}
            formatter={(value) => [`${value} visitors`, 'Visitors']}
          />
          <Bar dataKey="visitors" radius={[5, 5, 0, 0]} maxBarSize={44} animationDuration={CHART_ANIMATION.duration}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.bucket}-${index}`}
                fill={entry.visitors === max ? CHART_COLORS.teal : CHART_COLORS.mint}
              />
            ))}
            <LabelList
              dataKey="visitors"
              position="top"
              style={{ fontSize: 10.5, fill: '#667085', fontVariantNumeric: 'tabular-nums' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}