/**
 * Revenue Chart Widget (Bar Chart)
 * Monthly statistics bar chart similar to the "Statistics" section in the flight dashboard
 *
 * Features:
 * - Animated bar chart using Recharts
 * - Multiple data series (bookings, revenue)
 * - Custom tooltips
 * - Responsive design
 * - Color scheme matching the dashboard theme
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatCompactNumber } from '@/lib/utils';
import { CHART_COLORS } from '@/lib/constants';

// ============================================
// TYPES
// ============================================

interface MonthlyData {
  month: string;
  bookings: number;
  revenue: number;
}

interface RevenueChartWidgetProps {
  data: MonthlyData[];
  title?: string;
  subtitle?: string;
  className?: string;
}

type ViewMode = 'bookings' | 'revenue';

// ============================================
// CUSTOM TOOLTIP
// ============================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: MonthlyData;
  }>;
  label?: string;
  viewMode: ViewMode;
}

function CustomTooltip({ active, payload, label, viewMode }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-sidebar rounded-xl p-4 shadow-lg border border-sidebar-hover"
    >
      <p className="text-accent-gold font-semibold text-sm mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400 text-xs">Bookings</span>
          <span className="text-white font-bold">{data.bookings}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400 text-xs">Revenue</span>
          <span className="text-accent-gold font-bold">{formatCurrency(data.revenue)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// BAR CHART COMPONENT
// ============================================

interface BarChartDisplayProps {
  data: MonthlyData[];
  viewMode: ViewMode;
}

function BarChartDisplay({ data, viewMode }: BarChartDisplayProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const barColor = viewMode === 'bookings' ? CHART_COLORS.primary : CHART_COLORS.secondary;
  const dataKey = viewMode;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        onMouseMove={(state) => {
          if (state.activeTooltipIndex !== undefined && typeof state.activeTooltipIndex === 'number') {
            setActiveIndex(state.activeTooltipIndex);
          }
        }}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#E5E7EB"
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          tickFormatter={(value) =>
            viewMode === 'revenue'
              ? formatCompactNumber(value)
              : value.toString()
          }
          dx={-10}
        />
        <Tooltip
          content={<CustomTooltip viewMode={viewMode} />}
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)', radius: 8 }}
        />
        <Bar
          dataKey={dataKey}
          radius={[8, 8, 0, 0]}
          maxBarSize={50}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={activeIndex === index ? CHART_COLORS.secondary : barColor}
              style={{
                transition: 'fill 0.2s ease',
                filter: activeIndex === index ? 'brightness(1.1)' : 'none',
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// MAIN WIDGET COMPONENT
// ============================================

export function RevenueChartWidget({
  data,
  title = 'Statistics',
  subtitle = 'Monthly performance overview',
  className,
}: RevenueChartWidgetProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bookings');

  // Calculate totals
  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  // Calculate growth (comparing last two months)
  const lastMonth = data[data.length - 1];
  const prevMonth = data[data.length - 2];
  const growth = prevMonth
    ? ((lastMonth[viewMode] - prevMonth[viewMode]) / prevMonth[viewMode]) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'bookings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('bookings')}
            className={cn(
              'text-xs h-8',
              viewMode === 'bookings'
                ? 'bg-sidebar text-white hover:bg-sidebar-hover'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Bookings
          </Button>
          <Button
            variant={viewMode === 'revenue' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('revenue')}
            className={cn(
              'text-xs h-8',
              viewMode === 'revenue'
                ? 'bg-sidebar text-white hover:bg-sidebar-hover'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Revenue
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-teal/10">
            <Calendar className="h-5 w-5 text-accent-teal" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Bookings</p>
            <p className="text-lg font-bold text-gray-900">{totalBookings}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-gold/10">
            <TrendingUp className="h-5 w-5 text-accent-gold" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        {/* Growth Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Month over month:</span>
          <span
            className={cn(
              'text-sm font-semibold px-2 py-0.5 rounded-full',
              growth >= 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
          </span>
        </div>

        {/* Bar Chart */}
        <BarChartDisplay data={data} viewMode={viewMode} />
      </div>
    </motion.div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function RevenueChartWidgetSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 gap-4 p-5 border-b border-gray-100">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="p-5">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-[280px] bg-gray-50 rounded-xl animate-pulse flex items-end justify-around p-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-10 bg-gray-200 rounded-t"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPACT VERSION
// ============================================

interface RevenueChartCompactProps {
  data: MonthlyData[];
  className?: string;
}

export function RevenueChartCompact({ data, className }: RevenueChartCompactProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-4', className)}>
      <h3 className="font-bold text-gray-900 mb-4">Monthly Revenue</h3>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <Bar
            dataKey="revenue"
            fill={CHART_COLORS.primary}
            radius={[4, 4, 0, 0]}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
