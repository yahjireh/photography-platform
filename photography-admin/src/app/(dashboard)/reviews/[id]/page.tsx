"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Calendar,
  User as UserIcon,
  Camera,
  ShoppingBag,
  Flag,
  ThumbsUp,
  Ban,
  Loader2,
  AlertCircle as AlertCircleIcon,
} from "lucide-react";
import { DetailCard, DetailRow, DetailGrid, StatBadge, Divider } from "@/components/shared/detail-card";
import { Timeline, TimelineItem } from "@/components/shared/timeline";
import { formatDate, cn } from "@/lib/utils";
import { useReview, useModerateReview } from "@/hooks/use-reviews";


// ============================================
// RATING STARS COMPONENT
// ============================================

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-6 h-6",
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
          )}
        />
      ))}
      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 ml-2">
        {rating}.0
      </span>
    </div>
  );
}

// ============================================
// VISIBILITY STATUS BADGE
// ============================================

function VisibilityBadge({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        <Ban className="w-5 h-5" />
        Hidden
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
      <CheckCircle className="w-5 h-5" />
      Visible
    </span>
  );
}

// ============================================
// REVIEW DETAIL PAGE
// ============================================

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params?.id as string;

  // Fetch review data
  const { data: review, isLoading, error } = useReview(reviewId);
  const moderateReview = useModerateReview();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading review details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Reviews</span>
        </button>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Failed to Load Review</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {error.message || "An error occurred while loading the review details. Please try again."}
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
  if (!review) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Reviews</span>
        </button>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertCircleIcon className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Review not found</p>
          </div>
        </div>
      </div>
    );
  }

  const handleHide = () => {
    moderateReview.mutate({
      reviewId: review.id,
      action: 'hide',
    });
  };

  const handleShow = () => {
    moderateReview.mutate({
      reviewId: review.id,
      action: 'show',
    });
  };

  const handleFlag = () => {
    moderateReview.mutate({
      reviewId: review.id,
      action: 'flag',
      reason: 'Flagged for admin review',
    });
  };

  // Generate timeline from real data
  const timeline: TimelineItem[] = [
    {
      id: "created",
      title: "Review Submitted",
      description: "Client submitted review after booking completion",
      timestamp: review.createdAt,
      icon: Star,
      variant: "info",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Back to Reviews</span>
      </button>

      {/* Review Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-500" />
            Review Details
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review for {review.booking.bookingNumber} • {review.booking.occasionType}
          </p>
        </div>

        <VisibilityBadge hidden={review.hidden} />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Moderation Actions</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage this review's visibility and status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFlag}
            disabled={moderateReview.isPending}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              moderateReview.isPending
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700 text-white"
            )}
          >
            <Flag className="w-4 h-4" />
            Flag
          </button>
          {review.hidden ? (
            <button
              onClick={handleShow}
              disabled={moderateReview.isPending}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                moderateReview.isPending
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              )}
            >
              <Eye className="w-4 h-4" />
              Show Review
            </button>
          ) : (
            <button
              onClick={handleHide}
              disabled={moderateReview.isPending}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                moderateReview.isPending
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              <Ban className="w-4 h-4" />
              Hide Review
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Review Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Content Card */}
          <DetailCard title="Review Content" icon={Star}>
            <div className="space-y-6">
              {/* Rating */}
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Rating</p>
                <RatingStars rating={review.rating} />
              </div>

              <Divider />

              {/* Comment */}
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Review Comment</p>
                <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                  {review.comment || "No comment provided"}
                </p>
              </div>

              {/* Visibility Status */}
              <Divider />
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {!review.hidden ? (
                    <>
                      <Eye className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Visible to Public
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          This review is displayed on the photographer's profile
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Hidden from Public
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          This review is not visible on the photographer's profile
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DetailCard>

          {/* Related Booking */}
          <DetailCard
            title="Related Booking"
            icon={ShoppingBag}
            description="Details about the booking this review is for"
          >
            <DetailGrid columns={2}>
              <DetailRow label="Booking Number" value={review.booking.bookingNumber} />
              <DetailRow label="Occasion Type" value={review.booking.occasionType} />
              <DetailRow label="Event Date" value={review.booking.eventDate ? formatDate(review.booking.eventDate) : "—"} />
            </DetailGrid>
            <div className="mt-4">
              <button
                onClick={() => router.push(`/bookings/${review.bookingId}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                View Booking Details
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </DetailCard>

          {/* Client Information */}
          <DetailCard title="Client Information" icon={UserIcon}>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={review.client.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.clientId}`}
                alt={review.client.fullName}
                className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {review.client.fullName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Client ID: {review.clientId}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push(`/users/${review.clientId}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                View Client Profile
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </DetailCard>

          {/* Photographer Information */}
          <DetailCard title="Photographer Information" icon={Camera}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {review.photographer.businessName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Photographer ID: {review.photographerId}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push(`/photographers/${review.photographerId}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                View Photographer Profile
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </DetailCard>
        </div>

        {/* Right Column - Timeline & Metadata */}
        <div className="space-y-6">
          {/* Review Stats */}
          <div className="space-y-4">
            <StatBadge
              icon={Calendar}
              label="Review Date"
              value={formatDate(review.createdAt)}
            />
          </div>

          {/* Activity Timeline */}
          <DetailCard title="Activity Timeline" icon={Calendar}>
            <Timeline items={timeline} showRelativeTime={false} />
          </DetailCard>

          {/* Review Metadata */}
          <DetailCard title="Review Metadata" icon={AlertTriangle}>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Review ID</span>
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                  {review.id}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Visible to Public</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {review.hidden ? "No" : "Yes"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Booking ID</span>
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                  {review.bookingId}
                </span>
              </div>
            </div>
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
