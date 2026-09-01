"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  User,
  Camera,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  FileText,
  Activity,
  CreditCard,
  AlertCircle,
  ExternalLink,
  MoreVertical,
  PlayCircle,
  Ban,
  Flag,
  Eye,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Send,
  Sparkles,
} from "lucide-react";
import {
  DetailCard,
  DetailRow,
  DetailGrid,
  StatBadge,
} from "@/components/shared/detail-card";
import { Timeline } from "@/components/shared/timeline";
import type { TimelineItem } from "@/components/shared/timeline";
import { LoadingDetailSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useBooking, useUpdateBookingStatus, useFlagBooking, useConfirmDepositRelease, useVerifyDeliverables } from "@/hooks/use-bookings";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { ActionMenu, ActionMenuItem } from "@/components/shared/action-menu";
import { FlagDialog, useFlagDialog } from "@/components/shared/flag-dialog";
import { PageBreadcrumb, BackButton } from "@/components/shared/page-breadcrumb";

// ============================================
// STATUS BADGE COMPONENT
// ============================================

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: "Pending",
      className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    },
    ACCEPTED: {
      label: "Accepted",
      className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    },
    CONFIRMED: {
      label: "Confirmed",
      className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full", config.className)}>
      {config.label}
    </span>
  );
}

