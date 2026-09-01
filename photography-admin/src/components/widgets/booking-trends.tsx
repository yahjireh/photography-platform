/**
 * Booking Trends Widget (Line Chart)
 * Shows booking trends over time similar to "Flights Schedule" in the flight dashboard
 *
 * Features:
 * - Animated area/line chart using Recharts
 * - Multiple data series (completed, cancelled)
 * - Interactive tooltip with data point highlight
 * - Gradient fill under the line
 * - Responsive design
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { TrendingUp, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatNumber } from '@/lib/utils';
import { CHART_COLORS } from '@/lib/constants';

// ============================================
// TYPES
// ============================================

interface BookingTrendData {
  month: string;
  bookings: number;
  completed: number;
  cancelled: number;
}

interface BookingTrendsWidgetProps {
  data: BookingTrendData[];
  title?: string;
  subtitle?: string;
  className?: string;
}

type DataSeries = 'bookings' | 'completed' | 'cancelled';

// ============================================
// CUSTOM TOOLTIP
// ============================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: BookingTrendData;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-sidebar rounded-xl p-4 shadow-lg border border-sidebar-hover min-w-[160px]"
    >
      <p className="text-accent-gold font-semibold text-sm mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-teal" />
            <span className="text-gray-400 text-xs">Total</span>
          </div>
          <span className="text-white font-bold">{formatNumber(data.bookings)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-gray-400 text-xs">Completed</span>
          </div>
          <span className="text-emerald-400 font-bold">{formatNumber(data.completed)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-gray-400 text-xs">Cancelled</span>
          </div>
          <span className="text-red-400 font-bold">{formatNumber(data.cancelled)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// CUSTOM DOT (for highlighted data point)
// ============================================

interface CustomDotProps {
  cx?: number;
  cy?: number;
  value?: number;
  payload?: BookingTrendData;
  index?: number;
  dataLength?: number;
}

function CustomActiveDot({ cx, cy }: CustomDotProps) {
  if (!cx || !cy) return null;

  return (
    <g>
      {/* Outer glow */}
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill={CHART_COLORS.primary}
        opacity={0.2}
      />
      {/* Main dot */}
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={CHART_COLORS.primary}
        stroke="white"
        strokeWidth={2}
      />
    </g>
  );
}

// ============================================
// PEAK INDICATOR
// ============================================

interface PeakIndicatorProps {
  data: BookingTrendData[];
}

function PeakIndicator({ data }: PeakIndicatorProps) {
  const maxBookings = Math.max(...data.map(d => d.bookings));
  const peakMonth = data.find(d => d.bookings === maxBookings);

  if (!peakMonth) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-sidebar rounded-lg">
      <div className="p-1.5 rounded-full bg-accent-gold/20">
        <TrendingUp className="h-4 w-4 text-accent-gold" />
      </div>
      <div>
        <p className="text-xs text-gray-400">Peak Month</p>
        <p className="text-sm font-bold text-white">
          {peakMonth.month} • {formatNumber(maxBookings)} bookings
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN WIDGET COMPONENT
// ============================================

export function BookingTrendsWidget({
  data,
  title = 'Booking Trends',
  subtitle = 'Monthly booking activity',
  className,
}: BookingTrendsWidgetProps) {
  const [activeSeries, setActiveSeries] = useState<DataSeries[]>(['bookings', 'completed']);

  const toggleSeries = (series: DataSeries) => {
    if (activeSeries.includes(series)) {
      if (activeSeries.length > 1) {
        setActiveSeries(activeSeries.filter(s => s !== series));
      }
    } else {
      setActiveSeries([...activeSeries, series]);
    }
  };

  // Calculate totals
  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);
  const totalCompleted = data.reduce((sum, item) => sum + item.completed, 0);
  const completionRate = totalBookings > 0 ? (totalCompleted / totalBookings) * 100 : 0;

  // Find peak data point for annotation
  const peakIndex = data.reduce((maxIdx, item, idx, arr) =>
    item.bookings > arr[maxIdx].bookings ? idx : maxIdx, 0);
  const peakData = data[peakIndex];

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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Series Toggle */}
        <div className="flex items-center gap-2">
          <SeriesButton
            label="Total"
            color={CHART_COLORS.primary}
            active={activeSeries.includes('bookings')}
            onClick={() => toggleSeries('bookings')}
          />
          <SeriesButton
            label="Completed"
            color={CHART_COLORS.success}
            active={activeSeries.includes('completed')}
            onClick={() => toggleSeries('completed')}
          />
          <SeriesButton
            label="Cancelled"
            color={CHART_COLORS.danger}
            active={activeSeries.includes('cancelled')}
            onClick={() => toggleSeries('cancelled')}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-teal/10">
            <Calendar className="h-5 w-5 text-accent-teal" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Bookings</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(totalBookings)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(totalCompleted)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-gold/10">
            <TrendingUp className="h-5 w-5 text-accent-gold" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Completion Rate</p>
            <p className="text-lg font-bold text-gray-900">{completionRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradientBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientCancelled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.danger} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.danger} stopOpacity={0} />
              </linearGradient>
            </defs>

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
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />

            {activeSeries.includes('bookings') && (
              <Area
                type="monotone"
                dataKey="bookings"
                stroke={CHART_COLORS.primary}
                strokeWidth={3}
                fill="url(#gradientBookings)"
                activeDot={<CustomActiveDot />}
              />
            )}

            {activeSeries.includes('completed') && (
              <Area
                type="monotone"
                dataKey="completed"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                fill="url(#gradientCompleted)"
                strokeDasharray="5 5"
              />
            )}

            {activeSeries.includes('cancelled') && (
              <Area
                type="monotone"
                dataKey="cancelled"
                stroke={CHART_COLORS.danger}
                strokeWidth={2}
                fill="url(#gradientCancelled)"
                strokeDasharray="3 3"
              />
            )}

            {/* Peak annotation */}
            {activeSeries.includes('bookings') && (
              <ReferenceDot
                x={peakData.month}
                y={peakData.bookings}
                r={0}
                label={{
                  value: `${formatNumber(peakData.bookings)}`,
                  position: 'top',
                  fill: CHART_COLORS.primary,
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ============================================
// SERIES TOGGLE BUTTON
// ============================================

interface SeriesButtonProps {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}

function SeriesButton({ label, color, active, onClick }: SeriesButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        active
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-400 hover:text-gray-600'
      )}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full transition-opacity',
          active ? 'opacity-100' : 'opacity-40'
        )}
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function BookingTrendsWidgetSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 gap-4 p-5 border-b border-gray-100">
        {[1, 2, 3].map(i => (
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
        <div className="h-[300px] bg-gray-50 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// ============================================
// COMPACT VERSION
// ============================================

interface BookingTrendsCompactProps {
  data: BookingTrendData[];
  className?: string;
}

export function BookingTrendsCompact({ data, className }: BookingTrendsCompactProps) {
  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Booking Trends</h3>
        <span className="text-lg font-bold text-accent-teal">{formatNumber(totalBookings)}</span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradientCompact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="bookings"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            fill="url(#gradientCompact)"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
