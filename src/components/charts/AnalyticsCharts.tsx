import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AXIS_PROPS,
  CHART_ANIMATION,
  CHART_COLORS,
  CURSOR_PROPS,
  GRID_PROPS,
  TOOLTIP_STYLE,
} from './chartTheme';

/* ------------------------------------------------------------------ *
 * Wait-time trend
 * ------------------------------------------------------------------ */

export interface TrendPoint {
  date: string;
  average: number;
  median: number;
}

export function WaitTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[260px] w-full sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-trend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.24} />
              <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="date" {...AXIS_PROPS} dy={4} minTickGap={24} />
          <YAxis {...AXIS_PROPS} width={38} unit="m" />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={CURSOR_PROPS}
            formatter={(value, name) => [`${value} min`, name === 'average' ? 'Average wait' : 'Median wait']}
          />
          <Area
            type="monotone"
            dataKey="average"
            name="average"
            stroke={CHART_COLORS.teal}
            strokeWidth={2.2}
            fill="url(#grad-trend)"
            animationDuration={CHART_ANIMATION.duration}
          />
          <Line
            type="monotone"
            dataKey="median"
            name="median"
            stroke={CHART_COLORS.navy}
            strokeWidth={1.8}
            strokeDasharray="4 3"
            dot={false}
            animationDuration={CHART_ANIMATION.duration}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Hourly arrival pattern
 * ------------------------------------------------------------------ */

export interface HourPoint {
  hour: string;
  arrivals: number;
  averageWait: number;
}

export function HourlyArrivalChart({ data }: { data: HourPoint[] }) {
  return (
    <div className="h-[240px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="hour" {...AXIS_PROPS} dy={4} interval={1} />
          <YAxis {...AXIS_PROPS} width={38} allowDecimals={false} />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={CURSOR_PROPS}
            labelFormatter={(label) => `Hour ${label}`}
            formatter={(value, name) => [
              name === 'arrivals' ? `${value} arrivals` : `${value} min`,
              name === 'arrivals' ? 'Arrivals' : 'Average wait',
            ]}
          />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 11.5, color: '#667085' }}>
                {value === 'arrivals' ? 'Arrivals' : 'Average wait'}
              </span>
            )}
          />
          <Bar
            dataKey="arrivals"
            name="arrivals"
            fill={CHART_COLORS.teal}
            radius={[4, 4, 0, 0]}
            maxBarSize={26}
            animationDuration={CHART_ANIMATION.duration}
          />
          <Line
            type="monotone"
            dataKey="averageWait"
            name="averageWait"
            stroke={CHART_COLORS.amber}
            strokeWidth={2}
            dot={false}
            yAxisId={0}
            animationDuration={CHART_ANIMATION.duration}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Service-type comparison
 * ------------------------------------------------------------------ */

export interface ServiceComparisonPoint {
  service: string;
  averageWait: number;
  averageService: number;
  visits: number;
}

export function ServiceComparisonChart({ data }: { data: ServiceComparisonPoint[] }) {
  return (
    <div className="h-[260px] w-full sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="service" {...AXIS_PROPS} dy={4} interval={0} />
          <YAxis {...AXIS_PROPS} width={38} unit="m" />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={CURSOR_PROPS}
            labelFormatter={(label) => `Service: ${label}`}
            formatter={(value, name) => [
              `${value} min`,
              name === 'averageWait' ? 'Average wait' : 'Average service',
            ]}
          />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 11.5, color: '#667085' }}>
                {value === 'averageWait' ? 'Average wait' : 'Average service'}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="averageWait"
            name="averageWait"
            stroke={CHART_COLORS.teal}
            strokeWidth={2.2}
            dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.teal }}
            activeDot={{ r: 5 }}
            animationDuration={CHART_ANIMATION.duration}
          />
          <Line
            type="monotone"
            dataKey="averageService"
            name="averageService"
            stroke={CHART_COLORS.navy}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.navy }}
            activeDot={{ r: 5 }}
            animationDuration={CHART_ANIMATION.duration}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Service-duration distribution
 * ------------------------------------------------------------------ */

export interface DurationPoint {
  label: string;
  count: number;
}

export function ServiceDurationDistributionChart({ data }: { data: DurationPoint[] }) {
  return (
    <div className="h-[240px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="label" {...AXIS_PROPS} dy={4} />
          <YAxis {...AXIS_PROPS} width={38} allowDecimals={false} />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={CURSOR_PROPS}
            labelFormatter={(label) => `Service duration ${label}`}
            formatter={(value) => [`${value} services`, 'Completed services']}
          />
          <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={40} animationDuration={CHART_ANIMATION.duration}>
            {data.map((entry, index) => (
              <Cell
                key={`${entry.label}-${index}`}
                fill={index % 2 === 0 ? CHART_COLORS.teal : CHART_COLORS.mint}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}