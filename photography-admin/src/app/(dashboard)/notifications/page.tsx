"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Download,
  Check,
  CheckCheck,
  Filter,
  AlertCircle,
  Calendar,
  DollarSign,
  MessageSquare,
  UserCheck,
  Shield,
  User,
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import { SearchBar } from "@/components/shared/search-bar";
import { FilterPanel, FilterGroup } from "@/components/shared/filter-panel";
import { LoadingSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useNotifications, Notification, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/hooks/use-notifications";
import { formatDate, cn } from "@/lib/utils";
import { ActionMenu, ActionMenuItem } from "@/components/shared/action-menu";
import { toast } from "sonner";

// ============================================
// NOTIFICATION TYPE ICON
// ============================================

function NotificationTypeIcon({ type }: { type: Notification['type'] }) {
  const iconMap: Record<string, any> = {
    NEW_BOOKING: Calendar,
    PAYMENT_RECEIVED: DollarSign,
    NEW_REVIEW: MessageSquare,
    DISPUTE_OPENED: AlertCircle,
    VERIFICATION_REQUEST: UserCheck,
    NEW_USER: User,
  };

  const colorMap: Record<string, string> = {
    NEW_BOOKING: "text-blue-500",
    PAYMENT_RECEIVED: "text-emerald-500",
    NEW_REVIEW: "text-yellow-500",
    DISPUTE_OPENED: "text-red-500",
    VERIFICATION_REQUEST: "text-purple-500",
    NEW_USER: "text-cyan-500",
  };

  const Icon = iconMap[type] || Bell;
  const color = colorMap[type] || "text-gray-500";

  return <Icon className={cn("w-5 h-5", color)} />;
}

// ============================================
// CATEGORY ORIGIN BADGE
// ============================================

function CategoryOriginBadge({ category }: { category?: string }) {
  switch (category) {
    case 'DISPUTE':
      return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">DISPUTE</span>;
    case 'KYC':
      return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">KYC</span>;
    case 'USER':
      return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">NEW USER</span>;
    case 'BOOKING':
      return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">BOOKING</span>;
    case 'PAYMENT':
      return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">ESCROW</span>;
    case 'REVIEW':
      return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">REVIEW</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700">GENERAL</span>;
  }
}

// ============================================
// READ STATUS BADGE
// ============================================

function ReadStatusBadge({ read }: { read: boolean }) {
  return read ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
      <CheckCheck className="w-3 h-3" />
      Read
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
      <Bell className="w-3 h-3" />
      Unread
    </span>
  );
}

// ============================================
// NOTIFICATIONS PAGE
// ============================================

