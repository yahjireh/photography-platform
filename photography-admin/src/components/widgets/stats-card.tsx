/**
 * Stats Card Widget
 * Premium animated metric cards inspired by the flight dashboard design
 *
 * Features:
 * - Animated counting numbers
 * - Growth indicators with arrows
 * - Custom icons with backgrounds
 * - Hover effects and smooth transitions
 * - Mini sparkline/graph visualization
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Camera,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from 'lucide-react';
import { cn, formatCurrency, formatNumber, formatCompactNumber } from '@/lib/utils';
import { KenteRibbon } from '@/components/shared/kente-ribbon';

// ============================================
// TYPES
// ============================================

export type StatsCardType = 'bookings' | 'photographers' | 'revenue' | 'users';

interface StatsCardProps {
  type: StatsCardType;
  value: number;
  previousValue?: number;
  label: string;
  isCurrency?: boolean;
  className?: string;
}

interface StatsCardData {
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  graphColor: string;
}

// ============================================
// CONFIGURATION
// ============================================

const cardConfig: Record<StatsCardType, StatsCardData> = {
  bookings: {
    icon: Calendar,
    bgColor: 'bg-sidebar',
    iconColor: 'text-accent-gold',
    graphColor: '#D4AF37',
  },
  photographers: {
    icon: Camera,
    bgColor: 'bg-sidebar',
    iconColor: 'text-accent-teal',
    graphColor: '#00B4D8',
  },
  revenue: {
    icon: DollarSign,
    bgColor: 'bg-sidebar',
    iconColor: 'text-emerald-400',
    graphColor: '#10B981',
  },
  users: {
    icon: Users,
    bgColor: 'bg-sidebar',
    iconColor: 'text-violet-400',
    graphColor: '#8B5CF6',
  },
};

// ============================================
// ANIMATED NUMBER COMPONENT
// ============================================

function AnimatedNumber({
  value,
  isCurrency = false,
  duration = 1500
}: {
  value: number;
  isCurrency?: boolean;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  if (isCurrency) {
    return <span>{formatCurrency(displayValue)}</span>;
  }

  // For large numbers, use compact format
  if (displayValue >= 10000) {
    return <span>{formatCompactNumber(Math.round(displayValue))}</span>;
  }

  return <span>{formatNumber(Math.round(displayValue))}</span>;
}

// ============================================
// MINI GRAPH COMPONENT (Sparkline-style)
// ============================================

function MiniGraph({ color, type }: { color: string; type: StatsCardType }) {
  // Generate a simple graph path based on type
  const getPath = () => {
    switch (type) {
      case 'bookings':
        return 'M 0 40 Q 15 35, 30 30 T 60 25 T 90 15 T 120 20';
      case 'photographers':
        return 'M 0 35 Q 20 30, 40 28 T 80 22 T 120 18';
      case 'revenue':
        return 'M 0 45 Q 30 40, 50 30 T 90 20 T 120 10';
      case 'users':
        return 'M 0 40 Q 25 38, 50 32 T 100 22 T 120 15';
      default:
        return 'M 0 40 L 120 10';
    }
  };

  return (
    <svg
      viewBox="0 0 120 50"
      className="w-full h-12 opacity-60"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <motion.path
        d={getPath()}
        fill="none"
        stroke={`url(#gradient-${type})`}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      {/* Animated dot at the end */}
      <motion.circle
        cx="120"
        cy="10"
        r="4"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, duration: 0.3 }}
      />
    </svg>
  );
}

// ============================================
// GROWTH INDICATOR COMPONENT
// ============================================

function GrowthIndicator({
  currentValue,
  previousValue
}: {
  currentValue: number;
  previousValue?: number;
}) {
  if (previousValue === undefined || previousValue === 0) {
    return null;
  }

  const change = ((currentValue - previousValue) / previousValue) * 100;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className={cn(
        'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
        isNeutral && 'bg-gray-100 text-gray-600',
        isPositive && 'bg-emerald-100 text-emerald-700',
        !isPositive && !isNeutral && 'bg-red-100 text-red-700'
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{Math.abs(change).toFixed(1)}%</span>
    </motion.div>
  );
}

// ============================================
// MAIN STATS CARD COMPONENT
// ============================================

export function StatsCard({
  type,
  value,
  previousValue,
  label,
  isCurrency = false,
  className,
}: StatsCardProps) {
  const config = cardConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white',
        'border border-gray-100 shadow-sm',
        'p-5 cursor-pointer group',
        className
      )}
    >
      <KenteRibbon />

      {/* Background Decoration */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gray-50 opacity-50 group-hover:scale-110 transition-transform duration-500" />

      {/* Header: Label and Icon */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </span>
          <GrowthIndicator currentValue={value} previousValue={previousValue} />
        </div>

        {/* Icon with Background */}
        <motion.div
          whileHover={{ rotate: 5, scale: 1.05 }}
          className={cn(
            'p-3 rounded-xl',
            config.bgColor
          )}
        >
          <Icon className={cn('h-6 w-6', config.iconColor)} />
        </motion.div>
      </div>

      {/* Main Value */}
      <div className="relative mb-3">
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
          <AnimatedNumber value={value} isCurrency={isCurrency} />
        </h3>
      </div>

      {/* Mini Graph */}
      <div className="relative -mx-2">
        <MiniGraph color={config.graphColor} type={type} />
      </div>

      {/* Activity Indicator */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-gray-400">
        <Activity className="h-3 w-3" />
        <span>Live</span>
      </div>
    </motion.div>
  );
}

// ============================================
// STATS CARD GRID COMPONENT
// ============================================

interface StatsData {
  totalBookings: number;
  previousBookings?: number;
  totalPhotographers: number;
  previousPhotographers?: number;
  totalRevenue: number;
  previousRevenue?: number;
  totalUsers: number;
  previousUsers?: number;
}

interface StatsCardGridProps {
  data: StatsData;
  className?: string;
}

export function StatsCardGrid({ data, className }: StatsCardGridProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
      className
    )}>
      <StatsCard
        type="bookings"
        value={data.totalBookings}
        previousValue={data.previousBookings}
        label="Total Bookings"
      />
      <StatsCard
        type="photographers"
        value={data.totalPhotographers}
        previousValue={data.previousPhotographers}
        label="Photographers"
      />
      <StatsCard
        type="revenue"
        value={data.totalRevenue}
        previousValue={data.previousRevenue}
        label="Total Revenue"
        isCurrency
      />
      <StatsCard
        type="users"
        value={data.totalUsers}
        previousValue={data.previousUsers}
        label="Total Users"
      />
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="h-12 w-12 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-9 w-32 bg-gray-200 rounded mb-3" />
      <div className="h-12 w-full bg-gray-100 rounded" />
    </div>
  );
}

export function StatsCardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  );
}
