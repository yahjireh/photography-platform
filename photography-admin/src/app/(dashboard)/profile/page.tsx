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
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { DetailCard, DetailRow, DetailGrid } from "@/components/shared/detail-card";
import {
  useAdminProfile,
  useUpdateAdminProfile,
  useChangeAdminPassword,
} from "@/hooks/use-admin-profile";
import { formatDate, cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: adminProfile, isLoading, error, refetch } = useAdminProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateAdminProfile();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangeAdminPassword();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    location_city: '',
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Open edit mode
  const handleStartEdit = () => {
    if (adminProfile) {
      setEditForm({
        first_name: adminProfile.first_name || '',
        last_name: adminProfile.last_name || '',
        email: adminProfile.email || '',
        phone_number: adminProfile.phone_number || '',
        location_city: adminProfile.location_city || '',
      });
      setIsEditing(true);
    }
  };

  // Handle profile form submission
  const handleSubmitEdit = (e: FormEvent) => {
    e.preventDefault();

    if (!editForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    updateProfile(
      {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email.trim(),
        phone_number: editForm.phone_number ? editForm.phone_number.trim() : null,
        location_city: editForm.location_city ? editForm.location_city.trim() : null,
      },
      {
        onSuccess: (res: any) => {
          toast.success(res?.message || 'Profile updated successfully');
          setIsEditing(false);
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to update profile');
        },
      }
    );
  };

  // Handle password change submission
  const handleSubmitPassword = (e: FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    changePassword(
      {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
      {
        onSuccess: (res: any) => {
          toast.success(res?.message || 'Password changed successfully');
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to change password');
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
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <User className="w-8 h-8 text-teal-600" />
            My Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your administrator account credentials, details, and security
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-teal-100 dark:ring-teal-900/30">
            {adminProfile.first_name?.[0]?.toUpperCase() || 'A'}
            {adminProfile.last_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {fullName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-0.5">{adminProfile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                <Shield className="w-3 h-3" />
                ADMIN
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                Verified Administrator
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="admin@yourdomain.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A verification confirmation notice is sent to new valid email domains.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="+233XXXXXXXXX or 02XXXXXXXX"
                />
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  City / Location
                </label>
                <input
                  type="text"
                  value={editForm.location_city}
                  onChange={(e) => setEditForm({ ...editForm, location_city: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Accra, Ghana"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
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
                {isUpdating ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
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

      {/* Security & Password Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Security & Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update your administrator password to keep your dashboard secure
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitPassword} className="space-y-4 max-w-xl pt-2">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Confirm new password"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors",
                isChangingPassword
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700 text-white"
              )}
            >
              <Lock className="w-4 h-4" />
              {isChangingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* System Access Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Super Administrator Privileges
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This account has full root-level control across all bookings, payments, disputes, photographers, and platform policies. Keep your credentials secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
