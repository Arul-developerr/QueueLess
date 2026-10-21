import {
  ChartNoAxesColumn,
  Gauge,
  LayoutDashboard,
  ListOrdered,
  Settings,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Marks the item that is currently active. */
  end?: boolean;
  description: string;
}

export const STAFF_NAV: NavItem[] = [
  {
    label: 'Overview',
    to: '/staff',
    icon: LayoutDashboard,
    end: true,
    description: 'Live queue health and key metrics',
  },
  {
    label: 'Queue control',
    to: '/staff/queue',
    icon: ListOrdered,
    description: 'Call, serve, and close out visitors',
  },
  {
    label: 'Wait-time intelligence',
    to: '/staff/forecast',
    icon: TrendingUp,
    description: 'Forecast ranges and scenario modelling',
  },
  {
    label: 'Analytics',
    to: '/staff/analytics',
    icon: ChartNoAxesColumn,
    description: 'Historical performance across the demo dataset',
  },
  {
    label: 'Settings',
    to: '/staff/settings',
    icon: Settings,
    description: 'Service desk and simulation preferences',
  },
];

export const MARKETING_NAV = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'For clinics', href: '#for-clinics' },
];

export { Gauge };