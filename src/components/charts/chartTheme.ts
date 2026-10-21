/**
 * Shared chart styling so every Recharts surface reads as one system.
 */

export const CHART_COLORS = {
  teal: '#0F766E',
  tealLight: '#5EEAD4',
  mint: '#A7F3E4',
  mintSoft: '#E8FAF6',
  navy: '#101828',
  navySoft: '#344054',
  amber: '#F59E0B',
  coral: '#F97066',
  success: '#12B76A',
  grid: '#E4E7EC',
  axis: '#667085',
} as const;

export const AXIS_PROPS = {
  stroke: CHART_COLORS.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const GRID_PROPS = {
  stroke: CHART_COLORS.grid,
  strokeDasharray: '3 3',
  vertical: false,
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 10,
    border: '1px solid #E4E7EC',
    boxShadow: '0 8px 24px -8px rgb(16 24 40 / 0.16)',
    fontSize: 12,
    padding: '8px 10px',
    backgroundColor: '#FFFFFF',
  },
  labelStyle: {
    fontWeight: 600,
    color: '#101828',
    marginBottom: 4,
    fontSize: 12,
  },
  itemStyle: { padding: '1px 0' },
} as const;

export const CURSOR_PROPS = {
  fill: '#0F766E',
  fillOpacity: 0.06,
} as const;

export const SERIES = [
  { key: 'teal', color: CHART_COLORS.teal },
  { key: 'mint', color: CHART_COLORS.tealLight },
  { key: 'navy', color: CHART_COLORS.navy },
  { key: 'amber', color: CHART_COLORS.amber },
  { key: 'coral', color: CHART_COLORS.coral },
  { key: 'success', color: CHART_COLORS.success },
] as const;

/** Animation config for chart entrance. */
export const CHART_ANIMATION = {
  duration: 700,
  easing: 'ease-out' as const,
};