"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star,
  Download,
  Eye,
  EyeOff,
  MoreVertical,
  TrendingUp,
  Filter,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import { SearchBar } from "@/components/shared/search-bar";
import { FilterPanel, FilterGroup } from "@/components/shared/filter-panel";
import { LoadingSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useReviews, Review, useModerateReview } from "@/hooks/use-reviews";
import { formatDate, cn } from "@/lib/utils";
import { ActionMenu, ActionMenuItem } from "@/components/shared/action-menu";

// ============================================
// RATING STARS COMPONENT
// ============================================

function RatingStars({ rating, showValue = true }: { rating: number; showValue?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
          )}
        />
      ))}
      {showValue && (
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-1">
          {rating}.0
        </span>
      )}
    </div>
  );
}

// ============================================
// VISIBILITY BADGE
// ============================================

function VisibilityBadge({ isHidden }: { isHidden: boolean }) {
  return isHidden ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
      <EyeOff className="w-3 h-3" />
      Hidden
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
      <Eye className="w-3 h-3" />
      Visible
    </span>
  );
}

// ============================================
// REVIEWS LIST PAGE
// ============================================

export default function ReviewsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({
    rating: [],
    hidden: "",
  });

  // Fetch reviews using the real API hook
  const { data, isLoading, error, refetch } = useReviews({
    search: searchQuery || undefined,
    rating: filters.rating?.length === 1 ? parseInt(filters.rating[0]) : undefined,
    hidden: filters.hidden === "hidden" ? true : filters.hidden === "visible" ? false : undefined,
  });

  // Moderation mutation
  const { mutate: moderateReview, isPending: isModerating } = useModerateReview();

  // Action menu items for each review
  const getReviewActionMenuItems = (review: Review): ActionMenuItem[] => [
    {
      id: "toggle-visibility",
      label: review.hidden ? "Show Review" : "Hide Review",
      icon: review.hidden ? Eye : EyeOff,
      variant: review.hidden ? "success" : "default",
      disabled: isModerating,
      onClick: () => {
        const action = review.hidden ? "show" : "hide";
        const message = review.hidden
          ? "Are you sure you want to show this review?"
          : "Are you sure you want to hide this review?";

        if (window.confirm(message)) {
          let reason: string | undefined;
          if (!review.hidden) {
            reason = window.prompt("Please provide a reason for hiding this review:") ?? undefined;
            if (!reason) return;
          }

          moderateReview({ reviewId: review.id, action, reason });
        }
      },
    },
  ];

  // Get reviews from data
  const reviews = data?.reviews || data?.items || [];

  // Filter configuration
  const filterGroups: FilterGroup[] = [
    {
      id: "rating",
      label: "Rating",
      type: "multi-select",
      value: filters.rating,
      options: [
        { label: "5 Stars", value: "5" },
        { label: "4 Stars", value: "4" },
        { label: "3 Stars", value: "3" },
        { label: "2 Stars", value: "2" },
        { label: "1 Star", value: "1" },
      ],
    },
    {
      id: "hidden",
      label: "Visibility",
      type: "select",
      value: filters.hidden,
      options: [
        { label: "Visible", value: "visible" },
        { label: "Hidden", value: "hidden" },
      ],
    },
  ];

  // Calculate stats
  const totalReviews = data?.pagination?.total || reviews.length;
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const visibleReviews = reviews.filter((r) => !r.hidden).length;
  const hiddenReviews = reviews.filter((r) => r.hidden).length;

  // Table columns - adapted to match API response structure
  const columns: ColumnDef<Review>[] = [
    {
      id: "client",
      header: "Client",
      cell: (review) => (
        <div className="flex items-center gap-3">
          <img
            src={review.client?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.clientId}`}
            alt={review.client?.fullName || 'Client'}
            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {review.client?.fullName || 'Unknown Client'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {review.booking?.bookingNumber || 'N/A'}
            </div>
          </div>
        </div>
      ),
      width: "20%",
    },
    {
      id: "photographer",
      header: "Photographer",
      cell: (review) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {review.photographer?.businessName || 'Unknown'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {review.booking?.occasionType || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      id: "rating",
      header: "Rating",
      accessorKey: "rating",
      cell: (review) => <RatingStars rating={review.rating} showValue={false} />,
    },
    {
      id: "comment",
      header: "Review",
      cell: (review) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {review.comment || "No comment provided"}
          </p>
        </div>
      ),
      sortable: false,
    },
    {
      id: "status",
      header: "Status",
      cell: (review) => <VisibilityBadge isHidden={review.hidden} />,
      sortable: false,
    },
    {
      id: "date",
      header: "Date",
      accessorKey: "createdAt",
      cell: (review) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(review.createdAt)}</span>
      ),
    },
  ];

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters((prev) => ({ ...prev, [filterId]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      rating: [],
      hidden: "",
    });
  };

  const handleRowClick = (review: Review) => {
    router.push(`/reviews/${review.id}`);
  };

  const handleExportCSV = () => {
    if (reviews.length === 0) return;

    const headers = ["Client", "Photographer", "Rating", "Comment", "Status", "Date"];
    const rows = reviews.map((review) => [
      review.client?.fullName || 'Unknown',
      review.photographer?.businessName || 'Unknown',
      review.rating,
      review.comment || "",
      review.hidden ? "Hidden" : "Visible",
      formatDate(review.createdAt),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reviews-export-${new Date().toISOString().split("T")[0]}.csv`;
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
        title="Failed to load reviews"
        message={error.message || "An error occurred while loading reviews. Please try again."}
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
            <Star className="w-8 h-8 text-yellow-500" />
            Reviews Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Moderate and manage client reviews and photographer ratings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hiddenReviews > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {hiddenReviews} Hidden
              </span>
            </div>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
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
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {totalReviews}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {averageRating.toFixed(1)}
            </span>
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Visible</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {visibleReviews}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Hidden</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {hiddenReviews}
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by client, photographer, booking number, or review content..."
        />

        <FilterPanel
          filters={filterGroups}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{reviews.length}</span> of{" "}
        <span className="font-semibold text-gray-900 dark:text-gray-100">{totalReviews}</span> reviews
      </div>

      {/* Data Table */}
      <DataTable
        data={reviews}
        columns={columns}
        onRowClick={handleRowClick}
        rowActions={(review) => (
          <ActionMenu items={getReviewActionMenuItems(review)} align="right" />
        )}
        emptyMessage="No reviews found matching your search criteria"
        pageSize={10}
      />
    </div>
  );
}
