/**
 * Top Photographers Widget
 * Displays a leaderboard of top-performing photographers
 *
 * Features:
 * - Ranked list with avatars
 * - Performance metrics (bookings, revenue, rating)
 * - Growth indicators
 * - Animated entries
 * - Medal indicators for top 3
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Trophy,
  Star,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Medal,
  Crown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  cn,
  formatCurrency,
  formatNumber,
  getInitials,
} from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { KenteRibbon } from '@/components/shared/kente-ribbon';

// ============================================
// TYPES
// ============================================

interface TopPhotographer {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  totalBookings: number;
  totalRevenue: number;
  growthPercentage: number;
  location?: string;
  specialization?: string;
}

interface TopPhotographersWidgetProps {
  photographers: TopPhotographer[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  className?: string;
}

// ============================================
// RANK BADGE COMPONENT
// ============================================

interface RankBadgeProps {
  rank: number;
}

function RankBadge({ rank }: RankBadgeProps) {
  if (rank === 1) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 10 }}
        className="relative"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
          <Crown className="h-4 w-4 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-800">
          1
        </div>
      </motion.div>
    );
  }

  if (rank === 2) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-md"
      >
        <Medal className="h-4 w-4 text-white" />
      </motion.div>
    );
  }

  if (rank === 3) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-md"
      >
        <Medal className="h-4 w-4 text-white" />
      </motion.div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <span className="text-sm font-bold text-gray-500">{rank}</span>
    </div>
  );
}

// ============================================
// RATING DISPLAY COMPONENT
// ============================================

interface RatingDisplayProps {
  rating: number;
  size?: 'sm' | 'md';
}

function RatingDisplay({ rating, size = 'sm' }: RatingDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      <Star
        className={cn(
          'text-amber-400 fill-amber-400',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
        )}
      />
      <span
        className={cn(
          'font-semibold text-gray-900',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ============================================
// GROWTH INDICATOR
// ============================================

interface GrowthIndicatorProps {
  percentage: number;
}

function GrowthIndicator({ percentage }: GrowthIndicatorProps) {
  const isPositive = percentage >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 text-xs font-medium',
        isPositive ? 'text-emerald-600' : 'text-red-600'
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{Math.abs(percentage).toFixed(0)}%</span>
    </div>
  );
}

// ============================================
// PHOTOGRAPHER ROW COMPONENT
// ============================================

interface PhotographerRowProps {
  photographer: TopPhotographer;
  rank: number;
}

function PhotographerRow({ photographer, rank }: PhotographerRowProps) {
  const isTopThree = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="group"
    >
      <Link href={ROUTES.PHOTOGRAPHER_DETAIL(photographer.id)}>
        <div
          className={cn(
            'flex items-center gap-4 p-4 rounded-xl transition-all duration-200',
            'hover:bg-gray-50 cursor-pointer',
            isTopThree && 'bg-gradient-to-r from-transparent to-amber-50/50'
          )}
        >
          {/* Rank Badge */}
          <RankBadge rank={rank} />

          {/* Avatar and Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar
              className={cn(
                'ring-2 transition-all',
                rank === 1
                  ? 'h-12 w-12 ring-amber-400'
                  : rank === 2
                  ? 'h-11 w-11 ring-gray-300'
                  : rank === 3
                  ? 'h-11 w-11 ring-amber-600'
                  : 'h-10 w-10 ring-gray-200'
              )}
            >
              <AvatarImage src={photographer.avatar} alt={photographer.name} />
              <AvatarFallback
                className={cn(
                  'font-semibold',
                  rank === 1
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-accent-teal/10 text-accent-teal'
                )}
              >
                {getInitials(photographer.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-semibold truncate',
                    rank === 1 ? 'text-gray-900' : 'text-gray-800'
                  )}
                >
                  {photographer.name}
                </span>
                {rank === 1 && (
                  <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                    Top Performer
                  </Badge>
                )}
              </div>
              {photographer.location && (
                <span className="text-xs text-gray-500">{photographer.location}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-6">
            {/* Rating */}
            <div className="text-center">
              <RatingDisplay rating={photographer.rating} />
              <p className="text-[10px] text-gray-400 mt-0.5">Rating</p>
            </div>

            {/* Bookings */}
            <div className="text-center min-w-[60px]">
              <p className="text-sm font-bold text-gray-900">
                {formatNumber(photographer.totalBookings)}
              </p>
              <p className="text-[10px] text-gray-400">Bookings</p>
            </div>

            {/* Revenue */}
            <div className="text-center min-w-[80px]">
              <p className="text-sm font-bold text-accent-teal">
                {formatCurrency(photographer.totalRevenue)}
              </p>
              <p className="text-[10px] text-gray-400">Revenue</p>
            </div>

            {/* Growth */}
            <div className="text-center min-w-[50px]">
              <GrowthIndicator percentage={photographer.growthPercentage} />
              <p className="text-[10px] text-gray-400">Growth</p>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================
// MAIN WIDGET COMPONENT
// ============================================

export function TopPhotographersWidget({
  photographers,
  title = 'Top Photographers',
  subtitle = 'Best performing photographers this month',
  showViewAll = true,
  className,
}: TopPhotographersWidgetProps) {
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
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        {showViewAll && (
          <Link href={ROUTES.PHOTOGRAPHERS}>
            <Button variant="outline" size="sm" className="text-xs">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {/* Photographer List */}
      <div className="divide-y divide-gray-50">
        {photographers.length > 0 ? (
          photographers.map((photographer, index) => (
            <PhotographerRow
              key={photographer.id}
              photographer={photographer}
              rank={index + 1}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-4 rounded-full bg-gray-100 mb-4">
        <Trophy className="h-8 w-8 text-gray-400" />
      </div>
      <h4 className="text-gray-900 font-semibold mb-1">No photographers yet</h4>
      <p className="text-sm text-gray-500 text-center">
        Top performers will appear here once there's booking activity
      </p>
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function TopPhotographersWidgetSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Row Skeletons */}
      <div className="divide-y divide-gray-50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="space-y-1 text-center">
                  <div className="h-4 w-12 bg-gray-200 rounded mx-auto" />
                  <div className="h-2 w-10 bg-gray-100 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPACT VERSION
// ============================================

interface TopPhotographersCompactProps {
  photographers: TopPhotographer[];
  className?: string;
}

export function TopPhotographersCompact({
  photographers,
  className,
}: TopPhotographersCompactProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="font-bold text-gray-900">Top Performers</h3>
        </div>
        <Link href={ROUTES.PHOTOGRAPHERS}>
          <Button variant="ghost" size="sm" className="text-xs text-accent-teal">
            View All
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {photographers.slice(0, 5).map((photographer, index) => (
          <motion.div
            key={photographer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={ROUTES.PHOTOGRAPHER_DETAIL(photographer.id)}>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-400 w-5">
                  {index + 1}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={photographer.avatar} alt={photographer.name} />
                  <AvatarFallback className="text-xs bg-accent-teal/10 text-accent-teal">
                    {getInitials(photographer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {photographer.name}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-gray-600">
                    {photographer.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
