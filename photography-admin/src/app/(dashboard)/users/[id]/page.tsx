"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Ban,
  CheckCircle,
  MoreVertical,
  CreditCard,
  ShoppingBag,
  Activity,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Loader2,
  ShieldOff,
  ShieldCheck,
  Trash2,
  Bell,
  Send,
  Edit,
} from "lucide-react";
import {
  DetailCard,
  DetailRow,
  DetailGrid,
  DetailSection,
  InfoBadge,
  StatBadge,
  Divider,
} from "@/components/shared/detail-card";
import { Timeline, TimelineItem, groupTimelineByDate } from "@/components/shared/timeline";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import { Booking, Payment } from "@/types/dashboard";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActionMenu, ActionMenuItem } from "@/components/shared/action-menu";
import { FlagDialog, useFlagDialog } from "@/components/shared/flag-dialog";
import { ConfirmDialog, useConfirm } from "@/components/ui/confirm-dialog";
import { PageBreadcrumb, BackButton } from "@/components/shared/page-breadcrumb";

// Import API hooks
import { useUser, User as ApiUser, useUpdateUser, useSuspendUser } from "@/hooks/use-users";

// ============================================
// STATUS BADGE COMPONENT
// ============================================

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
    ACCEPTED: { label: "Accepted", className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
    CONFIRMED: { label: "Confirmed", className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
    COMPLETED: { label: "Completed", className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
    CANCELLED: { label: "Cancelled", className: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400" },
    SUCCESSFUL: { label: "Successful", className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
    FAILED: { label: "Failed", className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full", config.className)}>
      {config.label}
    </span>
  );
}

// ============================================
// USER DETAIL PAGE
// ============================================

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  // Fetch user data from API
  const { data: user, isLoading, error, refetch } = useUser(userId);
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: suspendUser, isPending: isSuspending } = useSuspendUser();

  // User suspension is tracked in backend, but we'll add it as a field if needed
  const [userSuspended, setUserSuspended] = useState(false);

  // Suspension dialog
  const suspendDialog = useFlagDialog();
  const { confirm, ConfirmDialog: UnsuspendConfirmDialog } = useConfirm();

  // Notification modal state
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'URGENT',
  });

  // Open notification modal
  const handleOpenNotificationModal = () => {
    setNotificationForm({
      title: '',
      message: '',
      type: 'INFO',
    });
    setIsNotificationModalOpen(true);
  };

  // Handle notification submission
  const handleSubmitNotification = (e: FormEvent) => {
    e.preventDefault();

    if (!user || !notificationForm.title || !notificationForm.message) return;

    // TODO: Implement send notification API call
    console.log('Send notification to user:', user.id, notificationForm);

    // In a real implementation:
    // sendNotification(
    //   { userId: user.id, ...notificationForm },
    //   {
    //     onSuccess: () => {
    //       setIsNotificationModalOpen(false);
    //       toast.success('Notification sent successfully');
    //     }
    //   }
    // );

    // For now, just close and show success
    setIsNotificationModalOpen(false);
    alert(`Notification sent to ${user.fullName}:\n\nTitle: ${notificationForm.title}\nMessage: ${notificationForm.message}`);
  };

  // Handler for confirming suspension with reason
  const handleConfirmSuspend = (reason: string) => {
    if (!user) return;
    suspendUser(
      { userId: user.id, suspended: true, reason },
      {
        onSuccess: () => {
          setUserSuspended(true);
        },
      }
    );
  };

  // Handler for unsuspending user
  const handleUnsuspend = async () => {
    if (!user) return;
    const confirmed = await confirm({
      title: "Unsuspend User?",
      description: `Are you sure you want to unsuspend ${user.fullName}? They will regain access to the platform.`,
      confirmLabel: "Unsuspend",
      variant: "default",
    });

    if (confirmed) {
      suspendUser(
        { userId: user.id, suspended: false },
        {
          onSuccess: () => {
            setUserSuspended(false);
          },
        }
      );
    }
  };

  // Action menu items
  const getActionMenuItems = (): ActionMenuItem[] => {
    if (!user) return [];

    return [
      {
        id: "suspend",
        label: userSuspended ? "Unsuspend User" : "Suspend User",
        icon: userSuspended ? ShieldCheck : ShieldOff,
        variant: userSuspended ? "success" : "danger",
        disabled: isSuspending,
        onClick: () => {
          if (userSuspended) {
            handleUnsuspend();
          } else {
            suspendDialog.open();
          }
        },
      },
      {
        id: "delete",
        label: "Delete User",
        icon: Trash2,
        variant: "danger",
        disabled: true, // Not implemented yet
        onClick: () => {
          // TODO: Implement delete user
        },
      },
    ];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="space-y-6">
        <BackButton href="/users" label="Back to Users" />

        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load user details. Please try again.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Calculate stats from user bookings
  const bookings = user.bookingsAsClient || [];
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Booking table columns (simplified data from user object)
  const bookingColumns: ColumnDef<any>[] = [
    {
      id: "id",
      header: "Booking ID",
      accessorKey: "id",
      cell: (booking) => (
        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
          {booking.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (booking) => <StatusBadge status={booking.status} />,
      sortable: false,
    },
    {
      id: "amount",
      header: "Amount",
      accessorKey: "totalAmount",
      cell: (booking) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(booking.totalAmount)}
        </span>
      ),
      align: "right",
    },
  ];

  // Build timeline from user data
  const timelineItems: TimelineItem[] = [
    {
      id: "created",
      title: "Account Created",
      description: "User registered on the platform",
      timestamp: user.createdAt,
      icon: UserIcon,
      variant: "success",
    },
  ];

  if (user.emailVerified) {
    timelineItems.push({
      id: "email-verified",
      title: "Email Verified",
      description: "User verified their email address",
      timestamp: user.createdAt, // We don't have exact timestamp
      icon: Mail,
      variant: "success",
    });
  }

  if (user.phoneVerified) {
    timelineItems.push({
      id: "phone-verified",
      title: "Phone Verified",
      description: "User verified their phone number",
      timestamp: user.createdAt, // We don't have exact timestamp
      icon: Phone,
      variant: "success",
    });
  }

  // Add bookings to timeline (only for clients/photographers)
  if (user.userType !== "ADMIN") {
    bookings.forEach((booking, index) => {
      timelineItems.push({
        id: `booking-${booking.id}`,
        title: `Booking ${booking.status}`,
        description: `Booking #${booking.id.slice(0, 8)}`,
        timestamp: user.createdAt,
        icon: ShoppingBag,
        variant: booking.status === "COMPLETED" ? "success" : "info",
      });
    });
  }

  if (user.updatedAt !== user.createdAt) {
    timelineItems.push({
      id: "updated",
      title: "Profile Updated",
      description: "User updated their profile",
      timestamp: user.updatedAt,
      icon: Edit,
      variant: "default",
    });
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <BackButton href="/users" label="Back to Users" />
        <PageBreadcrumb
          items={[
            { label: "Users", href: "/users" },
            { label: user?.fullName || `#${userId.slice(0, 8)}` },
          ]}
        />
      </div>

      {/* User Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
            alt={user.fullName}
            className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-900"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {user.fullName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full",
                user.userType === "CLIENT" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                user.userType === "PHOTOGRAPHER" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                user.userType === "ADMIN" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {user.userType}
              </span>
              {user.userType === "ADMIN" || (user.emailVerified && user.phoneVerified) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              ) : user.emailVerified ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                  Email Only
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  <Ban className="w-3 h-3" />
                  Unverified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden for ADMIN) */}
        {user.userType !== "ADMIN" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNotificationModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
            >
              <Bell className="w-4 h-4" />
              Send Notification
            </button>
            <ActionMenu
              items={getActionMenuItems()}
              buttonClassName="border-2 border-gray-200 dark:border-gray-700"
            />
          </div>
        )}
      </div>

      {/* Stats Row */}
      {user.userType === "ADMIN" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatBadge icon={ShieldCheck} label="Account Role" value="Platform Admin" />
          <StatBadge icon={CheckCircle} label="System Access" value="Full Privileges" />
          <StatBadge icon={Activity} label="Account Status" value="Active & Verified" />
          <StatBadge icon={Calendar} label="Member Since" value={formatDate(user.createdAt)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatBadge icon={ShoppingBag} label="Total Bookings" value={totalBookings} />
          <StatBadge icon={CheckCircle} label="Completed" value={completedBookings} />
          <StatBadge icon={DollarSign} label="Total Spent" value={formatCurrency(totalSpent)} />
          <StatBadge icon={Calendar} label="Member Since" value={formatDate(user.createdAt)} />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <DetailCard title="Profile Information" icon={UserIcon}>
            <DetailGrid columns={2}>
              <DetailRow label="Full Name" value={user.fullName} />
              <DetailRow label="Email Address" value={user.email} />
              <DetailRow label="Phone Number" value={user.phoneNumber || "—"} />
              <DetailRow label="User Type" value={user.userType} />
              <DetailRow
                label="Location"
                value={user.city ? `${user.city}, ${user.country}` : "—"}
              />
              <DetailRow
                label="Email Verified"
                value={user.userType === "ADMIN" || user.emailVerified ? "Yes" : "No"}
              />
              <DetailRow
                label="Phone Verified"
                value={user.userType === "ADMIN" ? (user.phoneNumber ? "Yes" : "—") : (user.phoneVerified ? "Yes" : "No")}
              />
              <DetailRow label="Joined" value={formatDate(user.createdAt)} />
              <DetailRow label="Last Updated" value={formatDate(user.updatedAt)} />
              {user.photographer && (
                <>
                  <DetailRow
                    label="Photographer Status"
                    value={user.photographer.verificationStatus}
                  />
                  <DetailRow label="Photographer Tier" value={user.photographer.tier} />
                </>
              )}
            </DetailGrid>
          </DetailCard>

          {/* Booking History (Only for non-admin users) */}
          {user.userType !== "ADMIN" && (
            <DetailCard
              title="Booking History"
              icon={ShoppingBag}
              description={`${totalBookings} total bookings`}
            >
              {bookings.length > 0 ? (
                <DataTable
                  data={bookings}
                  columns={bookingColumns}
                  showPagination={false}
                  pageSize={5}
                  emptyMessage="No bookings yet"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">No bookings yet</div>
              )}
            </DetailCard>
          )}
        </div>

        {/* Right Column - Activity Timeline */}
        <div className="space-y-6">
          <DetailCard title="Activity Timeline" icon={Activity}>
            <Timeline items={timelineItems} showRelativeTime={false} />
          </DetailCard>
        </div>
      </div>

      {/* Send Notification Modal */}
      <AnimatePresence>
        {isNotificationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setIsNotificationModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Send Notification
                </h2>
              </div>

              <form onSubmit={handleSubmitNotification} className="space-y-4">
                {/* Notification Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notification Type
                  </label>
                  <select
                    value={notificationForm.type}
                    onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter notification title"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter notification message..."
                  />
                </div>

                {/* Recipient Info */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Recipient:</span> {user?.fullName} ({user?.email})
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send Notification
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNotificationModalOpen(false)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suspend User Dialog */}
      <FlagDialog
        open={suspendDialog.isOpen}
        onOpenChange={suspendDialog.setIsOpen}
        title="Suspend User"
        description={`Are you sure you want to suspend ${user?.fullName || "this user"}? They will not be able to access their account until unsuspended.`}
        onConfirm={handleConfirmSuspend}
        isLoading={isSuspending}
        inputLabel="Reason for suspension"
        inputPlaceholder="Please provide a reason for suspending this user..."
        confirmLabel="Suspend User"
      />

      {/* Unsuspend Confirmation Dialog */}
      <UnsuspendConfirmDialog />
    </div>
  );
}
