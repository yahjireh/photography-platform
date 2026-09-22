"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Camera,
  CreditCard,
  Eye,
  Download,
  Ban,
  Flag,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { LoadingDetailSkeleton } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { DetailCard, DetailRow, DetailGrid } from "@/components/shared/detail-card";
import { formatDate, cn } from "@/lib/utils";
import {
  usePhotographerKYC,
  useUpdateKYCReview,
  useKYCDecision,
  useUpdateKYCAccessControls,
  useVerifyKYCDocument,
  KYCStatus,
  CheckResult,
  ReasonCode,
  RequestInfoItem,
} from "@/hooks/use-kyc";
import { toast } from "sonner";

// ============================================
// STATUS BADGE COMPONENTS
// ============================================

function KYCStatusBadge({ status }: { status: KYCStatus }) {
  const config = {
    DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700", icon: FileText },
    SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700", icon: Clock },
    IN_REVIEW: { label: "In Review", className: "bg-yellow-100 text-yellow-700", icon: Eye },
    APPROVED: { label: "Approved", className: "bg-green-100 text-green-700", icon: CheckCircle },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700", icon: XCircle },
    NEEDS_MORE_INFO: { label: "Needs More Info", className: "bg-orange-100 text-orange-700", icon: AlertTriangle },
    SUSPENDED: { label: "Suspended", className: "bg-red-100 text-red-700", icon: Ban },
  }[status];

  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full", config.className)}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}

function CheckResultBadge({ result }: { result?: CheckResult }) {
  if (!result) return <span className="text-gray-400">—</span>;

  const config = {
    PASS: { label: "Pass", className: "bg-green-100 text-green-700", icon: CheckCircle },
    FAIL: { label: "Fail", className: "bg-red-100 text-red-700", icon: XCircle },
    UNCLEAR: { label: "Unclear", className: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
  }[result];

  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full", config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ============================================
// DECISION MODAL COMPONENT
// ============================================

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'approve' | 'reject' | 'request_more_info' | 'suspend';
  onSubmit: (data: {
    decision_reason_code?: ReasonCode;
    decision_notes: string;
    request_info_items?: RequestInfoItem[];
  }) => void;
  isPending: boolean;
}

function DecisionModal({ isOpen, onClose, action, onSubmit, isPending }: DecisionModalProps) {
  const [reasonCode, setReasonCode] = useState<ReasonCode | ''>('');
  const [notes, setNotes] = useState('');
  const [requestItems, setRequestItems] = useState<RequestInfoItem[]>([]);

  const actionConfig = {
    approve: { title: 'Approve KYC', color: 'green', requiresNotes: false },
    reject: { title: 'Reject KYC', color: 'red', requiresNotes: true },
    request_more_info: { title: 'Request More Information', color: 'orange', requiresNotes: true },
    suspend: { title: 'Suspend Photographer', color: 'red', requiresNotes: true },
  }[action];

  const reasonCodes: ReasonCode[] = [
    'ID_NOT_CLEAR',
    'ID_EXPIRED',
    'NAME_MISMATCH',
    'DUPLICATE_ID',
    'DUPLICATE_PAYOUT_DETAILS',
    'PORTFOLIO_INSUFFICIENT',
    'PORTFOLIO_SUSPECTED_STOLEN',
    'PAYMENT_DETAILS_INCOMPLETE',
    'PAYMENT_NAME_MISMATCH',
    'POLICY_VIOLATION',
    'OTHER',
  ];

  const requestInfoItems: RequestInfoItem[] = [
    'ID_NOT_CLEAR',
    'ID_EXPIRED',
    'SELFIE_MISSING',
    'PORTFOLIO_TOO_SMALL',
    'PORTFOLIO_UNCLEAR',
    'PAYMENT_NAME_MISMATCH',
    'PAYMENT_DETAILS_INCOMPLETE',
    'OTHER',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (actionConfig.requiresNotes && !notes.trim()) {
      toast.error('Notes are required');
      return;
    }

    onSubmit({
      decision_reason_code: reasonCode || undefined,
      decision_notes: notes,
      request_info_items: action === 'request_more_info' ? requestItems : undefined,
    });
  };

  const toggleRequestItem = (item: RequestInfoItem) => {
    setRequestItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {actionConfig.title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Code */}
          {(action === 'reject' || action === 'request_more_info' || action === 'suspend') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason Code {actionConfig.requiresNotes && '*'}
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as ReasonCode)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={actionConfig.requiresNotes}
              >
                <option value="">Select a reason</option>
                {reasonCodes.map(code => (
                  <option key={code} value={code}>{code.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          )}

          {/* Request Info Items */}
          {action === 'request_more_info' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What information is needed?
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {requestInfoItems.map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={requestItems.includes(item)}
                      onChange={() => toggleRequestItem(item)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item.replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes {actionConfig.requiresNotes && '*'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              required={actionConfig.requiresNotes}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide detailed notes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors",
                actionConfig.color === 'green' && "bg-green-600 hover:bg-green-700 text-white",
                actionConfig.color === 'red' && "bg-red-600 hover:bg-red-700 text-white",
                actionConfig.color === 'orange' && "bg-orange-600 hover:bg-orange-700 text-white",
                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              {isPending ? 'Processing...' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================
// MAIN KYC VERIFICATION PAGE
// ============================================

export default function KYCVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const photographerId = params?.id as string;

  // Fetch KYC data
  const { data: kycData, isLoading, error, refetch } = usePhotographerKYC(photographerId);
  const { mutate: updateReview } = useUpdateKYCReview();
  const { mutate: makeDecision, isPending: isDecisionPending } = useKYCDecision();
  const { mutate: updateAccessControls } = useUpdateKYCAccessControls();

  // Decision modal state
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | 'request_more_info' | 'suspend'>('approve');

  // Loading state
  if (isLoading) {
    return <LoadingDetailSkeleton />;
  }

  // Error state
  if (error || !kycData) {
    return (
      <ErrorState
        title="Failed to load KYC data"
        message={error?.message || "Could not load KYC verification data"}
        onRetry={() => refetch()}
      />
    );
  }

  // Calculate age safely
  const calculateAge = (dob?: string | null) => {
    if (!dob) return null;
    try {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? age : null;
    } catch {
      return null;
    }
  };

  // Safe object normalization to guarantee zero rendering crashes
  const kyc = {
    ...kycData,
    identity: {
      legal_name: kycData.identity?.legal_name || 'Photographer Applicant',
      date_of_birth: kycData.identity?.date_of_birth || null,
      age: kycData.identity?.age ?? calculateAge(kycData.identity?.date_of_birth),
      nationality: kycData.identity?.nationality || 'Ghana',
      id_type: (kycData.identity?.id_type || 'GHANA_CARD') as any,
      id_number: kycData.identity?.id_number || 'Not provided',
      identity_check_result: kycData.identity?.identity_check_result || undefined,
      identity_fail_reason_code: kycData.identity?.identity_fail_reason_code,
      identity_notes: kycData.identity?.identity_notes
    },
    contact: {
      email: kycData.contact?.email || '',
      phone: kycData.contact?.phone || '',
      email_verified: !!kycData.contact?.email_verified,
      phone_verified: !!kycData.contact?.phone_verified,
      city: kycData.contact?.city || '—',
      region: kycData.contact?.region || '—',
      service_area: kycData.contact?.service_area || '—',
      contact_check_result: kycData.contact?.contact_check_result || undefined,
      contact_notes: kycData.contact?.contact_notes
    },
    portfolio: {
      categories: kycData.portfolio?.categories || [],
      years_experience: kycData.portfolio?.years_experience || undefined,
      portfolio_link: kycData.portfolio?.portfolio_link || '',
      portfolio_check_result: kycData.portfolio?.portfolio_check_result || undefined,
      portfolio_quality: kycData.portfolio?.portfolio_quality || undefined,
      originality_flag: kycData.portfolio?.originality_flag || undefined,
      portfolio_notes: kycData.portfolio?.portfolio_notes
    },
    payment: {
      payout_method: (kycData.payment?.payout_method || 'MOMO') as any,
      account_holder_name: kycData.payment?.account_holder_name || '—',
      momo_network: (kycData.payment?.momo_network || undefined) as any,
      momo_number: kycData.payment?.momo_number || '',
      bank_name: kycData.payment?.bank_name || undefined,
      bank_account_number: kycData.payment?.bank_account_number || undefined,
      payout_name_match: (kycData.payment?.payout_name_match || 'NOT_CHECKED') as any,
      payout_check_result: kycData.payment?.payout_check_result || undefined,
      payout_notes: kycData.payment?.payout_notes
    },
    access_controls: kycData.access_controls || {
      is_search_visible: false,
      can_accept_bookings: false,
      can_receive_payouts: false,
      kyc_verified_badge: false
    },
    documents: kycData.documents || [],
    audit_timeline: kycData.audit_timeline || []
  };

  const photographer = kycData.photographer || {
    id: photographerId,
    display_name: kyc.identity.legal_name || 'Artisan Photographer',
    business_name: 'Studio Artisan'
  };

  // Handle decision action
  const openDecisionModal = (action: typeof currentAction) => {
    setCurrentAction(action);
    setDecisionModalOpen(true);
  };

  const handleDecision = (decisionData: any) => {
    const accessControls = currentAction === 'approve'
      ? {
          is_search_visible: true,
          can_accept_bookings: true,
          can_receive_payouts: kyc.payment.payout_check_result === 'PASS',
          kyc_verified_badge: true,
        }
      : currentAction === 'reject' || currentAction === 'suspend'
      ? {
          is_search_visible: false,
          can_accept_bookings: false,
          can_receive_payouts: false,
          kyc_verified_badge: false,
        }
      : undefined;

    makeDecision(
      {
        photographerId,
        decision: {
          action: currentAction,
          ...decisionData,
          access_controls: accessControls,
        },
      },
      {
        onSuccess: () => {
          setDecisionModalOpen(false);
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to process KYC decision');
        }
      }
    );
  };

  // Toggle access control
  const toggleAccessControl = (field: keyof typeof kyc.access_controls) => {
    updateAccessControls({
      photographerId,
      controls: {
        [field]: !kyc.access_controls[field],
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/photographers/pending')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Back to Pending Verifications</span>
      </button>

      {/* A. Header / Context */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {photographer.display_name}
              </h1>
              <KYCStatusBadge status={kyc.kyc_status} />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Legal Name: {kyc.identity.legal_name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Photographer ID: {photographerId} • User ID: {kyc.user_id}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
              <span>Submitted: {kyc.submitted_at ? formatDate(kyc.submitted_at) : 'Not submitted'}</span>
              <span>•</span>
              <span>Last Updated: {formatDate(kyc.last_updated_at)}</span>
            </div>
          </div>

          {/* Decision Actions: Only show when not yet approved */}
          {kyc.kyc_status !== 'APPROVED' ? (
            <div className="flex items-center gap-2">
              {(!kyc.submitted_at || kyc.kyc_status === 'DRAFT') ? (
                <span className="px-3.5 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Awaiting Applicant Submission
                </span>
              ) : (
                <button
                  onClick={() => openDecisionModal('approve')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-sm"
                >
                  Approve
                </button>
              )}
              <button
                onClick={() => openDecisionModal('request_more_info')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                Request Info
              </button>
              <button
                onClick={() => openDecisionModal('reject')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={() => openDecisionModal('suspend')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                Suspend
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span>Verified & Approved • Action Completed</span>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => router.push(`/photographers/${photographerId}`)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Open Photographer Profile →
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => router.push(`/bookings?photographer=${photographerId}`)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Open Bookings →
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => router.push(`/payments?photographer=${photographerId}`)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Open Payouts →
          </button>
        </div>
      </div>

      {/* Notice when KYC is not yet submitted */}
      {(!kyc.submitted_at || kyc.kyc_status === 'DRAFT') && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800/40 rounded-xl p-5 flex items-start gap-4 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
              KYC Verification Not Yet Submitted
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
              This photographer has created an account but has not yet completed their 8-step verification or uploaded identity credentials. The information below is an unsubmitted draft and has not been evaluated or verified.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Verification Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* B. Identity Section */}
          <DetailCard title="Identity Verification" icon={User}>
            <div className="space-y-4">
              <DetailGrid columns={2}>
                <DetailRow label="Legal Name" value={kyc.identity.legal_name} />
                <DetailRow
                  label="Date of Birth"
                  value={kyc.identity.date_of_birth ? `${formatDate(kyc.identity.date_of_birth)}${calculateAge(kyc.identity.date_of_birth) ? ` (${calculateAge(kyc.identity.date_of_birth)} years old)` : ''}` : 'Not provided'}
                />
                <DetailRow label="Nationality" value={kyc.identity.nationality || 'Ghana'} />
                <DetailRow label="ID Type" value={kyc.identity.id_type ? kyc.identity.id_type.replace(/_/g, ' ') : '—'} />
                <DetailRow label="ID Number" value={kyc.identity.id_number || 'Not provided'} />
                <DetailRow
                  label="Check Result"
                  value={<CheckResultBadge result={kyc.identity.identity_check_result} />}
                />
              </DetailGrid>

              {/* ID Documents */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Identity Documents
                </h4>
                {kyc.documents.filter(doc => doc.document_type.startsWith('id_') || doc.document_type.startsWith('ghana_') || doc.document_type === 'selfie').length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {kyc.documents
                      .filter(doc => doc.document_type.startsWith('id_') || doc.document_type.startsWith('ghana_') || doc.document_type === 'selfie')
                      .map(doc => (
                        <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={doc.file_url}
                            alt={doc.document_type}
                            className="w-full h-32 object-cover cursor-pointer hover:opacity-80"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          />
                          <div className="p-2 bg-gray-50 dark:bg-gray-800">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {doc.document_type.replace(/_/g, ' ').toUpperCase()}
                            </p>
                            {doc.is_verified && (
                              <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No identity documents uploaded yet.</p>
                )}
              </div>

              {/* Review Notes */}
              {kyc.identity.identity_notes && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">
                    <strong>Notes:</strong> {kyc.identity.identity_notes}
                  </p>
                </div>
              )}
            </div>
          </DetailCard>

          {/* C. Contact & Location Section */}
          <DetailCard title="Contact & Location" icon={MapPin}>
            <DetailGrid columns={2}>
              <DetailRow
                label="Email"
                value={
                  <div className="flex items-center gap-2">
                    {kyc.contact.email}
                    {kyc.contact.email_verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                }
              />
              <DetailRow
                label="Phone"
                value={
                  <div className="flex items-center gap-2">
                    {kyc.contact.phone}
                    {kyc.contact.phone_verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                }
              />
              <DetailRow label="City" value={kyc.contact.city || '—'} />
              <DetailRow label="Region" value={kyc.contact.region || '—'} />
              <DetailRow label="Service Area" value={kyc.contact.service_area || '—'} />
              <DetailRow
                label="Check Result"
                value={<CheckResultBadge result={kyc.contact.contact_check_result} />}
              />
            </DetailGrid>

            {kyc.contact.contact_notes && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                <p className="text-sm text-yellow-900 dark:text-yellow-200">
                  <strong>Notes:</strong> {kyc.contact.contact_notes}
                </p>
              </div>
            )}
          </DetailCard>

          {/* D. Portfolio Verification Section */}
          <DetailCard title="Portfolio Verification" icon={Camera}>
            <div className="space-y-4">
              <DetailGrid columns={2}>
                <DetailRow
                  label="Categories"
                  value={kyc.portfolio.categories.map(c => c.replace(/_/g, ' ')).join(', ') || '—'}
                />
                <DetailRow
                  label="Experience"
                  value={kyc.portfolio.years_experience?.replace(/_/g, '-') + ' years' || '—'}
                />
                <DetailRow label="Portfolio Link" value={kyc.portfolio.portfolio_link || '—'} />
                <DetailRow
                  label="Check Result"
                  value={<CheckResultBadge result={kyc.portfolio.portfolio_check_result} />}
                />
                <DetailRow label="Quality" value={kyc.portfolio.portfolio_quality || '—'} />
                <DetailRow label="Originality" value={kyc.portfolio.originality_flag || '—'} />
              </DetailGrid>

              {/* Portfolio Images */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Portfolio Images
                </h4>
                {kyc.documents.filter(doc => doc.document_type.startsWith('portfolio_')).length > 0 ? (
                  <div className="grid grid-cols-4 gap-4">
                    {kyc.documents
                      .filter(doc => doc.document_type.startsWith('portfolio_'))
                      .map(doc => (
                        <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={doc.file_url}
                            alt="Portfolio"
                            className="w-full h-24 object-cover cursor-pointer hover:opacity-80"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No portfolio media uploaded yet.</p>
                )}
              </div>

              {kyc.portfolio.portfolio_notes && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">
                    <strong>Notes:</strong> {kyc.portfolio.portfolio_notes}
                  </p>
                </div>
              )}
            </div>
          </DetailCard>

          {/* E. Payment Verification Section */}
          <DetailCard title="Payment Verification" icon={CreditCard}>
            <div className="space-y-4">
              <DetailGrid columns={2}>
                <DetailRow label="Payout Method" value={kyc.payment.payout_method} />
                <DetailRow label="Account Holder" value={kyc.payment.account_holder_name} />

                {kyc.payment.payout_method === 'BANK' && (
                  <>
                    <DetailRow label="Bank Name" value={kyc.payment.bank_name || '—'} />
                    <DetailRow label="Account Number" value={kyc.payment.bank_account_number || '—'} />
                  </>
                )}

                {kyc.payment.payout_method === 'MOMO' && (
                  <>
                    <DetailRow label="Network" value={kyc.payment.momo_network || '—'} />
                    <DetailRow label="Mobile Number" value={kyc.payment.momo_number || '—'} />
                  </>
                )}

                <DetailRow label="Name Match" value={kyc.payment.payout_name_match ? kyc.payment.payout_name_match.replace(/_/g, ' ') : 'NOT CHECKED'} />
                <DetailRow
                  label="Check Result"
                  value={<CheckResultBadge result={kyc.payment.payout_check_result} />}
                />
              </DetailGrid>

              {kyc.payment.payout_notes && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">
                    <strong>Notes:</strong> {kyc.payment.payout_notes}
                  </p>
                </div>
              )}
            </div>
          </DetailCard>
        </div>

        {/* Right Column - Access Controls & Audit */}
        <div className="space-y-6">
          {/* F. Platform Access Controls */}
          <DetailCard title="Platform Access Controls" icon={Shield}>
            <div className="space-y-3">
              {[
                { key: 'is_search_visible', label: 'Search Visible', desc: 'Appears in search results' },
                { key: 'can_accept_bookings', label: 'Accept Bookings', desc: 'Can accept booking requests' },
                { key: 'can_receive_payouts', label: 'Receive Payouts', desc: 'Can receive payments' },
                { key: 'kyc_verified_badge', label: 'Verified Badge', desc: 'Shows verification badge' },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleAccessControl(key as keyof typeof kyc.access_controls)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {kyc.access_controls[key as keyof typeof kyc.access_controls] ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </DetailCard>

          {/* H. Audit Timeline */}
          <DetailCard title="Audit Timeline" icon={FileText}>
            <div className="space-y-3">
              {kyc.audit_timeline.map(event => (
                <div key={event.id} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {event.event_type.replace(/_/g, ' ')}
                  </p>
                  {event.field_name && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {event.field_name}: {event.old_value} → {event.new_value}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">{event.admin_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(event.created_at)}</p>
                  </div>
                  {event.action_notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                      "{event.action_notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </DetailCard>
        </div>
      </div>

      {/* Decision Modal */}
      <DecisionModal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        action={currentAction}
        onSubmit={handleDecision}
        isPending={isDecisionPending}
      />
    </div>
  );
}
