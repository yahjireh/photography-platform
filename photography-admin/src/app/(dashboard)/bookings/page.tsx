"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Download,
  TrendingUp,
  Search as SearchIcon,
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import { SearchBar } from "@/components/shared/search-bar";
import { FilterPanel, FilterGroup } from "@/components/shared/filter-panel";
import { LoadingSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useBookings, Booking } from "@/hooks/use-bookings";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

// ============================================
// STATUS BADGE COMPONENT
// ============================================

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    PENDING: {
      label: "Pending",
      className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
      icon: Clock,
    },
    ACCEPTED: {
      label: "Accepted",
      className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      icon: CheckCircle,
    },
    CONFIRMED: {
      label: "Confirmed",
      className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      icon: CheckCircle,
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      icon: TrendingUp,
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      icon: CheckCircle,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
      icon: Clock,
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full", config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ============================================
// BOOKINGS LIST PAGE
// ============================================

export default function BookingsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});

  // Fetch bookings using the real API hook
  const { data, isLoading, error, refetch } = useBookings({
    search: searchQuery || undefined,
    status: Array.isArray(filters.status) && filters.status.length > 0 ? filters.status.join(',') : undefined,
    occasionType: typeof filters.occasionType === 'string' ? filters.occasionType : undefined,
  });

  // Handle filter changes
  const handleFilterChange = (filterId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  // Filter configuration with values
  const filterConfig: FilterGroup[] = useMemo(() => [
    {
      id: "status",
      label: "Status",
      type: "multi-select",
      options: [
        { value: "PENDING", label: "Pending" },
        { value: "ACCEPTED", label: "Accepted" },
        { value: "CONFIRMED", label: "Confirmed" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
      value: filters.status,
    },
    {
      id: "occasionType",
      label: "Occasion Type",
      type: "select",
      options: [
        { value: "Wedding", label: "Wedding" },
        { value: "Birthday", label: "Birthday" },
        { value: "Corporate Event", label: "Corporate Event" },
        { value: "Graduation", label: "Graduation" },
        { value: "Portrait", label: "Portrait" },
      ],
      value: filters.occasionType,
    },
  ], [filters]);

  // Get bookings from data
  const bookings = data?.bookings || data?.items || [];

  // Calculate stats from the fetched data
  const totalBookings = data?.pagination?.total || bookings.length;
  const activeBookings = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "ACCEPTED" || b.status === "CONFIRMED" || b.status === "IN_PROGRESS"
  ).length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const totalRevenue = bookings.filter((b) => b.status === "COMPLETED").reduce((sum, b) => sum + b.totalAmount, 0);

  // Table columns - adapted to match API response structure
  const columns: ColumnDef<Booking>[] = [
    {
      id: "bookingNumber",
      header: "Booking #",
      accessorKey: "bookingNumber",
      cell: (booking) => (
        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{booking.bookingNumber}</span>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: (booking) => (
        <div className="flex items-center gap-3">
          <img
            src={booking.client?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.client?.id}`}
            alt={booking.client?.fullName || 'Client'}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {booking.client?.fullName || 'Unknown Client'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{booking.client?.email}</p>
          </div>
        </div>
      ),
      sortable: false,
    },
    {
      id: "photographer",
      header: "Photographer",
      cell: (booking) => (
        <div className="flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.photographer?.id}`}
            alt={booking.photographer?.businessName || booking.photographer?.user?.fullName || 'Photographer'}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {booking.photographer?.businessName || booking.photographer?.user?.fullName || 'Unknown Photographer'}
            </p>
          </div>
        </div>
      ),
      sortable: false,
    },
    {
      id: "occasion",
      header: "Occasion",
      accessorKey: "occasionType",
      cell: (booking) => <span className="text-gray-700 dark:text-gray-300">{booking.occasionType}</span>,
    },
    {
      id: "eventDate",
      header: "Event Date",
      accessorKey: "eventDate",
      cell: (booking) => <span className="text-gray-700 dark:text-gray-300">{formatDate(booking.eventDate)}</span>,
    },
    {
      id: "amount",
      header: "Amount",
      accessorKey: "totalAmount",
      cell: (booking) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(booking.totalAmount)}</span>
      ),
    },
    {
      id: "escrow",
      header: "Escrow & Arrival",
      cell: (booking: any) => (
        <div>
          {booking.clientConfirmedArrivalAt ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="w-3 h-3" />
              Arrival Confirmed
            </span>
          ) : booking.depositPaid ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <Clock className="w-3 h-3" />
              Deposit Held
            </span>
          ) : (
            <span className="text-xs text-gray-400">Pending Deposit</span>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      id: "deliverables",
      header: "Deliverables & PIN",
      cell: (booking: any) => (
        <div className="flex items-center gap-2">
          {booking.deliveryUrl ? (
            <a
              href={booking.deliveryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300"
            >
              Gallery Link
            </a>
          ) : (
            <span className="text-xs text-gray-400">In Production</span>
          )}
          {booking.accessPin && (
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              PIN: {booking.accessPin}
            </span>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      id: "status",
      header: "Status",
      cell: (booking) => <StatusBadge status={booking.status} />,
      sortable: false,
    },
  ];

  // Export to CSV
  const handleExport = () => {
    const csvData = bookings.map((booking) => ({
      "Booking #": booking.bookingNumber,
      Client: booking.client?.fullName || 'Unknown',
      Photographer: booking.photographer?.businessName || booking.photographer?.user?.fullName || 'Unknown',
      Occasion: booking.occasionType,
      "Event Date": formatDate(booking.eventDate),
      Location: booking.eventLocation,
      Amount: booking.totalAmount,
      Status: booking.status,
      "Created At": formatDate(booking.createdAt),
    }));

    if (csvData.length === 0) return;

    // Convert to CSV
    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
          })
          .join(",")
      ),
    ].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        title="Failed to load bookings"
        message={error.message || "An error occurred while loading bookings. Please try again."}
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
            <Calendar className="w-8 h-8 text-teal-600" />
            Booking Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View and manage all photography bookings</p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{totalBookings}</p>
            </div>
            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{activeBookings}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{completedBookings}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by booking #, client, or photographer..."
          />
        </div>
        <FilterPanel filters={filterConfig} onChange={handleFilterChange} />
      </div>

      {/* Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        <DataTable
          data={bookings}
          columns={columns}
          onRowClick={(booking) => router.push(`/bookings/${booking.id}`)}
          emptyMessage="No bookings found"
        />
      </motion.div>
    </div>
  );
}
