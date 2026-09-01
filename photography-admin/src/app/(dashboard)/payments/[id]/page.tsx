"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Camera,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  ExternalLink,
  Download,
  AlertCircle,
} from "lucide-react";
import { LoadingDetailSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { usePayment, useApprovePaymentRelease } from "@/hooks/use-payments";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { DetailCard, DetailRow, DetailGrid } from "@/components/shared/detail-card";
import { Timeline } from "@/components/shared/timeline";
import type { TimelineItem } from "@/components/shared/timeline";

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getStatusBadgeStyles(status: string) {
  switch (status) {
    case "SUCCESSFUL":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
    case "FAILED":
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    case "PENDING":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  }
}

function getStageBadgeStyles(stage: string) {
  switch (stage) {
    case "DEPOSIT":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
    case "BALANCE":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "SUCCESSFUL":
      return <CheckCircle className="w-5 h-5" />;
    case "FAILED":
      return <XCircle className="w-5 h-5" />;
    case "PENDING":
      return <Clock className="w-5 h-5" />;
    default:
      return null;
  }
}

// ============================================
// PAYMENT DETAIL PAGE
// ============================================

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const paymentId = resolvedParams.id;

  // Fetch payment using the real API hook
  const { data: payment, isLoading, error, refetch } = usePayment(paymentId);
  const { mutate: approveRelease, isPending: isApprovingRelease } = useApprovePaymentRelease();

  // Handler for approving payment release
  const handleApproveRelease = () => {
    if (!payment) return;

    const stageText = payment.stage === 'DEPOSIT' ? 'initial deposit' : 'balance';
    const criteria = payment.stage === 'DEPOSIT'
      ? 'The photographer must have shown up for the event.'
      : 'The photos must have been delivered to the client.';

    const confirmation = window.confirm(
      `Approve ${stageText} payment release?\n\n` +
      `Criteria: ${criteria}\n\n` +
      `Amount: ${formatCurrency(payment.amount)}\n` +
      `This will release funds to the photographer's account.`
    );

    if (confirmation) {
      approveRelease({ paymentId: payment.id, stage: payment.stage });
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingDetailSkeleton />;
  }

  // Error state
  if (error || !payment) {
    return (
      <ErrorState
        title="Failed to load payment"
        message={error?.message || "The payment could not be found. Please try again."}
        onRetry={() => refetch()}
      />
    );
  }

  const handleDownloadReceipt = () => {
    console.log("Downloading receipt for payment:", payment.id);
  };

  const handleRefund = () => {
    console.log("Initiating refund for payment:", payment.id);
  };

  // Build timeline items
  const timelineItems: TimelineItem[] = [
    {
      id: 'payment-initiated',
      title: "Payment Initiated",
      description: `${payment.stage} payment initiated for booking ${payment.booking?.bookingNumber || 'Unknown'}`,
      timestamp: payment.createdAt,
      icon: CreditCard,
      variant: "info"
    },
  ];

  if (payment.status === "SUCCESSFUL") {
    timelineItems.unshift({
      id: 'payment-success',
      title: "Payment Successful",
      description: `Payment of ${formatCurrency(payment.amount)} processed successfully`,
      timestamp: payment.createdAt,
      icon: CheckCircle,
      variant: "success"
    });
  }

  if (payment.status === "FAILED") {
    timelineItems.unshift({
      id: 'payment-failed',
      title: "Payment Failed",
      description: `Payment attempt of ${formatCurrency(payment.amount)} failed`,
      timestamp: payment.createdAt,
      icon: XCircle,
      variant: "error"
    });
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/payments")}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Back to Payments</span>
      </button>

      {/* Payment Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <CreditCard className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {payment.paystackReference || payment.id}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Payment for {payment.booking?.bookingNumber || 'Unknown Booking'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg",
                getStatusBadgeStyles(payment.status)
              )}
            >
              {getStatusIcon(payment.status)}
              {payment.status}
            </span>
          </div>
        </div>

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Amount
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(payment.amount)}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Stage
            </p>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 text-sm font-semibold rounded-full mt-1",
                getStageBadgeStyles(payment.stage)
              )}
            >
              {payment.stage}
            </span>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Booking
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {payment.booking?.bookingNumber || "N/A"}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Transaction Date
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {formatDate(payment.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          {/* Approval Button - Only show for successful payments that haven't been released */}
          {payment.status === "SUCCESSFUL" && !payment.releaseApproved && (
            <button
              onClick={handleApproveRelease}
              disabled={isApprovingRelease}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              <CheckCircle className="w-5 h-5" />
              {isApprovingRelease ? 'Approving...' : `Approve ${payment.stage === 'DEPOSIT' ? 'Initial' : 'Balance'} Release`}
            </button>
          )}

          {/* Released Badge - Show if already approved */}
          {payment.releaseApproved && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-semibold">
              <CheckCircle className="w-5 h-5" />
              Funds Released
              {payment.releasedAt && (
                <span className="text-sm font-normal">
                  on {formatDate(payment.releasedAt)}
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleDownloadReceipt}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>

          {payment.status === "SUCCESSFUL" && !payment.releaseApproved && (
            <button
              onClick={handleRefund}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              Initiate Refund
            </button>
          )}
        </div>
      </div>

      {/* Admin Approval Info Banner - Show if payment is successful but not released */}
      {payment.status === "SUCCESSFUL" && !payment.releaseApproved && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Payment Release Approval Required
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                {payment.stage === 'DEPOSIT'
                  ? 'Release the initial deposit payment to the photographer once they have shown up for the event and started providing services.'
                  : 'Release the balance payment to the photographer once they have delivered all final photos to the client and the client has confirmed receipt.'}
              </p>
              <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {payment.stage === 'DEPOSIT'
                    ? 'Verify that the photographer has arrived at the event location before approving.'
                    : 'Verify that the client has received and confirmed all deliverables before approving.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Transaction Details */}
          <DetailCard title="Transaction Details" icon={FileText}>
            <DetailGrid>
              <DetailRow label="Payment ID" value={payment.id} />
              <DetailRow label="Reference" value={payment.paystackReference || "N/A"} />
              <DetailRow label="Payment Stage" value={payment.stage} />
              <DetailRow label="Payment Status" value={payment.status} />
              <DetailRow label="Amount" value={formatCurrency(payment.amount)} />
              <DetailRow label="Transaction Date" value={formatDate(payment.createdAt)} />
            </DetailGrid>
          </DetailCard>

          {/* Booking Information */}
          {payment.booking && (
            <DetailCard title="Related Booking" icon={Calendar}>
              <DetailGrid>
                <DetailRow label="Booking Number" value={payment.booking.bookingNumber} />
                <DetailRow label="Occasion Type" value={payment.booking.occasionType} />
              </DetailGrid>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => router.push(`/bookings/${payment.booking?.id}`)}
                  className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                >
                  View Full Booking Details
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </DetailCard>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Client Information */}
          {payment.booking?.client && (
            <DetailCard title="Client Information" icon={User}>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${payment.booking.client.id}`}
                  alt={payment.booking.client.fullName || 'Client'}
                  className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {payment.booking.client.fullName || 'Unknown Client'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {payment.booking.client.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => router.push(`/users/${payment.booking?.client?.id}`)}
                  className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                >
                  View Client Profile
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </DetailCard>
          )}

          {/* Photographer Information */}
          {payment.booking?.photographer && (
            <DetailCard title="Photographer Information" icon={Camera}>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${payment.booking.photographer.id}`}
                  alt={payment.booking.photographer.businessName || 'Photographer'}
                  className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {payment.booking.photographer.businessName || 'Unknown Photographer'}
                  </h3>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => router.push(`/photographers/${payment.booking?.photographer?.id}`)}
                  className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                >
                  View Photographer Profile
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </DetailCard>
          )}

          {/* Payment Timeline */}
          <DetailCard title="Payment Timeline" icon={Clock}>
            <Timeline items={timelineItems} />
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
