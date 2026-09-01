"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Camera,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Ban,
  Scale,
  Send,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DisputeStatus, User as UserType } from "@/types/dashboard";
import { useDispute, useResolveDispute, useUpdateDispute } from "@/hooks/use-disputes";
import { LoadingDetailSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import toast from "react-hot-toast";

// Extended dispute interface
interface DisputeDetail {
  id: string;
  bookingId: string;
  booking: {
    id: string;
    bookingNumber: string;
    occasionType: string;
    eventLocation: string;
    eventDate: string;
    totalAmount: number;
    status: string;
  };
  client: UserType;
  photographer: UserType;
  raisedBy: string;
  raisedByUser: UserType;
  reason: string;
  description: string;
  status: DisputeStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  resolution: string | null;
  resolvedBy: string | null;
  resolvedByUser: UserType | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  evidence: EvidenceItem[];
  responses: ResponseItem[];
  timeline: TimelineItem[];
}

interface EvidenceItem {
  id: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderType: "CLIENT" | "PHOTOGRAPHER";
  fileType: "IMAGE" | "DOCUMENT" | "VIDEO";
  fileName: string;
  fileUrl: string;
  fileSize: number;
  description: string;
  uploadedAt: string;
}

interface ResponseItem {
  id: string;
  responderId: string;
  responderName: string;
  responderType: "CLIENT" | "PHOTOGRAPHER" | "ADMIN";
  message: string;
  createdAt: string;
}

interface TimelineItem {
  id: string;
  type: "CREATED" | "RESPONSE_ADDED" | "EVIDENCE_ADDED" | "STATUS_CHANGED" | "RESOLVED" | "CLOSED";
  actor: string;
  actorType: "CLIENT" | "PHOTOGRAPHER" | "ADMIN";
  description: string;
  timestamp: string;
}

// Mock dispute detail data
const getMockDisputeDetail = (id: string): DisputeDetail => ({
  id: id,
  bookingId: "BK001",
  booking: {
    id: "BK001",
    bookingNumber: "BK-2024-001",
    occasionType: "Wedding",
    eventLocation: "Labadi Beach Hotel, Accra",
    eventDate: "2024-02-14T14:00:00Z",
    totalAmount: 5000,
    status: "DISPUTED",
  },
  client: {
    id: "USR001",
    email: "kwame.mensah@gmail.com",
    firstName: "Kwame",
    lastName: "Mensah",
    userType: "CLIENT",
    profileImageUrl: null,
    phoneNumber: "+233244123456",
    locationCity: "Accra",
    locationCountry: "Ghana",
    isVerified: true,
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  photographer: {
    id: "PHG001",
    email: "ama.asante@gmail.com",
    firstName: "Ama",
    lastName: "Asante",
    userType: "PHOTOGRAPHER",
    profileImageUrl: null,
    phoneNumber: "+233244789012",
    locationCity: "Accra",
    locationCountry: "Ghana",
    isVerified: true,
    isActive: true,
    createdAt: "2023-11-20T10:00:00Z",
    updatedAt: "2024-01-10T14:30:00Z",
  },
  raisedBy: "USR001",
  raisedByUser: {
    id: "USR001",
    email: "kwame.mensah@gmail.com",
    firstName: "Kwame",
    lastName: "Mensah",
    userType: "CLIENT",
    profileImageUrl: null,
    phoneNumber: "+233244123456",
    locationCity: "Accra",
    locationCountry: "Ghana",
    isVerified: true,
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  reason: "Poor Photo Quality",
  description:
    "The photos delivered were blurry and poorly edited. Many important moments were missed, including the cake cutting and first dance. The photographer left the venue early without capturing all promised shots. I have attached examples of the poor quality photos and the original agreement showing what was promised.",
  status: "OPEN",
  priority: "HIGH",
  resolution: null,
  resolvedBy: null,
  resolvedByUser: null,
  resolvedAt: null,
  createdAt: "2024-02-16T09:15:00Z",
  updatedAt: "2024-02-16T09:15:00Z",
  lastActivityAt: "2024-02-18T14:30:00Z",
  evidence: [
    {
      id: "EV001",
      uploadedBy: "USR001",
      uploaderName: "Kwame Mensah",
      uploaderType: "CLIENT",
      fileType: "IMAGE",
      fileName: "blurry_photos_sample.jpg",
      fileUrl: "/evidence/blurry_photos_sample.jpg",
      fileSize: 2048576,
      description: "Examples of blurry and out-of-focus photos from the wedding",
      uploadedAt: "2024-02-16T09:20:00Z",
    },
    {
      id: "EV002",
      uploadedBy: "USR001",
      uploaderName: "Kwame Mensah",
      uploaderType: "CLIENT",
      fileType: "DOCUMENT",
      fileName: "original_agreement.pdf",
      fileUrl: "/evidence/original_agreement.pdf",
      fileSize: 524288,
      description: "Original booking agreement showing promised deliverables",
      uploadedAt: "2024-02-16T09:25:00Z",
    },
    {
      id: "EV003",
      uploadedBy: "USR001",
      uploaderName: "Kwame Mensah",
      uploaderType: "CLIENT",
      fileType: "IMAGE",
      fileName: "missing_moments.jpg",
      fileUrl: "/evidence/missing_moments.jpg",
      fileSize: 1536000,
      description: "List of key moments that were not captured",
      uploadedAt: "2024-02-16T09:30:00Z",
    },
    {
      id: "EV004",
      uploadedBy: "PHG001",
      uploaderName: "Ama Asante",
      uploaderType: "PHOTOGRAPHER",
      fileType: "DOCUMENT",
      fileName: "equipment_issue_report.pdf",
      fileUrl: "/evidence/equipment_issue_report.pdf",
      fileSize: 307200,
      description: "Documentation of camera malfunction during event",
      uploadedAt: "2024-02-17T11:45:00Z",
    },
    {
      id: "EV005",
      uploadedBy: "PHG001",
      uploaderName: "Ama Asante",
      uploaderType: "PHOTOGRAPHER",
      fileType: "IMAGE",
      fileName: "full_photo_collection.zip",
      fileUrl: "/evidence/full_photo_collection.zip",
      fileSize: 15728640,
      description: "Complete set of all delivered photos for review",
      uploadedAt: "2024-02-17T14:20:00Z",
    },
  ],
  responses: [
    {
      id: "RSP001",
      responderId: "PHG001",
      responderName: "Ama Asante",
      responderType: "PHOTOGRAPHER",
      message:
        "I apologize for the quality issues. My primary camera had a lens malfunction during the ceremony which I didn't notice until reviewing the photos. I did capture the moments but some came out blurry. I'm willing to offer a partial refund and provide heavily edited versions to improve quality where possible.",
      createdAt: "2024-02-17T10:30:00Z",
    },
    {
      id: "RSP002",
      responderId: "USR001",
      responderName: "Kwame Mensah",
      responderType: "CLIENT",
      message:
        "While I appreciate the explanation, this was our wedding day and these photos can't be recreated. The agreement stated you would have backup equipment. I've uploaded evidence showing the extent of the quality issues. I'm requesting a 70% refund.",
      createdAt: "2024-02-18T14:30:00Z",
    },
  ],
  timeline: [
    {
      id: "TL001",
      type: "CREATED",
      actor: "Kwame Mensah",
      actorType: "CLIENT",
      description: "Dispute created citing poor photo quality and missed moments",
      timestamp: "2024-02-16T09:15:00Z",
    },
    {
      id: "TL002",
      type: "EVIDENCE_ADDED",
      actor: "Kwame Mensah",
      actorType: "CLIENT",
      description: "Uploaded 3 evidence files",
      timestamp: "2024-02-16T09:30:00Z",
    },
    {
      id: "TL003",
      type: "RESPONSE_ADDED",
      actor: "Ama Asante",
      actorType: "PHOTOGRAPHER",
      description: "Photographer responded with explanation",
      timestamp: "2024-02-17T10:30:00Z",
    },
    {
      id: "TL004",
      type: "EVIDENCE_ADDED",
      actor: "Ama Asante",
      actorType: "PHOTOGRAPHER",
      description: "Uploaded 2 evidence files",
      timestamp: "2024-02-17T14:20:00Z",
    },
    {
      id: "TL005",
      type: "RESPONSE_ADDED",
      actor: "Kwame Mensah",
      actorType: "CLIENT",
      description: "Client responded requesting 70% refund",
      timestamp: "2024-02-18T14:30:00Z",
    },
  ],
});

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  // Fetch dispute using real API
  const { data: dispute, isLoading, error, refetch } = useDispute(disputeId);
  const { mutate: resolveDispute, isPending: isResolving } = useResolveDispute();
  const { mutate: updateDispute, isPending: isUpdating } = useUpdateDispute();

  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [newResponse, setNewResponse] = useState("");

  // Confirmation dialog
  const { confirm, ConfirmDialog } = useConfirm();

  // Loading state
  if (isLoading) {
    return <LoadingDetailSkeleton />;
  }

  // Error state
  if (error || !dispute) {
    return (
      <ErrorState
        title="Failed to load dispute"
        message={error?.message || "The dispute could not be found. Please try again."}
        onRetry={() => refetch()}
        onBack={() => router.back()}
      />
    );
  }

  const isProcessing = isResolving || isUpdating;

  const handleMarkInReview = async () => {
    const confirmed = await confirm({
      title: "Mark as In Review?",
      description: "This dispute will be marked as currently being reviewed. The involved parties will be notified.",
      confirmLabel: "Mark In Review",
      variant: "default",
    });

    if (confirmed) {
      updateDispute({
        id: disputeId,
        data: { status: "IN_REVIEW" }
      });
    }
  };

  const handleResolveDispute = async () => {
    if (!resolutionText.trim()) {
      toast.error("Please provide a resolution description");
      return;
    }

    const confirmed = await confirm({
      title: "Resolve Dispute?",
      description: "This will mark the dispute as resolved and notify all involved parties. This action cannot be undone.",
      confirmLabel: "Resolve Dispute",
      variant: "default",
    });

    if (confirmed) {
      resolveDispute(
        {
          id: disputeId,
          data: {
            resolution: resolutionText,
            status: "RESOLVED",
            adminNotes: adminNotes || undefined,
          }
        },
        {
          onSuccess: () => {
            setShowResolutionForm(false);
            setResolutionText("");
            setAdminNotes("");
          }
        }
      );
    }
  };

  const handleCloseDispute = async () => {
    if (!resolutionText.trim()) {
      toast.error("Please provide a reason for closing");
      return;
    }

    const confirmed = await confirm({
      title: "Close Dispute?",
      description: "This will close the dispute without a formal resolution. This action should only be used for invalid or duplicate disputes.",
      confirmLabel: "Close Dispute",
      variant: "warning",
    });

    if (confirmed) {
      resolveDispute(
        {
          id: disputeId,
          data: {
            resolution: resolutionText,
            status: "CLOSED",
            adminNotes: adminNotes || undefined,
          }
        },
        {
          onSuccess: () => {
            setShowResolutionForm(false);
            setResolutionText("");
            setAdminNotes("");
          }
        }
      );
    }
  };

  const handleUpdatePriority = (priority: string) => {
    updateDispute({
      id: disputeId,
      data: { priority }
    });
  };

  const handleAddResponse = () => {
    if (!newResponse.trim()) return;
    updateDispute({
      id: disputeId,
      data: { adminNotes: newResponse.trim() }
    });
    setNewResponse("");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/disputes")}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <PageBreadcrumb
            items={[
              { label: "Disputes", href: "/disputes" },
              { label: `#${disputeId.slice(0, 8)}` },
            ]}
          />
        </div>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dispute #{dispute.id.slice(0, 8)}</h1>
              <PriorityBadge priority={dispute.priority} />
              <DisputeStatusBadge status={dispute.status} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Raised on {new Date(dispute.createdAt).toLocaleDateString()} by{" "}
              {dispute.raisedBy?.name || 'Unknown'} ({dispute.raisedBy?.userType || 'N/A'})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Panel */}
            {dispute.status !== "RESOLVED" && dispute.status !== "CLOSED" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Resolution Actions
                </h2>

                {!showResolutionForm ? (
                  <div className="flex flex-wrap items-center gap-3">
                    {dispute.status === "OPEN" && (
                      <button
                        onClick={handleMarkInReview}
                        disabled={isProcessing}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                          isProcessing
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        <Eye className="w-4 h-4" />
                        Mark In Review
                      </button>
                    )}

                    <button
                      onClick={() => setShowResolutionForm(true)}
                      disabled={isProcessing}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                        isProcessing
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      )}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve Dispute
                    </button>

                    <button
                      onClick={handleCloseDispute}
                      disabled={isProcessing}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                        isProcessing
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                          : "bg-gray-600 hover:bg-gray-700 text-white"
                      )}
                    >
                      <Ban className="w-4 h-4" />
                      Close Without Resolution
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Resolution Decision
                      </label>
                      <textarea
                        value={resolutionText}
                        onChange={(e) => setResolutionText(e.target.value)}
                        rows={4}
                        placeholder="Describe your resolution decision and reasoning..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Admin Notes (Optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        placeholder="Add internal notes about this resolution..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleResolveDispute}
                        disabled={isProcessing || !resolutionText.trim()}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                          isProcessing || !resolutionText.trim()
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        )}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isProcessing ? "Processing..." : "Mark as Resolved"}
                      </button>
                      <button
                        onClick={handleCloseDispute}
                        disabled={isProcessing || !resolutionText.trim()}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                          isProcessing || !resolutionText.trim()
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                            : "bg-gray-600 hover:bg-gray-700 text-white"
                        )}
                      >
                        <Ban className="w-4 h-4" />
                        {isProcessing ? "Processing..." : "Close Dispute"}
                      </button>
                      <button
                        onClick={() => setShowResolutionForm(false)}
                        disabled={isProcessing}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Resolution Details (if resolved) */}
            {dispute.status === "RESOLVED" && dispute.resolution && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Dispute Resolved
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200 mb-3 whitespace-pre-line">
                      {dispute.resolution}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-green-700 dark:text-green-300">
                      <span>
                        Resolved by: {dispute.resolvedBy?.name || 'Unknown'}
                      </span>
                      <span>•</span>
                      <span>Date: {new Date(dispute.resolvedAt!).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Dispute Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dispute Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Reason</label>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{dispute.reason}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                  <p className="text-base text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">
                    {dispute.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Evidence ({dispute.evidence.length})
              </h2>
              <div className="space-y-3">
                {dispute.evidence.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        evidence.fileType === "IMAGE"
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : evidence.fileType === "DOCUMENT"
                          ? "bg-orange-100 dark:bg-orange-900/30"
                          : "bg-purple-100 dark:bg-purple-900/30"
                      )}
                    >
                      {evidence.fileType === "IMAGE" ? (
                        <ImageIcon
                          className={cn(
                            "w-5 h-5",
                            evidence.fileType === "IMAGE"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-orange-600 dark:text-orange-400"
                          )}
                        />
                      ) : (
                        <FileText
                          className={cn(
                            "w-5 h-5",
                            evidence.fileType === "DOCUMENT"
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-purple-600 dark:text-purple-400"
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{evidence.fileName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{evidence.description}</p>
                        </div>
                        <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {evidence.uploaderName} ({evidence.uploaderType})
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(evidence.fileSize)}</span>
                        <span>•</span>
                        <span>{new Date(evidence.uploadedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication Thread */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Communication ({dispute.responses.length})
              </h2>
              <div className="space-y-4">
                {dispute.responses.map((response) => (
                  <div
                    key={response.id}
                    className={cn(
                      "p-4 rounded-lg",
                      response.responderType === "CLIENT"
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : response.responderType === "PHOTOGRAPHER"
                        ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                        : "bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            response.responderType === "CLIENT"
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                              : response.responderType === "PHOTOGRAPHER"
                              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                              : "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"
                          )}
                        >
                          {response.responderType}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{response.responderName}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(response.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{response.message}</p>
                  </div>
                ))}

                {/* Add Response Form */}
                {dispute.status !== "CLOSED" && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Add Admin Response
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        placeholder="Type your message to both parties..."
                        disabled={isProcessing}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddResponse();
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddResponse}
                        disabled={isProcessing || !newResponse.trim()}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                          isProcessing || !newResponse.trim()
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Activity Timeline
              </h2>
              <div className="space-y-4">
                {dispute.timeline.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          item.type === "CREATED"
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : item.type === "RESOLVED"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : item.type === "CLOSED"
                            ? "bg-gray-100 dark:bg-gray-700"
                            : "bg-purple-100 dark:bg-purple-900/30"
                        )}
                      >
                        {item.type === "CREATED" && (
                          <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                        {item.type === "RESPONSE_ADDED" && (
                          <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        )}
                        {item.type === "EVIDENCE_ADDED" && (
                          <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        )}
                        {item.type === "STATUS_CHANGED" && (
                          <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        )}
                        {item.type === "RESOLVED" && (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                        {item.type === "CLOSED" && <XCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                      </div>
                      {index < dispute.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.actor} • {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Booking Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Booking</h3>
              <div className="space-y-3">
                <div
                  onClick={() => router.push(`/bookings/${dispute.booking.id}`)}
                  className="cursor-pointer p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {dispute.booking.bookingNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                      {dispute.booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{dispute.booking.occasionType}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Event Date</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(dispute.booking.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Location</p>
                      <p className="text-gray-900 dark:text-white font-medium">{dispute.booking.eventLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Amount</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        ₵{dispute.booking.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Client
              </h3>
              <div
                onClick={() => router.push(`/users/${dispute.client.id}`)}
                className="cursor-pointer p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors mb-3"
              >
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {dispute.client.first_name} {dispute.client.last_name}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{dispute.client.email}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Phone</span>
                  <span className="text-gray-900 dark:text-white">{dispute.client.phone_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Location</span>
                  <span className="text-gray-900 dark:text-white">
                    {dispute.client.locationCity}, {dispute.client.locationCountry}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Verified</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      dispute.client.is_verified
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {dispute.client.is_verified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Photographer Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photographer
              </h3>
              <div
                onClick={() => router.push(`/photographers/${dispute.photographer.id}`)}
                className="cursor-pointer p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors mb-3"
              >
                <p className="font-medium text-purple-900 dark:text-purple-100">
                  {dispute.photographer.first_name} {dispute.photographer.last_name}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">{dispute.photographer.email}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Phone</span>
                  <span className="text-gray-900 dark:text-white">{dispute.photographer.phone_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Location</span>
                  <span className="text-gray-900 dark:text-white">
                    {dispute.photographer.locationCity}, {dispute.photographer.locationCountry}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Verified</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      dispute.photographer.is_verified
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {dispute.photographer.is_verified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dispute Metadata</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-gray-900 dark:text-white">{new Date(dispute.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                  <p className="text-gray-900 dark:text-white">{new Date(dispute.updatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Last Activity</p>
                  <p className="text-gray-900 dark:text-white">
                    {dispute.lastActivityAt ? new Date(dispute.lastActivityAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                {dispute.resolvedAt && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Resolved</p>
                    <p className="text-gray-900 dark:text-white">{new Date(dispute.resolvedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; className: string; icon: any }> = {
    CRITICAL: {
      label: "Critical",
      className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
      icon: AlertTriangle,
    },
    HIGH: {
      label: "High",
      className:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      icon: AlertCircle,
    },
    MEDIUM: {
      label: "Medium",
      className:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      icon: Clock,
    },
    LOW: {
      label: "Low",
      className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600",
      icon: AlertCircle,
    },
  };

  const { label, className, icon: Icon } = config[priority] || config.MEDIUM;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// Dispute Status Badge Component
function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const config: Record<DisputeStatus, { label: string; className: string; icon: any }> = {
    OPEN: {
      label: "Open",
      className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      icon: AlertCircle,
    },
    IN_REVIEW: {
      label: "In Review",
      className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      icon: Clock,
    },
    RESOLVED: {
      label: "Resolved",
      className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      icon: CheckCircle,
    },
    CLOSED: {
      label: "Closed",
      className: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      icon: XCircle,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
