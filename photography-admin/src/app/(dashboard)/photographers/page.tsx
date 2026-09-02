"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Download,
  Plus,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import { SearchBar } from "@/components/shared/search-bar";
import { FilterPanel, FilterGroup } from "@/components/shared/filter-panel";
import { formatDate, formatCurrency, cn, getUserAvatar } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Import API hooks
import { usePhotographers, Photographer as ApiPhotographer } from "@/hooks/use-photographers";

// ============================================
// VERIFICATION BADGE COMPONENT
// ============================================

interface VerificationBadgeProps {
  status: "PENDING" | "VERIFIED" | "REJECTED";
}

function VerificationBadge({ status }: VerificationBadgeProps) {
  const config = {
    PENDING: {
      icon: Clock,
      label: "Pending",
      className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    },
    VERIFIED: {
      icon: CheckCircle,
      label: "Verified",
      className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    },
    REJECTED: {
      icon: XCircle,
      label: "Rejected",
      className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full", className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ============================================
// RATING DISPLAY
// ============================================

function RatingDisplay({ rating, showValue = true }: { rating: number; showValue?: boolean }) {
  if (rating === 0 || !rating) {
    return <span className="text-sm text-gray-400 dark:text-gray-500">No ratings</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      {showValue && (
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ============================================
// PHOTOGRAPHERS LIST PAGE
// ============================================

export default function PhotographersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    verificationStatus: "",
    tier: "",
  });

  // Fetch photographers from API
  const { data, isLoading, error, refetch } = usePhotographers({
    page: currentPage,
    limit: 20,
    search: searchQuery,
    verificationStatus: filters.verificationStatus || undefined,
    tier: filters.tier || undefined,
  });

  const photographers = data?.photographers || [];
  const pagination = data?.pagination;

  // Calculate stats
  const stats = {
    total: pagination?.total || 0,
    verified: photographers.filter(p => p.verification_status === "VERIFIED").length,
    pending: photographers.filter(p => p.verification_status === "PENDING").length,
    avgRating: photographers.filter(p => p.avg_rating && p.avg_rating > 0).reduce((sum, p) => sum + (p.avg_rating || 0), 0) /
               (photographers.filter(p => p.avg_rating && p.avg_rating > 0).length || 1),
  };

  // Filter configuration
  const filterGroups: FilterGroup[] = [
    {
      id: "verificationStatus",
      label: "Verification",
      type: "select",
      value: filters.verificationStatus,
      options: [
        { label: "All", value: "" },
        { label: "Verified", value: "VERIFIED" },
        { label: "Pending", value: "PENDING" },
        { label: "Rejected", value: "REJECTED" },
      ],
    },
    {
      id: "tier",
      label: "Tier",
      type: "select",
      value: filters.tier,
      options: [
        { label: "All", value: "" },
        { label: "Free", value: "FREE" },
        { label: "Pro", value: "PRO" },
        { label: "Enterprise", value: "ENTERPRISE" },
      ],
    },
  ];

  // Table columns
  const columns: ColumnDef<ApiPhotographer>[] = [
    {
      id: "photographer",
      header: "Photographer",
      accessorKey: "business_name",
      cell: (photographer) => (
        <div className="flex items-center gap-3">
          <img
            src={getUserAvatar(photographer.users, photographer.business_name)}
            alt={photographer.business_name}
            className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
          />
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {photographer.business_name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{photographer.users.email}</div>
          </div>
        </div>
      ),
      width: "25%",
    },
    {
      id: "tier",
      header: "Tier",
      accessorKey: "tier",
      cell: (photographer) => (
        <span className={cn(
          "px-2.5 py-1 text-xs font-semibold rounded-full",
          photographer.tier === "FREE" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          photographer.tier === "PRO" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
          photographer.tier === "ENTERPRISE" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        )}>
          {photographer.tier}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: (photographer) => (
        <span className="text-gray-700 dark:text-gray-300">
          {photographer.users.location_city || "—"}
        </span>
      ),
    },
    {
      id: "rating",
      header: "Rating",
      accessorKey: "avg_rating",
      cell: (photographer) => <RatingDisplay rating={photographer.avg_rating || 0} />,
    },
    {
      id: "bookings",
      header: "Bookings",
      accessorKey: "total_bookings",
      cell: (photographer) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {photographer.total_bookings || 0}
        </span>
      ),
      align: "center",
    },
    {
      id: "verification",
      header: "Status",
      cell: (photographer) => <VerificationBadge status={photographer.verification_status} />,
      sortable: false,
    },
  ];

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters((prev) => ({ ...prev, [filterId]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      verificationStatus: "",
      tier: "",
    });
    setCurrentPage(1);
  };

  const handleRowClick = (photographer: ApiPhotographer) => {
    router.push(`/photographers/${photographer.id}`);
  };

  const renderRowActions = (photographer: ApiPhotographer) => {
    return (
      <div className="relative group">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/photographers/${photographer.id}`);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Eye className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  };

  // Error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Camera className="w-8 h-8 text-teal-600" />
              Photographers Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage photographer profiles, verifications, and performance
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load photographers. Please try again.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Camera className="w-8 h-8 text-teal-600" />
            Photographers Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage photographer profiles, verifications, and performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {stats.pending > 0 && (
            <button
              onClick={() => router.push("/photographers/pending")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors font-medium"
            >
              <AlertCircle className="w-4 h-4" />
              {stats.pending} Pending Verification
            </button>
          )}
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            onClick={() => {}}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Photographers</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? "—" : stats.total}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {isLoading ? "—" : stats.verified}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Verification</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {isLoading ? "—" : stats.pending}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isLoading ? "—" : stats.avgRating.toFixed(1)}
            </span>
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, or business name..."
          isLoading={isLoading}
        />

        <FilterPanel
          filters={filterGroups}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Results Count */}
      {!isLoading && pagination && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{photographers.length}</span> of{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">{pagination.total}</span> photographers
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Data Table */}
      {!isLoading && photographers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Camera className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No photographers found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || filters.verificationStatus || filters.tier
              ? "Try adjusting your filters or search terms"
              : "No photographers available yet"}
          </p>
        </div>
      ) : (
        <DataTable
          data={photographers}
          columns={columns}
          onRowClick={handleRowClick}
          rowActions={renderRowActions}
          isLoading={isLoading}
          emptyMessage="No photographers found matching your search criteria"
          pageSize={20}
          currentPage={currentPage}
          totalPages={pagination?.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