export default function NotificationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({
    type: [],
    status: "",
  });

  // Fetch notifications using the real API hook
  const { data, isLoading, error, refetch } = useNotifications({
    unreadOnly: filters.status === "unread" ? true : undefined,
  });

  // Mark as read mutations
  const { mutate: markAsRead, isPending: isMarkingAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();

  // Get notifications from data
  const allNotifications = data?.notifications || [];

  // Filter by search query and category
  const filteredNotifications = allNotifications.filter((notification) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = notification.title.toLowerCase().includes(query);
      const matchesMessage = notification.message.toLowerCase().includes(query);
      if (!matchesTitle && !matchesMessage) return false;
    }

    // Category filter
    if (filters.category && notification.category !== filters.category) {
      return false;
    }

    // Type filter
    if (filters.type.length > 0 && !filters.type.includes(notification.type)) {
      return false;
    }

    // Status filter
    if (filters.status === "unread" && notification.read) return false;
    if (filters.status === "read" && !notification.read) return false;

    return true;
  });

  // Action menu items generator
  const getNotificationActionMenuItems = (notification: Notification): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [];

    if (!notification.read) {
      items.push({
        id: "mark-read",
        label: "Mark as Read",
        icon: Check,
        variant: "default",
        disabled: isMarkingAsRead,
        onClick: () => {
          markAsRead(notification.id);
        },
      });
    }

    if (notification.link) {
      items.push({
        id: "view-details",
        label: "View Details",
        icon: Shield,
        variant: "default",
        onClick: () => {
          if (!notification.read) {
            markAsRead(notification.id);
          }
          if (notification.link) router.push(notification.link);
        },
      });
    }

    return items;
  };

  // Filter configuration
  const filterGroups: FilterGroup[] = [
    {
      id: "category",
      label: "Origin Source",
      type: "select",
      value: filters.category || "",
      options: [
        { label: "All Sources", value: "" },
        { label: "Disputes", value: "DISPUTE" },
        { label: "KYC Verification", value: "KYC" },
        { label: "New Users", value: "USER" },
        { label: "Bookings", value: "BOOKING" },
        { label: "Payments / Escrow", value: "PAYMENT" },
        { label: "Reviews", value: "REVIEW" },
      ],
    },
    {
      id: "type",
      label: "Notification Type",
      type: "multi-select",
      value: filters.type,
      options: [
        { label: "New User", value: "NEW_USER" },
        { label: "Dispute Opened", value: "DISPUTE_OPENED" },
        { label: "Verification Request", value: "VERIFICATION_REQUEST" },
        { label: "New Booking", value: "NEW_BOOKING" },
        { label: "Payment Received", value: "PAYMENT_RECEIVED" },
        { label: "New Review", value: "NEW_REVIEW" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      value: filters.status,
      options: [
        { label: "All Statuses", value: "" },
        { label: "Unread", value: "unread" },
        { label: "Read", value: "read" },
      ],
    },
  ];

  // Calculate stats
  const totalNotifications = allNotifications.length;
  const unreadCount = allNotifications.filter((n) => !n.read).length;
  const readCount = allNotifications.filter((n) => n.read).length;

  // Table columns
  const columns: ColumnDef<Notification>[] = [
    {
      id: "origin",
      header: "Source",
      cell: (notification) => <CategoryOriginBadge category={notification.category} />,
      width: "12%",
    },
    {
      id: "type",
      header: "Type",
      cell: (notification) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <NotificationTypeIcon type={notification.type} />
          </div>
        </div>
      ),
      width: "6%",
    },
    {
      id: "content",
      header: "Notification",
      cell: (notification) => (
        <div>
          <div className={cn(
            "font-semibold",
            notification.read
              ? "text-gray-700 dark:text-gray-300"
              : "text-gray-900 dark:text-gray-100"
          )}>
            {notification.title}
          </div>
          <div className={cn(
            "text-sm mt-0.5 line-clamp-2",
            notification.read
              ? "text-gray-500 dark:text-gray-500"
              : "text-gray-600 dark:text-gray-400"
          )}>
            {notification.message}
          </div>
        </div>
      ),
      width: "50%",
    },
    {
      id: "status",
      header: "Status",
      cell: (notification) => <ReadStatusBadge read={notification.read} />,
      sortable: false,
    },
    {
      id: "timestamp",
      header: "Date",
      accessorKey: "timestamp",
      cell: (notification) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDate(notification.timestamp)}
        </span>
      ),
    },
  ];

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters((prev) => ({ ...prev, [filterId]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      type: [],
      status: "",
    });
  };

  const handleRowClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    const unreadNotifications = allNotifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) {
      toast.info("No unread notifications");
      return;
    }

    if (window.confirm(`Mark all ${unreadNotifications.length} unread notifications as read?`)) {
      markAllAsRead();
      toast.success(`Marked all notifications as read`);
    }
  };

  const handleExportCSV = () => {
    if (allNotifications.length === 0) return;

    const headers = ["Type", "Title", "Message", "Status", "Date"];
    const rows = allNotifications.map((notification) => [
      notification.type.replace(/_/g, " "),
      notification.title,
      notification.message,
      notification.read ? "Read" : "Unread",
      formatDate(notification.timestamp),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notifications-export-${new Date().toISOString().split("T")[0]}.csv`;
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
        title="Failed to load notifications"
        message={error.message || "An error occurred while loading notifications. Please try again."}
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
            <Bell className="w-8 h-8 text-blue-500" />
            Notifications
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage all your admin notifications
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAsRead}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Notifications</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {totalNotifications}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</div>
          <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {unreadCount}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Read</div>
          <div className="mt-2 text-3xl font-bold text-gray-600 dark:text-gray-400">
            {readCount}
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search notifications by title or message..."
        />

        <FilterPanel
          filters={filterGroups}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredNotifications.length}</span> of{" "}
        <span className="font-semibold text-gray-900 dark:text-gray-100">{totalNotifications}</span> notifications
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredNotifications}
        columns={columns}
        onRowClick={handleRowClick}
        rowActions={(notification) => (
          <ActionMenu items={getNotificationActionMenuItems(notification)} align="right" />
        )}
        emptyMessage="No notifications found matching your search criteria"
        pageSize={20}
      />
    </div>
  );
}
