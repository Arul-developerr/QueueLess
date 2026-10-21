import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_PROPS, CHART_ANIMATION, CHART_COLORS, CURSOR_PROPS, GRID_PROPS, TOOLTIP_STYLE } from './chartTheme';

export interface ServiceDurationPoint {
  service: string;
  estimated: number;
  actual: number;
}

/** Estimated versus actual service duration per service type. */
export function ServiceDurationChart({ data }: { data: ServiceDurationPoint[] }) {
  return (
    <div className="h-[240px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="service" {...AXIS_PROPS} dy={4} interval={0} />
          <YAxis {...AXIS_PROPS} width={38} />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={CURSOR_PROPS}
            labelFormatter={(label) => `Service: ${label}`}
            formatter={(value, name) => [`${value} min`, name === 'estimated' ? 'Estimated' : 'Actual average']}
          />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 11.5, color: '#667085' }}>
                {value === 'estimated' ? 'Estimated' : 'Actual average'}
              </span>
            )}
          />
          <Bar
            dataKey="estimated"
            fill={CHART_COLORS.mint}
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
            animationDuration={CHART_ANIMATION.duration}
            animationEasing={CHART_ANIMATION.easing}
          />
          <Bar
            dataKey="actual"
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
            animationDuration={CHART_ANIMATION.duration}
            animationEasing={CHART_ANIMATION.easing}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.service}-${index}`}
                fill={index % 2 === 0 ? CHART_COLORS.teal : CHART_COLORS.navy}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}