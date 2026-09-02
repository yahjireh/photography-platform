"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  ShoppingBag,
  DollarSign,
  Star,
  Activity,
  Award,
  TrendingUp,
  Globe,
  Instagram,
  Image,
  Loader2,
  AlertCircle,
  Crown,
  Zap,
  Shield,
  Bell,
  Send,
  FileText,
} from "lucide-react";
import {
  DetailCard,
  DetailRow,
  DetailGrid,
  StatBadge,
  EmptyState,
  Divider,
} from "@/components/shared/detail-card";
import { Timeline, TimelineItem } from "@/components/shared/timeline";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import { Photographer, User, Booking } from "@/types/dashboard";
import { formatDate, formatCurrency, cn, getUserAvatar } from "@/lib/utils";
import { usePhotographer, useUpdatePhotographerTier, useUpdatePhotographer } from "@/hooks/use-photographers";
import { ActionMenu, ActionMenuItem } from "@/components/shared/action-menu";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageBreadcrumb, BackButton } from "@/components/shared/page-breadcrumb";
import toast from "react-hot-toast";


// ============================================
// VERIFICATION BADGE
// ============================================

function VerificationBadge({ status }: { status: string }) {
  const config: Record<string, { icon: any; label: string; className: string }> = {
    PENDING: {
      icon: Clock,
      label: "Pending Verification",
      className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    },
    VERIFIED: {
      icon: CheckCircle,
      label: "Verified",
      className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    },
    REJECTED: {
      icon: XCircle,
      label: "Verification Rejected",
      className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    },
  };

  const { icon: Icon, label, className } = config[status] || config.PENDING;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full", className)}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    CONFIRMED: { label: "Confirmed", className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
    COMPLETED: { label: "Completed", className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  };

  const config = statusConfig[status] || statusConfig.CONFIRMED;

  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full", config.className)}>
      {config.label}
    </span>
  );
}

// ============================================
// PHOTOGRAPHER DETAIL PAGE
// ============================================

