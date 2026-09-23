"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDate, cn, getUserAvatar } from "@/lib/utils";
import { usePendingVerifications, useVerifyPhotographer, Photographer } from "@/hooks/use-photographers";
import toast from "react-hot-toast";

interface VerificationCardProps {
  photographer: Photographer;
  onViewDetails: (id: string) => void;
}

function VerificationCard({ photographer, onViewDetails }: VerificationCardProps) {
  const { mutate: verify, isPending } = useVerifyPhotographer();
  const kycStatus = (photographer as any)?.photographer_kyc?.kyc_status;
  const hasSubmittedKYC = kycStatus === 'SUBMITTED' || kycStatus === 'IN_REVIEW';

  const handleApprove = () => {
    if (!hasSubmittedKYC) {
      toast.error('Photographer has not yet submitted KYC documents.');
      return;
    }
    verify(
      { photographerId: photographer.id, action: "approve" },
      {
        onSuccess: () => {
          toast.success(`${photographer.users?.first_name} ${photographer.users?.last_name} has been verified!`);
        },
      }
    );
  };

  const handleReject = () => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (!reason) return;

    verify(
      { photographerId: photographer.id, action: "reject", reason },
      {
        onSuccess: () => {
          toast.success("Photographer verification rejected");
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 overflow-hidden"
    >
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img
              src={getUserAvatar(photographer.users, `${photographer.users?.first_name} ${photographer.users?.last_name}`)}
              alt={`${photographer.users?.first_name} ${photographer.users?.last_name}`}
              className="w-16 h-16 rounded-full object-cover bg-gray-200 dark:bg-gray-700 ring-4 ring-yellow-100 dark:ring-yellow-900/30"
            />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {photographer.users?.first_name} {photographer.users?.last_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{photographer.users?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                  <Clock className="w-3 h-3" />
                  Pending Review
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Submitted {formatDate(photographer.created_at)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onViewDetails(photographer.id)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            View Full Profile
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
              Contact Information
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{photographer.users?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{photographer.users?.phone_number || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {photographer.service_area || photographer.users?.location_city || "—"}{photographer.region ? `, ${photographer.region} Region` : ""}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                  Emergency:
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {photographer.emergency_contact_name 
                    ? `${photographer.emergency_contact_name} (${photographer.emergency_contact_phone || 'No phone'})` 
                    : "Not provided"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
              Professional Info & Offerings
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {photographer.years_experience || 0} years experience
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Business: <strong>{photographer.business_name || "—"}</strong>
                </span>
              </div>
              {Array.isArray(photographer.packages) && photographer.packages.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">
                    {photographer.packages.length} Packages Configured
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {photographer.bio && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">
              Bio
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{photographer.bio}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewDetails(photographer.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ExternalLink className="w-5 h-5" />
            Review KYC Details
          </button>
          <button
            onClick={handleApprove}
            disabled={isPending || !hasSubmittedKYC}
            title={!hasSubmittedKYC ? "Photographer has not yet submitted KYC documents" : undefined}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors",
              isPending || !hasSubmittedKYC
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            <CheckCircle className="w-5 h-5" />
            {isPending ? "Processing..." : !hasSubmittedKYC ? "Awaiting KYC" : "Quick Approve"}
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors",
              isPending
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            <XCircle className="w-5 h-5" />
            {isPending ? "Processing..." : "Quick Reject"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function PendingVerificationsPage() {
  const router = useRouter();
  const { data, isLoading, error } = usePendingVerifications();

  const photographers = data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading pending verifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Failed to Load</h3>
          <p className="text-gray-600 dark:text-gray-400">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/photographers")}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Back to Photographers</span>
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-yellow-600" />
            Pending Verifications
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review and approve photographer verification requests
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
            {photographers.length} Pending Review
          </span>
        </div>
      </div>

      {photographers.length > 0 ? (
        <div className="space-y-6">
          {photographers.map((photographer) => (
            <VerificationCard
              key={photographer.id}
              photographer={photographer}
              onViewDetails={(id) => router.push(`/photographers/${id}/kyc`)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            All Caught Up!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no pending verification requests at the moment.
          </p>
          <button
            onClick={() => router.push("/photographers")}
            className="mt-6 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors"
          >
            Back to Photographers
          </button>
        </div>
      )}
    </div>
  );
}
