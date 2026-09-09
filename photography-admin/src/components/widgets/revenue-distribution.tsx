/**
 * Revenue Distribution Widget (Donut Chart)
 * Shows revenue breakdown by occasion type similar to "Flights Share" in the flight dashboard
 *
 * Features:
 * - Animated donut chart using Recharts
 * - Interactive segments with hover effects
 * - Legend with percentages
 * - Center label showing total
 * - Color palette matching dashboard theme
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { CHART_COLOR_PALETTE, OCCASION_TYPE_LABELS } from '@/lib/constants';
import { KenteRibbon } from '@/components/shared/kente-ribbon';

// ============================================
// TYPES
// ============================================

interface RevenueByOccasion {
  occasionType: string;
  revenue: number;
  bookings: number;
  percentage: number;
  [key: string]: string | number;
}

interface RevenueDistributionWidgetProps {
  data: RevenueByOccasion[];
  title?: string;
  subtitle?: string;
  className?: string;
}

// ============================================
// ACTIVE SHAPE RENDERER (for hover effect)
// ============================================

interface ActiveShapeProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: RevenueByOccasion;
  percent: number;
  value: number;
}

const renderActiveShape = (props: ActiveShapeProps) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
          transition: 'all 0.3s ease',
        }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

// ============================================
// CENTER LABEL COMPONENT
// ============================================

interface CenterLabelProps {
  totalRevenue: number;
  activeItem: RevenueByOccasion | null;
}

function CenterLabel({ totalRevenue, activeItem }: CenterLabelProps) {
  const displayLabel = activeItem
    ? OCCASION_TYPE_LABELS[activeItem.occasionType] || activeItem.occasionType
    : 'Total Revenue';
  const displayValue = activeItem ? activeItem.revenue : totalRevenue;

  return (
    <motion.div
      key={displayLabel}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
    >
      <span className="text-sm text-gray-500 font-medium mb-2">
        {displayLabel}
      </span>
      <span className="text-3xl font-bold text-gray-900">
        {formatCurrency(displayValue)}
      </span>
      {activeItem && (
        <span className="text-sm text-accent-teal font-semibold mt-2">
          {activeItem.bookings} bookings
        </span>
      )}
    </motion.div>
  );
}

// ============================================
// LEGEND COMPONENT
// ============================================

interface LegendProps {
  data: RevenueByOccasion[];
  activeIndex: number | null;
  onHover: (index: number | null) => void;
}

function Legend({ data, activeIndex, onHover }: LegendProps) {
  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const label = OCCASION_TYPE_LABELS[item.occasionType] || item.occasionType;
        const color = CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length];
        const isActive = activeIndex === index;

        return (
          <motion.div
            key={item.occasionType}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
            className={cn(
              'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all',
              isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className={cn(
                'text-sm',
                isActive ? 'font-semibold text-gray-900' : 'text-gray-600'
              )}>
                {label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {item.bookings} bookings
              </span>
              <span className={cn(
                'text-sm font-semibold',
                isActive ? 'text-accent-teal' : 'text-gray-900'
              )}>
                {formatPercentage(item.percentage / 100)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================
// MAIN WIDGET COMPONENT
// ============================================

export function RevenueDistributionWidget({
  data,
  title = 'Revenue Distribution',
  subtitle = 'Revenue by occasion type',
  className,
}: RevenueDistributionWidgetProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  const handlePieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const handlePieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative',
        className
      )}
    >
      <KenteRibbon />
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-center">
          {/* Donut Chart - Made Bigger */}
          <div className="relative aspect-square max-w-[380px] mx-auto w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={3}
                  dataKey="revenue"
                  // @ts-expect-error activeIndex is valid in Recharts but types may be outdated
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape as unknown as (props: unknown) => React.JSX.Element}
                  onMouseEnter={handlePieEnter}
                  onMouseLeave={handlePieLeave}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                      style={{
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label - Enhanced */}
            <CenterLabel totalRevenue={totalRevenue} activeItem={activeItem} />
          </div>

          {/* Legend - Better Spacing */}
          <div className="flex flex-col justify-center px-4">
            <Legend
              data={data}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function RevenueDistributionWidgetSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header Skeleton */}
      <div className="p-5 border-b border-gray-100">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
      </div>

      {/* Content Skeleton */}
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Skeleton */}
          <div className="aspect-square max-w-[280px] mx-auto bg-gray-50 rounded-full animate-pulse flex items-center justify-center">
            <div className="w-1/2 h-1/2 bg-white rounded-full" />
          </div>

          {/* Legend Skeleton */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPACT VERSION
// ============================================

interface RevenueDistributionCompactProps {
  data: RevenueByOccasion[];
  className?: string;
}

export function RevenueDistributionCompact({
  data,
  className,
}: RevenueDistributionCompactProps) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Revenue Share</h3>
        <PieChartIcon className="h-5 w-5 text-gray-400" />
      </div>

      <div className="relative w-32 h-32 mx-auto mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="100%"
              paddingAngle={2}
              dataKey="revenue"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500">Total</span>
          <span className="text-sm font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
      </div>

      {/* Mini Legend */}
      <div className="space-y-1">
        {data.slice(0, 3).map((item, index) => (
          <div key={item.occasionType} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CHART_COLOR_PALETTE[index] }}
              />
              <span className="text-gray-600">
                {OCCASION_TYPE_LABELS[item.occasionType] || item.occasionType}
              </span>
            </div>
            <span className="font-medium text-gray-900">
              {formatPercentage(item.percentage / 100)}
            </span>
          </div>
        ))}
        {data.length > 3 && (
          <div className="text-xs text-gray-400 text-center pt-1">
            +{data.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}