export default function PhotographerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const photographerId = params?.id as string;

  // Fetch photographer data
  const { data: photographer, isLoading, error, refetch } = usePhotographer(photographerId);
  const { mutate: updateTier, isPending: isUpdatingTier } = useUpdatePhotographerTier();

  // Confirmation dialog
  const { confirm, ConfirmDialog } = useConfirm();

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

    if (!photographer || !notificationForm.title || !notificationForm.message) return;

    // TODO: Implement send notification API call
    console.log('Send notification to photographer:', photographer.id, notificationForm);

    // In a real implementation:
    // sendNotification(
    //   { userId: photographer.user_id, ...notificationForm },
    //   {
    //     onSuccess: () => {
    //       setIsNotificationModalOpen(false);
    //       toast.success('Notification sent successfully');
    //     }
    //   }
    // );

    // For now, just close and show success
    setIsNotificationModalOpen(false);
    const photographerName = `${photographer.users.first_name} ${photographer.users.last_name}`;
    alert(`Notification sent to ${photographerName}:\n\nTitle: ${notificationForm.title}\nMessage: ${notificationForm.message}`);
  };

  // Handler for tier change with confirmation
  const handleTierChange = async (tier: string, tierLabel: string) => {
    const confirmed = await confirm({
      title: `Change to ${tierLabel} Tier?`,
      description: `Are you sure you want to change this photographer's tier to ${tierLabel}? This will affect their commission rates and platform features.`,
      confirmLabel: `Set to ${tierLabel}`,
      variant: tier === "FREE" ? "warning" : "default",
    });

    if (confirmed) {
      updateTier({ photographerId, tier });
    }
  };

  // Action menu items for photographer
  const getActionMenuItems = (): ActionMenuItem[] => {
    const currentTier = photographer?.tier || "FREE";

    const tierItems: ActionMenuItem[] = [
      {
        id: "tier-free",
        label: "Set to FREE Tier",
        icon: Shield,
        variant: "default",
        disabled: currentTier === "FREE" || isUpdatingTier,
        hidden: currentTier === "FREE",
        onClick: () => handleTierChange("FREE", "FREE"),
      },
      {
        id: "tier-basic",
        label: "Set to BASIC Tier",
        icon: Zap,
        variant: "default",
        disabled: currentTier === "BASIC" || isUpdatingTier,
        hidden: currentTier === "BASIC",
        onClick: () => handleTierChange("BASIC", "BASIC"),
      },
      {
        id: "tier-premium",
        label: "Set to PREMIUM Tier",
        icon: Crown,
        variant: "success",
        disabled: currentTier === "PREMIUM" || isUpdatingTier,
        hidden: currentTier === "PREMIUM",
        onClick: () => handleTierChange("PREMIUM", "PREMIUM"),
      },
    ];

    return tierItems;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading photographer details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <BackButton href="/photographers" label="Back to Photographers" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Failed to Load Photographer</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {error.message || "An error occurred while loading the photographer details. Please try again."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!photographer) {
    return (
      <div className="space-y-6">
        <BackButton href="/photographers" label="Back to Photographers" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Photographer not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Booking table columns (using snake_case from backend)
  const bookingColumns: ColumnDef<any>[] = [
    {
      id: "bookingNumber",
      header: "Booking #",
      accessorKey: "booking_number",
      cell: (booking) => (
        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
          {booking.booking_number}
        </span>
      ),
    },
    {
      id: "occasion",
      header: "Occasion",
      accessorKey: "occasion_type",
      cell: (booking) => (
        <span className="text-gray-700 dark:text-gray-300">{booking.occasion_type}</span>
      ),
    },
    {
      id: "eventDate",
      header: "Event Date",
      accessorKey: "event_date",
      cell: (booking) => (
        <span className="text-gray-700 dark:text-gray-300">{formatDate(booking.event_date!)}</span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      accessorKey: "total_amount",
      cell: (booking) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(parseFloat(booking.total_amount) || 0)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (booking) => <StatusBadge status={booking.status!} />,
      sortable: false,
    },
  ];

  // Calculate stats from real data
  const bookings = photographer.users?.bookings_bookings_photographer_idTousers || [];
  const totalBookings = photographer.total_bookings || bookings.length || 0;
  const completedBookings = bookings.filter((b: any) => b.status === "COMPLETED").length;
  const totalEarnings = photographer.total_revenue || 0;
  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;
  const portfolioItems = photographer.portfolio_items || [];

  // Generate timeline from real data
  const timeline: TimelineItem[] = [
    {
      id: "created",
      title: "Account Created",
      description: "Photographer registered on the platform",
      timestamp: photographer.created_at,
      icon: Camera,
      variant: "success",
    },
  ];

  if (photographer.verification_status === "VERIFIED") {
    timeline.push({
      id: "verified",
      title: "Verification Approved",
      description: "Account verified by admin",
      timestamp: photographer.created_at,
      icon: CheckCircle,
      variant: "success",
    });
  }

  if (bookings.length > 0) {
    timeline.push({
      id: "first-booking",
      title: "First Booking Received",
      description: bookings[0]?.occasion_type || "First booking completed",
      timestamp: bookings[0]?.created_at || photographer.created_at,
      icon: ShoppingBag,
      variant: "info",
    });
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <BackButton href="/photographers" label="Back to Photographers" />
        <PageBreadcrumb
          items={[
            { label: "Photographers", href: "/photographers" },
            { label: photographer?.users ? `${photographer.users.first_name} ${photographer.users.last_name}` : `#${photographerId.slice(0, 8)}` },
          ]}
        />
      </div>

      {/* Photographer Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={getUserAvatar(photographer.users, `${photographer.users?.first_name} ${photographer.users?.last_name}`)}
              alt={`${photographer.users?.first_name} ${photographer.users?.last_name}`}
              className="w-24 h-24 rounded-full object-cover bg-gray-200 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-900"
            />
            {photographer.verification_status === "VERIFIED" && (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-900">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {photographer.users?.first_name} {photographer.users?.last_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{photographer.business_name}</p>
            <div className="flex items-center gap-3 mt-2">
              <VerificationBadge status={photographer.verification_status} />
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {Number(photographer.avg_rating)?.toFixed(1) || "0.0"}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({totalBookings} bookings)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/photographers/${photographerId}/kyc`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors font-medium"
          >
            <FileText className="w-4 h-4" />
            View KYC Details
          </button>
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
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBadge icon={ShoppingBag} label="Total Bookings" value={totalBookings} />
        <StatBadge icon={CheckCircle} label="Completion Rate" value={`${completionRate}%`} />
        <StatBadge icon={DollarSign} label="Total Earnings" value={formatCurrency(totalEarnings)} />
        <StatBadge icon={TrendingUp} label="Years Experience" value={photographer.years_experience || 0} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photographer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <DetailCard title="About" icon={Camera}>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {photographer.bio || "No bio provided"}
            </p>

            <Divider className="my-6" />

            <DetailGrid columns={2}>
              <DetailRow label="Email" value={photographer.users?.email || "—"} />
              <DetailRow label="Phone" value={photographer.users?.phone_number || "—"} />
              <DetailRow label="Location" value={photographer.users?.location_city || "—"} />
              <DetailRow label="Years of Experience" value={`${photographer.years_experience || 0} years`} />
              <DetailRow label="Hourly Rate" value={formatCurrency(photographer.hourly_rate || 0)} />
              <DetailRow label="Day Rate" value={formatCurrency(photographer.day_rate || 0)} />
              <DetailRow label="Member Since" value={formatDate(photographer.created_at)} />
              <DetailRow label="Tier" value={photographer.tier || "FREE"} />
            </DetailGrid>
          </DetailCard>

          {/* Portfolio */}
          {portfolioItems.length > 0 ? (
            <DetailCard title="Portfolio" icon={Image} description="Recent work samples">
              <div className="grid grid-cols-2 gap-4">
                {portfolioItems.slice(0, 4).map((item: any) => (
                  <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={item.image_url || item.imageUrl || item.url}
                      alt={item.title || "Portfolio item"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {item.title && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-sm font-medium">{item.title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </DetailCard>
          ) : (
            <DetailCard title="Portfolio" icon={Image} description="No portfolio items yet">
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No portfolio items available</p>
              </div>
            </DetailCard>
          )}

          {/* Booking History */}
          <DetailCard title="Booking History" icon={ShoppingBag} description={`${totalBookings} total bookings`}>
            {bookings.length > 0 ? (
              <DataTable
                data={bookings as any}
                columns={bookingColumns}
                showPagination={false}
                pageSize={5}
                emptyMessage="No bookings yet"
              />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No bookings yet</p>
              </div>
            )}
          </DetailCard>
        </div>

        {/* Right Column - Activity & Stats */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <DetailCard title="Activity Timeline" icon={Activity}>
            <Timeline items={timeline} showRelativeTime={false} />
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
                {photographer && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Recipient:</span> {photographer.users.first_name} {photographer.users.last_name} ({photographer.users.email})
                    </p>
                  </div>
                )}

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

      {/* Tier Change Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  );
}
