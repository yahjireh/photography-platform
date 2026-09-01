"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Search,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Calendar,
  User,
  Camera,
  FileText,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dispute, DisputeStatus, User as UserType, Booking, BookingStatus } from "@/types/dashboard";
import { useDisputes } from "@/hooks/use-disputes";

// Extended dispute interface with full nested data
interface ExtendedDispute extends Omit<Dispute, "raisedByUser" | "raisedBy" | "resolvedBy" | "evidence" | "responses" | "timeline" | "booking" | "client" | "photographer"> {
  booking: Booking;
  raisedByUser: UserType;
  resolvedByUser?: UserType | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidenceCount: number;
  responseCount: number;
  lastActivityAt: string;
}

export default function DisputesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<DisputeStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedRaisedBy, setSelectedRaisedBy] = useState<string[]>([]);
  const [sortField, setSortField] = useState<"createdAt" | "lastActivityAt" | "priority">("lastActivityAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch real disputes data
  const { data: disputesData, isLoading, error } = useDisputes({
    page,
    limit: 20,
    status: selectedStatuses.length > 0 ? selectedStatuses[0] : undefined,
    priority: selectedPriorities.length > 0 ? selectedPriorities[0] : undefined,
    search: searchQuery || undefined,
  });

  // Transform API data to match component format
  const disputes: ExtendedDispute[] = useMemo(() => {
    if (!disputesData?.disputes) return [];

    return disputesData.disputes.map((dispute) => ({
      id: dispute.id,
      bookingId: dispute.bookingId,
      booking: {
        id: dispute.bookings.id,
        bookingNumber: dispute.bookings.bookingNumber,
        clientId: dispute.raisedById,
        photographerId: dispute.raisedAgainstId,
        client: dispute.usersDisputesRaisedByIdTousers as any,
        photographer: { user: dispute.usersDisputesRaisedAgainstIdTousers } as any,
        occasionType: dispute.bookings.occasionType,
        eventLocation: "Location not available",
        eventDate: dispute.bookings.eventDate,
        eventStartTime: "00:00",
        eventEndTime: "00:00",
        estimatedHours: 0,
        totalAmount: Number(dispute.bookings.totalAmount),
        depositAmount: 0,
        balanceAmount: 0,
        platformCommission: 0,
        status: dispute.bookings.status as BookingStatus,
        specialRequirements: null,
        cancellationReason: null,
        acceptedAt: null,
        confirmedAt: null,
        shootStartedAt: null,
        shootCompletedAt: null,
        photosDeliveredAt: null,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
      },
      raisedById: dispute.raisedById,
      raisedAgainstId: dispute.raisedAgainstId,
      raisedByUser: dispute.usersDisputesRaisedByIdTousers as any,
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      resolution: dispute.resolution ?? null,
      resolvedByUserId: dispute.resolvedById ?? null,
      resolvedByUser: (dispute.usersDisputesResolvedByIdTousers as any) ?? null,
      resolvedAt: dispute.resolvedAt ?? null,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      priority: dispute.priority as any,
      evidenceCount: 0,
      responseCount: 0,
      lastActivityAt: dispute.updatedAt,
    }));
  }, [disputesData]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = disputes.length;
    const open = disputes.filter((d) => d.status === "OPEN").length;
    const inReview = disputes.filter((d) => d.status === "IN_REVIEW").length;
    const resolved = disputes.filter((d) => d.status === "RESOLVED").length;
    const critical = disputes.filter((d) => d.priority === "CRITICAL").length;
    const needsAttention = open + critical;

    return { total, open, inReview, resolved, critical, needsAttention };
  }, [disputes]);

  // Filter and sort disputes
  const filteredDisputes = useMemo(() => {
    let filtered = disputes;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dispute) =>
          dispute.id.toLowerCase().includes(query) ||
          dispute.booking.bookingNumber.toLowerCase().includes(query) ||
          dispute.raisedByUser.firstName.toLowerCase().includes(query) ||
          dispute.raisedByUser.lastName.toLowerCase().includes(query) ||
          dispute.reason.toLowerCase().includes(query) ||
          dispute.description.toLowerCase().includes(query) ||
          `${dispute.booking.client.firstName} ${dispute.booking.client.lastName}`.toLowerCase().includes(query) ||
          `${dispute.booking.photographer.user.firstName} ${dispute.booking.photographer.user.lastName}`.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((dispute) => selectedStatuses.includes(dispute.status));
    }

    // Priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((dispute) => selectedPriorities.includes(dispute.priority));
    }

    // Raised by filter
    if (selectedRaisedBy.length > 0) {
      filtered = filtered.filter((dispute) => selectedRaisedBy.includes(dispute.raisedByUser.userType));
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortField === "priority") {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        compareValue = priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortField === "createdAt") {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        compareValue = new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [disputes, searchQuery, selectedStatuses, selectedPriorities, selectedRaisedBy, sortField, sortOrder]);

  const handleExport = () => {
    const headers = [
      "Dispute ID",
      "Booking Number",
      "Raised By",
      "User Type",
      "Client",
      "Photographer",
      "Reason",
      "Status",
      "Priority",
      "Created Date",
      "Last Activity",
      "Evidence Count",
      "Response Count",
    ];

    const rows = filteredDisputes.map((dispute) => [
      dispute.id,
      dispute.booking.bookingNumber,
      `${dispute.raisedByUser.firstName} ${dispute.raisedByUser.lastName}`,
      dispute.raisedByUser.userType,
      `${dispute.booking.client.firstName} ${dispute.booking.client.lastName}`,
      `${dispute.booking.photographer.user.firstName} ${dispute.booking.photographer.user.lastName}`,
      dispute.reason,
      dispute.status,
      dispute.priority,
      new Date(dispute.createdAt).toLocaleDateString(),
      new Date(dispute.lastActivityAt).toLocaleDateString(),
      dispute.evidenceCount,
      dispute.responseCount,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disputes-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading disputes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <h3 className="text-red-900 dark:text-red-200 font-semibold mb-2">Failed to load disputes</h3>
          <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dispute Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Resolve booking disputes and manage conflict resolution
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Needs Attention Alert */}
        {stats.needsAttention > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">
                  {stats.needsAttention} Dispute{stats.needsAttention !== 1 ? "s" : ""} Need Immediate Attention
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
                  {stats.open} open dispute{stats.open !== 1 ? "s" : ""} and {stats.critical} critical priority case
                  {stats.critical !== 1 ? "s" : ""} require review
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Disputes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Disputes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.open}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Review</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.inReview}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by dispute ID, booking number, names, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  {(["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"] as DisputeStatus[]).map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStatuses([...selectedStatuses, status]);
                          } else {
                            setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{status.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <div className="space-y-2">
                  {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((priority) => (
                    <label key={priority} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPriorities.includes(priority)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPriorities([...selectedPriorities, priority]);
                          } else {
                            setSelectedPriorities(selectedPriorities.filter((p) => p !== priority));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Raised By Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Raised By
                </label>
                <div className="space-y-2">
                  {["CLIENT", "PHOTOGRAPHER"].map((userType) => (
                    <label key={userType} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRaisedBy.includes(userType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRaisedBy([...selectedRaisedBy, userType]);
                          } else {
                            setSelectedRaisedBy(selectedRaisedBy.filter((t) => t !== userType));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{userType}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedRaisedBy.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                {selectedStatuses.map((status) => (
                  <span
                    key={status}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                  >
                    {status.replace("_", " ")}
                    <button
                      onClick={() => setSelectedStatuses(selectedStatuses.filter((s) => s !== status))}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedPriorities.map((priority) => (
                  <span
                    key={priority}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded"
                  >
                    {priority}
                    <button
                      onClick={() => setSelectedPriorities(selectedPriorities.filter((p) => p !== priority))}
                      className="hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedRaisedBy.map((userType) => (
                  <span
                    key={userType}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded"
                  >
                    {userType}
                    <button
                      onClick={() => setSelectedRaisedBy(selectedRaisedBy.filter((t) => t !== userType))}
                      className="hover:text-green-900 dark:hover:text-green-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => {
                    setSelectedStatuses([]);
                    setSelectedPriorities([]);
                    setSelectedRaisedBy([]);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => toggleSort("priority")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Priority
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Dispute Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Parties Involved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => toggleSort("lastActivityAt")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Last Activity
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Evidence
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDisputes.map((dispute, index) => (
                  <motion.tr
                    key={dispute.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={dispute.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{dispute.id}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {dispute.booking.bookingNumber}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{dispute.reason}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {dispute.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {dispute.booking.client.firstName} {dispute.booking.client.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Client</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                            <Camera className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {dispute.booking.photographer.user.firstName} {dispute.booking.photographer.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Photographer</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          Raised by: {dispute.raisedByUser.userType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DisputeStatusBadge status={dispute.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <Clock className="w-3 h-3" />
                          {new Date(dispute.lastActivityAt).toLocaleDateString()}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(dispute.lastActivityAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {dispute.evidenceCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {dispute.responseCount}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => router.push(`/disputes/${dispute.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredDisputes.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No disputes found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || selectedStatuses.length > 0 || selectedPriorities.length > 0
                  ? "Try adjusting your search or filter criteria"
                  : "All disputes will appear here"}
              </p>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredDisputes.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Showing {filteredDisputes.length} of {disputes.length} dispute{disputes.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<
    string,
    { label: string; className: string; icon: any }
  > = {
    CRITICAL: {
      label: "Critical",
      className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
      icon: AlertTriangle,
    },
    HIGH: {
      label: "High",
      className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      icon: AlertCircle,
    },
    MEDIUM: {
      label: "Medium",
      className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      icon: Clock,
    },
    LOW: {
      label: "Low",
      className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600",
      icon: AlertCircle,
    },
  };

  const { label, className, icon: Icon } = config[priority] || config.MEDIUM;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// Dispute Status Badge Component
function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const config: Record<
    DisputeStatus,
    { label: string; className: string; icon: any }
  > = {
    OPEN: {
      label: "Open",
      className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      icon: AlertCircle,
    },
    IN_REVIEW: {
      label: "In Review",
      className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      icon: Clock,
    },
    RESOLVED: {
      label: "Resolved",
      className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      icon: CheckCircle,
    },
    CLOSED: {
      label: "Closed",
      className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      icon: XCircle,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
