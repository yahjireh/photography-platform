"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
} from "lucide-react";
import { DetailCard, DetailRow, DetailGrid } from "@/components/shared/detail-card";
import { useAdminProfile, useUpdateAdminProfile } from "@/hooks/use-admin-profile";
import { formatDate, cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: adminProfile, isLoading, error, refetch } = useAdminProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateAdminProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    location_city: '',
  });

  // Open edit mode
  const handleStartEdit = () => {
    if (adminProfile) {
      setEditForm({
        first_name: adminProfile.first_name || '',
        last_name: adminProfile.last_name || '',
        phone_number: adminProfile.phone_number || '',
        location_city: adminProfile.location_city || '',
      });
      setIsEditing(true);
    }
  };

  // Handle form submission
  const handleSubmitEdit = (e: FormEvent) => {
    e.preventDefault();

    updateProfile(
      {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone_number: editForm.phone_number || null,
      },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully');
          setIsEditing(false);
          refetch();
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to update profile');
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error || !adminProfile) {
    return (
      <ErrorState
        title="Failed to load profile"
        message={error?.message || "Could not load your profile. Please try again."}
        onRetry={() => refetch()}
      />
    );
  }

  const fullName = `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim() || 'Admin User';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <User className="w-8 h-8 text-teal-600" />
            My Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account information and preferences
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-teal-100 dark:ring-teal-900/30">
            {adminProfile.first_name?.[0]?.toUpperCase() || 'A'}
            {adminProfile.last_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {fullName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{adminProfile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                <Shield className="w-3 h-3" />
                ADMIN
              </span>
            </div>
          </div>
        </div>

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="First name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Last name"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Phone number"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location_city}
                  onChange={(e) => setEditForm({ ...editForm, location_city: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="City"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors",
                  isUpdating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                )}
              >
                <Save className="w-4 h-4" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Display Mode */
          <DetailGrid columns={2}>
            <DetailRow
              label="Email Address"
              value={adminProfile.email}
              icon={<Mail className="w-4 h-4" />}
            />
            <DetailRow
              label="Phone Number"
              value={adminProfile.phone_number || "—"}
              icon={<Phone className="w-4 h-4" />}
            />
            <DetailRow
              label="Location"
              value={adminProfile.location_city || "—"}
              icon={<MapPin className="w-4 h-4" />}
            />
            <DetailRow
              label="Member Since"
              value={formatDate(adminProfile.created_at)}
              icon={<Calendar className="w-4 h-4" />}
            />
          </DetailGrid>
        )}
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Administrator Account
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You have full administrative access to the Photography Platform. Use this access responsibly to manage users, photographers, bookings, and disputes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
