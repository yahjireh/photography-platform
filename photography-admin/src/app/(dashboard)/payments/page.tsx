"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CreditCard,
  Search,
  Filter,
  Download,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Camera,
  ExternalLink,
} from "lucide-react";
import { LoadingSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { usePayments, Payment } from "@/hooks/use-payments";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

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
      return <CheckCircle className="w-3.5 h-3.5" />;
    case "FAILED":
      return <XCircle className="w-3.5 h-3.5" />;
    case "PENDING":
      return <Clock className="w-3.5 h-3.5" />;
    default:
      return null;
  }
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function PaymentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [stageFilters, setStageFilters] = useState<string[]>([]);

  // Fetch payments using the real API hook
  const { data, isLoading, error, refetch } = usePayments({
    search: searchQuery || undefined,
    status: statusFilters.length > 0 ? statusFilters.join(',') : undefined,
    stage: stageFilters.length > 0 ? stageFilters.join(',') : undefined,
  });

  // Get payments from data
  const paymentsData = data as any;
  const payments: Payment[] = paymentsData?.payments || paymentsData?.items || [];

  // Calculate stats
  const totalPayments = paymentsData?.pagination?.total || payments.length;
  const successfulPayments = payments.filter((p) => p.status === "SUCCESSFUL").length;
  const failedPayments = payments.filter((p) => p.status === "FAILED").length;
  const totalRevenue = payments.filter((p) => p.status === "SUCCESSFUL").reduce(
    (sum, p) => sum + p.amount,
    0
  );

  // Toggle filter functions
  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleStageFilter = (stage: string) => {
    setStageFilters((prev) => (prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]));
  };

  const clearFilters = () => {
    setStatusFilters([]);
    setStageFilters([]);
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilters.length > 0 || stageFilters.length > 0 || searchQuery !== "";

  // Export to CSV
  const handleExport = () => {
    if (payments.length === 0) return;

    const headers = ["Reference", "Booking #", "Client", "Photographer", "Amount", "Stage", "Status", "Date"];
    const rows = payments.map((payment) => [
      payment.paystackReference || payment.id,
      payment.booking?.bookingNumber || "N/A",
      payment.booking?.client?.fullName || "Unknown",
      payment.booking?.photographer?.businessName || "Unknown",
      formatCurrency(payment.amount),
      payment.stage,
      payment.status,
      formatDate(payment.createdAt),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Failed to load payments"
        message={error.message || "An error occurred while loading payments. Please try again."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-teal-600" />
            Payment Tracking
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor all payment transactions and their statuses
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{totalPayments}</p>
            </div>
            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <CreditCard className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {successfulPayments}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{failedPayments}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl border border-teal-500 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-100">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference, booking, client, or photographer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Status
            </label>
            <div className="flex flex-wrap gap-2">
              {["SUCCESSFUL", "FAILED", "PENDING"].map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    statusFilters.includes(status)
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Stage
            </label>
            <div className="flex flex-wrap gap-2">
              {["DEPOSIT", "BALANCE"].map((stage) => (
                <button
                  key={stage}
                  onClick={() => toggleStageFilter(stage)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    stageFilters.includes(stage)
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <p>
          Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{payments.length}</span>{" "}
          of <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPayments}</span> payments
        </p>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Photographer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {payments.map((payment) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => router.push(`/payments/${payment.id}`)}
                >
                  {/* Reference */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                        {payment.paystackReference || payment.id.substring(0, 16)}
                      </span>
                    </div>
                  </td>

                  {/* Booking */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {payment.booking?.bookingNumber || "N/A"}
                    </span>
                  </td>

                  {/* Client */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${payment.booking?.client?.id}`}
                        alt={payment.booking?.client?.fullName || 'Client'}
                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payment.booking?.client?.fullName || "Unknown"}
                      </span>
                    </div>
                  </td>

                  {/* Photographer */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${payment.booking?.photographer?.id}`}
                        alt={payment.booking?.photographer?.businessName || 'Photographer'}
                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payment.booking?.photographer?.businessName || "Unknown"}
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(payment.amount)}
                    </span>
                  </td>

                  {/* Stage */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full",
                        getStageBadgeStyles(payment.stage)
                      )}
                    >
                      {payment.stage}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full",
                        getStatusBadgeStyles(payment.status)
                      )}
                    >
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(payment.createdAt)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {payments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No payments found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {hasActiveFilters
                ? "Try adjusting your filters or search query."
                : "No payment transactions available yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
