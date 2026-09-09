/**
 * Recent Bookings Widget
 * Displays a table of recent bookings similar to the "Last Trips" section in the flight dashboard
 *
 * Features:
 * - User avatars with names and emails
 * - Status badges with colors
 * - Occasion type display
 * - Amount formatting
 * - Animated row entries
 * - Hover effects
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  cn,
  formatCurrency,
  getInitials,
  getBookingStatusColor,
  humanizeString,
} from '@/lib/utils';
import { BOOKING_STATUS_LABELS, ROUTES } from '@/lib/constants';
import type { BookingStatus } from '@/types/dashboard';
import { KenteRibbon } from '@/components/shared/kente-ribbon';

// ============================================
// TYPES
// ============================================

interface RecentBooking {
  id: string;
  booking_number: string;
  client: {
    name?: string; // Computed field from hook
    email: string;
    avatar?: string; // Computed field from hook
  };
  photographer: {
    name?: string; // Computed field from hook
    avatar?: string; // Computed field from hook
  };
  occasion_type: string;
  event_date: string;
  total_amount: number;
  status: BookingStatus;
}

interface RecentBookingsWidgetProps {
  bookings: RecentBooking[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  className?: string;
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================

function StatusBadge({ status }: { status: BookingStatus }) {
  const label = BOOKING_STATUS_LABELS[status] || humanizeString(status);
  const colorClasses = getBookingStatusColor(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs px-2.5 py-0.5 border',
        colorClasses
      )}
    >
      {label}
    </Badge>
  );
}

// ============================================
// BOOKING ROW COMPONENT
// ============================================

interface BookingRowProps {
  booking: RecentBooking;
  index: number;
}

function BookingRow({ booking, index }: BookingRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Link href={ROUTES.BOOKING_DETAIL(booking.id)}>
        <div
          className={cn(
            'flex items-center gap-6 p-4 rounded-xl',
            'hover:bg-gray-50 transition-all duration-200',
            'cursor-pointer border border-transparent',
            'hover:border-gray-100 hover:shadow-sm'
          )}
        >
          {/* Client Info */}
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
              <AvatarImage src={booking.client.avatar} alt={booking.client.name} />
              <AvatarFallback className="bg-accent-teal text-white text-sm font-semibold">
                {getInitials(booking.client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-900 truncate text-sm">
                {booking.client.name}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {booking.client.email}
              </span>
            </div>
          </div>

          {/* Occasion Type */}
          <div className="hidden md:flex items-center gap-2 min-w-[160px]">
            <div className="p-1.5 rounded-lg bg-sidebar/10">
              <Calendar className="h-4 w-4 text-sidebar" />
            </div>
            <span className="text-sm text-gray-700">
              {humanizeString(booking.occasion_type)}
            </span>
          </div>

          {/* Photographer */}
          <div className="hidden lg:flex items-center gap-2 flex-1 min-w-[180px]">
            <Avatar className="h-8 w-8">
              <AvatarImage src={booking.photographer.avatar} alt={booking.photographer.name} />
              <AvatarFallback className="bg-accent-gold text-sidebar text-xs font-semibold">
                {getInitials(booking.photographer.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600 truncate">
              {booking.photographer.name}
            </span>
          </div>

          {/* Amount - Styled like the flight price */}
          <div className="flex items-center justify-center min-w-[120px]">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1.5 rounded-full bg-accent-gold/10 border border-accent-gold/20"
            >
              <span className="font-bold text-sidebar text-sm">
                {formatCurrency(booking.total_amount)}
              </span>
            </motion.div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center min-w-[110px]">
            <StatusBadge status={booking.status} />
          </div>

          {/* View Button */}
          <div className="flex items-center min-w-[100px] justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Eye className="h-4 w-4 mr-1" />
                <span className="text-xs">View</span>
              </Button>
            </motion.div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================
// MAIN WIDGET COMPONENT
// ============================================

export function RecentBookingsWidget({
  bookings,
  title = 'Recent Bookings',
  subtitle = 'Overview of latest bookings',
  showViewAll = true,
  className,
}: RecentBookingsWidgetProps) {
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
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        {showViewAll && (
          <Link href={ROUTES.BOOKINGS}>
            <Button variant="outline" size="sm" className="text-xs">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {/* Table Header */}
      <div className="hidden md:flex items-center gap-6 px-4 py-3 bg-gray-50/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="flex-1 min-w-[200px]">Client</div>
        <div className="min-w-[160px]">Event Type</div>
        <div className="hidden lg:block flex-1 min-w-[180px]">Photographer</div>
        <div className="min-w-[120px] text-center">Amount</div>
        <div className="min-w-[110px] text-center">Status</div>
        <div className="min-w-[100px]"></div>
      </div>

      {/* Booking Rows */}
      <div className="divide-y divide-gray-50">
        {bookings.length > 0 ? (
          bookings.map((booking, index) => (
            <BookingRow key={booking.id} booking={booking} index={index} />
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
        <Calendar className="h-8 w-8 text-gray-400" />
      </div>
      <h4 className="text-gray-900 font-semibold mb-1">No recent bookings</h4>
      <p className="text-sm text-gray-500 text-center">
        Bookings will appear here once clients start making reservations
      </p>
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function RecentBookingsWidgetSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Row Skeletons */}
      <div className="divide-y divide-gray-50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="hidden md:block h-4 w-24 bg-gray-200 rounded" />
            <div className="hidden lg:flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-full" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPACT VERSION (for sidebar or smaller spaces)
// ============================================

interface CompactBookingRowProps {
  booking: RecentBooking;
  index: number;
}

function CompactBookingRow({ booking, index }: CompactBookingRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={ROUTES.BOOKING_DETAIL(booking.id)}>
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={booking.client.avatar} alt={booking.client.name} />
              <AvatarFallback className="bg-accent-teal text-white text-xs">
                {getInitials(booking.client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">{booking.client.name}</p>
              <p className="text-xs text-gray-500">{humanizeString(booking.occasion_type)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(booking.total_amount)}
            </p>
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function RecentBookingsCompact({
  bookings,
  title = 'Recent Bookings',
  className,
}: Omit<RecentBookingsWidgetProps, 'subtitle'>) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <Link href={ROUTES.BOOKINGS}>
          <Button variant="ghost" size="sm" className="text-xs text-accent-teal">
            View All
          </Button>
        </Link>
      </div>
      <div className="space-y-1">
        {bookings.slice(0, 5).map((booking, index) => (
          <CompactBookingRow key={booking.id} booking={booking} index={index} />
        ))}
      </div>
    </div>
  );
}
