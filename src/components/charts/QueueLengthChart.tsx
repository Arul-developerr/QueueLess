import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_PROPS, CHART_ANIMATION, CHART_COLORS, CURSOR_PROPS, GRID_PROPS, TOOLTIP_STYLE } from './chartTheme';

export interface QueueLengthPoint {
  label: string;
  waiting: number;
  served: number;
}

/** Queue length over time — how many people were waiting versus served. */
export function QueueLengthChart({ data }: { data: QueueLengthPoint[] }) {
  return (
    <div className="h-[240px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-waiting" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.28} />
              <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="grad-served" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.mint} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.mint} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="label" {...AXIS_PROPS} dy={4} />
          <YAxis {...AXIS_PROPS} width={38} allowDecimals={false} />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={CURSOR_PROPS}
            labelFormatter={(label) => `Time: ${label}`}
            formatter={(value, name) => [
              `${value} people`,
              name === 'waiting' ? 'Waiting' : 'Served',
            ]}
          />
          <Area
            type="monotone"
            dataKey="served"
            name="served"
            stroke={CHART_COLORS.tealLight}
            strokeWidth={2}
            fill="url(#grad-served)"
            animationDuration={CHART_ANIMATION.duration}
            animationEasing={CHART_ANIMATION.easing}
          />
          <Area
            type="monotone"
            dataKey="waiting"
            name="waiting"
            stroke={CHART_COLORS.teal}
            strokeWidth={2.2}
            fill="url(#grad-waiting)"
            animationDuration={CHART_ANIMATION.duration}
            animationEasing={CHART_ANIMATION.easing}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}