// ============================================
// BOOKING DETAIL PAGE
// ============================================

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  // Fetch booking using the real API hook
  const { data: booking, isLoading, error, refetch } = useBooking(bookingId);

  // Flag booking mutation
  const { mutate: flagBooking, isPending: isFlagging } = useFlagBooking();

  // Escrow & Deliverables mutations
  const { mutate: confirmDepositRelease, isPending: isReleasingDeposit } = useConfirmDepositRelease();
  const { mutate: verifyDeliverables, isPending: isVerifyingDeliverables } = useVerifyDeliverables();

  // Flag dialog state
  const flagDialog = useFlagDialog();

  // Handler for viewing contract
  const handleViewContract = () => {
    if (!booking?.contractUrl) {
      alert("No contract available for this booking yet.");
      return;
    }
    // Open contract in new window
    window.open(booking.contractUrl, '_blank');
  };

  // Handler for flagging booking - opens dialog
  const handleFlagBooking = () => {
    flagDialog.open();
  };

  // Handler for confirming flag with reason
  const handleConfirmFlag = (reason: string) => {
    flagBooking({ bookingId, reason });
  };

  // Action menu items - Admin can only flag bookings, not manage status
  const getBookingActionMenuItems = (): ActionMenuItem[] => {
    return [
      {
        id: "flag",
        label: "Flag Booking",
        icon: Flag,
        variant: "danger",
        onClick: handleFlagBooking,
      },
    ];
  };

  // Loading state
  if (isLoading) {
    return <LoadingDetailSkeleton />;
  }

  // Error state
  if (error || !booking) {
    return (
      <ErrorState
        title="Failed to load booking"
        message={error?.message || "The booking could not be found. Please try again."}
        onRetry={() => refetch()}
      />
    );
  }

  // Calculate payment progress
  const paymentProgress = booking.totalAmount > 0
    ? (booking.depositAmount / booking.totalAmount) * 100
    : 0;

  // Balance amount (use API value or calculate)
  const balanceAmount = booking.remainingAmount ?? (booking.totalAmount - booking.depositAmount);

  // Build timeline items based on booking data
  const timelineItems: TimelineItem[] = [
    {
      id: "t1",
      title: "Booking Created",
      description: "Client requested booking for photography",
      timestamp: booking.createdAt,
      icon: Calendar,
      variant: "info",
    },
  ];

  if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
    timelineItems.push({
      id: "t2",
      title: "Booking Confirmed",
      description: "Booking confirmed after deposit payment",
      timestamp: booking.createdAt,
      icon: CheckCircle,
      variant: "success",
    });
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <BackButton href="/bookings" label="Back to Bookings" />
        <PageBreadcrumb
          items={[
            { label: "Bookings", href: "/bookings" },
            { label: booking?.bookingNumber || `#${bookingId.slice(0, 8)}` },
          ]}
        />
      </div>

      {/* Booking Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {booking.bookingNumber}
            </h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{booking.occasionType} Photography</p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleViewContract}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors font-medium"
          >
            <Eye className="w-4 h-4" />
            View Contract
          </button>
          <ActionMenu
            items={getBookingActionMenuItems()}
            buttonClassName="border-2 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBadge
          icon={Calendar}
          label="Event Date"
          value={formatDate(booking.eventDate)}
        />
        <StatBadge
          icon={DollarSign}
          label="Total Amount"
          value={formatCurrency(booking.totalAmount)}
        />
        <StatBadge
          icon={CreditCard}
          label="Deposit Paid"
          value={formatCurrency(booking.depositAmount)}
        />
        <StatBadge
          icon={Clock}
          label="Balance Due"
          value={formatCurrency(balanceAmount)}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <DetailCard title="Event Details" icon={Calendar}>
            <DetailGrid columns={2}>
              <DetailRow label="Occasion Type" value={booking.occasionType} />
              <DetailRow label="Event Date" value={formatDate(booking.eventDate)} />
              <DetailRow label="Location" value={booking.eventLocation || "Not specified"} />
              <DetailRow label="Duration" value={booking.eventDuration ? `${booking.eventDuration} hours` : "Not specified"} />
              <DetailRow label="Booking Created" value={formatDate(booking.createdAt)} />
            </DetailGrid>

            {booking.specialRequests && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Special Requirements
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {booking.specialRequests}
                </p>
              </div>
            )}
          </DetailCard>

          {/* Client Information */}
          <DetailCard title="Client Information" icon={User}>
            <div className="flex items-start gap-4 mb-6">
              <img
                src={booking.client?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.client?.id}`}
                alt={booking.client?.fullName || 'Client'}
                className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-100 dark:ring-gray-800"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {booking.client?.fullName || 'Unknown Client'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{booking.client?.email}</p>
              </div>
              <button
                onClick={() => router.push(`/users/${booking.client?.id}`)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
              >
                View Profile
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <DetailGrid columns={2}>
              <DetailRow label="Email" value={booking.client?.email || "N/A"} />
              <DetailRow label="Client ID" value={booking.client?.id || "N/A"} />
            </DetailGrid>
          </DetailCard>

          {/* Photographer Information */}
          <DetailCard title="Photographer Information">
            <div className="flex items-start gap-4 mb-6">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.photographer?.id}`}
                alt={booking.photographer?.businessName || 'Photographer'}
                className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-100 dark:ring-gray-800"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {booking.photographer?.businessName || booking.photographer?.user?.fullName || 'Unknown Photographer'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {booking.photographer?.user?.email}
                </p>
              </div>
              <button
                onClick={() => router.push(`/photographers/${booking.photographer?.id}`)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
              >
                View Profile
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <DetailGrid columns={2}>
              <DetailRow label="Business Name" value={booking.photographer?.businessName || "N/A"} />
              <DetailRow label="Photographer ID" value={booking.photographer?.id || "N/A"} />
            </DetailGrid>
          </DetailCard>

          {/* Payment Information */}
          <DetailCard title="Payment Information" icon={CreditCard}>
            <div className="space-y-6">
              {/* Payment Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Payment Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Deposit Paid
                    </span>
                    <span className="text-base font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(booking.depositAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Balance Due
                    </span>
                    <span className="text-base font-semibold text-yellow-600 dark:text-yellow-400">
                      {formatCurrency(balanceAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Progress
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {paymentProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
              </div>

              {/* Payment Note */}
              {balanceAmount > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                        Balance Payment Required
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        The remaining balance of {formatCurrency(balanceAmount)} should be paid before the event date.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DetailCard>

          {/* Escrow Settlement & Funds Release */}
          <DetailCard title="Escrow Settlement & Payout Release" icon={ShieldCheck}>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Client On-Site Arrival Verification</span>
                  {booking.clientConfirmedArrivalAt ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Arrival Confirmed ({formatDate(booking.clientConfirmedArrivalAt)})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting Client On-Site Confirmation
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      40% Deposit Escrow ({formatCurrency(booking.depositAmount)})
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.depositPaid ? "Deposit received in platform escrow account" : "Deposit pending from client"}
                    </p>
                  </div>

                  <button
                    disabled={isReleasingDeposit}
                    onClick={() => confirmDepositRelease({ bookingId })}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isReleasingDeposit ? "Releasing Deposit..." : "Release Escrow Deposit to Photographer"}
                  </button>
                </div>
              </div>
            </div>
          </DetailCard>

          {/* Master Deliverables & PIN Verification */}
          <DetailCard title="Work Deliverables & Access PIN Verification" icon={Sparkles}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                  <p className="text-xs text-gray-500 mb-1">Deliverables Status</p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 uppercase">
                    {booking.workDeliveryStatus || (booking.photos && booking.photos.length > 0 ? "DELIVERED" : "PENDING SUBMISSION")}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20">
                  <p className="text-xs text-teal-700 dark:text-teal-400 mb-1 flex items-center gap-1 font-medium">
                    <KeyRound className="w-3.5 h-3.5" />
                    Deliverables Access PIN
                  </p>
                  <p className="font-mono font-bold text-base text-teal-800 dark:text-teal-200 tracking-wider">
                    {booking.accessPin || "9482"}
                  </p>
                </div>
              </div>

              {booking.deliveryUrl && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="truncate mr-2">
                    <p className="text-xs font-medium text-gray-500">Deliverables Storage URL</p>
                    <p className="text-xs text-teal-600 truncate underline">{booking.deliveryUrl}</p>
                  </div>
                  <a
                    href={booking.deliveryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors flex-shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Work
                  </a>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={booking.deliveryUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-teal-600 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-xs font-bold transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View & Inspect Deliverables
                </a>

                <button
                  disabled={isVerifyingDeliverables}
                  onClick={() => verifyDeliverables({ bookingId, approved: true })}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isVerifyingDeliverables ? "Verifying..." : "Approve Work & Release Balance Payout"}
                </button>
              </div>
            </div>
          </DetailCard>
        </div>

        {/* Right Column - Activity Timeline */}
        <div className="space-y-6">
          <DetailCard title="Activity Timeline" icon={Activity}>
            <Timeline items={timelineItems} showRelativeTime={false} />
          </DetailCard>
        </div>
      </div>

      {/* Flag Booking Dialog */}
      <FlagDialog
        open={flagDialog.isOpen}
        onOpenChange={flagDialog.setIsOpen}
        title="Flag Booking"
        description="This booking will be marked for review and both parties will be notified. Please provide a reason for flagging."
        onConfirm={handleConfirmFlag}
        isLoading={isFlagging}
        inputLabel="Reason for flagging"
        inputPlaceholder="Describe the suspicious behavior or complaint..."
        confirmLabel="Flag Booking"
      />
    </div>
  );
}
