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

export interface ScenarioRange {
  name: string;
  min: number;
  max: number;
}

/** Compares predicted waiting ranges across scenarios. */
export function ScenarioRangeChart({ data }: { data: ScenarioRange[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, left: -20, bottom: 0 }} barGap={6}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="name" {...AXIS_PROPS} dy={4} />
          <YAxis {...AXIS_PROPS} width={40} />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={CURSOR_PROPS}
            labelFormatter={(label) => `Scenario: ${label}`}
            formatter={(value, name) => [`${value} min`, name === 'min' ? 'Earliest' : 'Latest']}
          />
          <Bar
            dataKey="max"
            name="max"
            fill={CHART_COLORS.teal}
            radius={[5, 5, 0, 0]}
            maxBarSize={38}
            animationDuration={CHART_ANIMATION.duration}
          />
          <Bar
            dataKey="min"
            name="min"
            fill={CHART_COLORS.mint}
            radius={[5, 5, 0, 0]}
            maxBarSize={38}
            animationDuration={CHART_ANIMATION.duration}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={CHART_COLORS.mint} />
            ))}
            <LabelList
              dataKey="max"
              position="top"
              formatter={(value: unknown) => `≤ ${value} min`}
              style={{ fontSize: 10.5, fill: '#667085', fontVariantNumeric: 'tabular-nums' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}