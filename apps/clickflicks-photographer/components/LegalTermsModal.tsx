import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/icons';

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'all' | 'terms' | 'privacy' | 'escrow' | 'tax';
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'all'
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'terms' | 'privacy' | 'escrow' | 'tax'>(initialTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-gray-950 border border-amber-500/30 rounded-3xl p-5 sm:p-7 text-gray-100 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Icons.FileText size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  Artisan Governance & Legal Compliance
                </span>
                <h2 className="text-base sm:text-lg font-black text-white">
                  Terms of Artistry, Privacy & Creator Charter
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <Icons.X size={20} />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-2 py-3 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'all', label: 'All Documents' },
              { id: 'terms', label: '1. Terms of Artistry' },
              { id: 'privacy', label: '2. Ghana DPC Privacy' },
              { id: 'escrow', label: '3. Escrow Settlement' },
              { id: 'tax', label: '4. GRA Tax & L.I. 2523' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-gray-950 shadow-md font-black'
                    : 'bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Body */}
          <div className="overflow-y-auto space-y-6 text-xs text-gray-300 pr-2 pt-4 leading-relaxed select-text">
            {/* Regulatory Preamble */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                <Icons.ShieldCheck size={14} />
                <span>Data Controller & Artisan Protection Notice</span>
              </div>
              <p className="text-[11px] text-gray-200">
                <strong>ClickFlicks Limited</strong> operates as a registered Data Controller under the <strong>Data Protection Commission (DPC) of Ghana (Act 843)</strong>. All terms agreements, consent records, and KYC validations are preserved in an audit-ready ledger for mutual security, consumer protection, and statutory compliance.
              </p>
            </div>

            {/* SECTION 1: TERMS OF ARTISTRY */}
            {(activeTab === 'all' || activeTab === 'terms') && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 text-xs">1</span>
                  <h3>Terms of Artistry & Creator Rights</h3>
                </div>

                <div className="space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/5 text-[11px]">
                  <p>
                    <strong className="text-white">1.1 Independent Creator Status:</strong> Photographers, videographers, and visual artisans maintain independent professional status. You maintain complete control over creative direction, cameras, lighting setups, and shoot methodologies.
                  </p>
                  <p>
                    <strong className="text-white">1.2 Punctuality & Professional Conduct:</strong> Creators agree to arrive at confirmed venues at least 15 minutes before the agreed session start time. Unexcused failure to show up violates platform trust and triggers full client refund and temporary profile suspension.
                  </p>
                  <p>
                    <strong className="text-white">1.3 Asset Authorship & Master Copyright:</strong> Photographers retain master copyright and moral rights of all raw files, granting clients a personal, non-commercial reproduction license unless an explicit commercial licensing buyout agreement is signed.
                  </p>
                </div>
              </section>
            )}

            {/* SECTION 2: GHANA DPC PRIVACY POLICY */}
            {(activeTab === 'all' || activeTab === 'privacy') && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 text-xs">2</span>
                  <h3>Ghana Data Protection Act (Act 843) Privacy Policy</h3>
                </div>

                <div className="space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/5 text-[11px]">
                  <p>
                    <strong className="text-white">2.1 Transparent Identity Processing:</strong> Your Ghana Card number, date of birth, and biometric selfie are processed exclusively to satisfy identity verification obligations under Ghana L.I. 2523. These credentials are encrypted and never monetized or sold to third-party ad brokers.
                  </p>
                  <p>
                    <strong className="text-white">2.2 Creator Rights Under Act 843:</strong> Creators have the right to request proof of stored personal records, request corrections of outdated settlement credentials, and export data history upon formal request to ClickFlicks Compliance.
                  </p>
                  <p>
                    <strong className="text-white">2.3 Audit Logs & Consent Integrity:</strong> When you accept these terms or submit KYC, your consent is timestamped with your device parameters and recorded permanently to protect your business against fraudulent chargebacks and impersonation.
                  </p>
                </div>
              </section>
            )}

            {/* SECTION 3: ESCROW SETTLEMENT & PAYOUTS */}
            {(activeTab === 'all' || activeTab === 'escrow') && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 text-xs">3</span>
                  <h3>Escrow Settlement & Payout Protection</h3>
                </div>

                <div className="space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/5 text-[11px]">
                  <p>
                    <strong className="text-white">3.1 Guaranteed Escrow Custody:</strong> When a client books your package or custom rate, funds are collected upfront by Paystack into escrow. You are guaranteed payout once digital assets or milestones are submitted into the client vault.
                  </p>
                  <p>
                    <strong className="text-white">3.2 Payout Disbursement Speed:</strong> Approved payouts are transferred directly to your registered MTN Mobile Money, Telecel Cash, AT Money, or Ghana Commercial Bank account within 24 to 48 hours following delivery approval.
                  </p>
                  <p>
                    <strong className="text-white">3.3 Dispute Protection:</strong> If an unreasonable client disputes a delivered gallery, ClickFlicks provides neutral human curation to inspect the deliverables against your package description.
                  </p>
                </div>
              </section>
            )}

            {/* SECTION 4: GRA TAX WITHHOLDING & L.I. 2523 */}
            {(activeTab === 'all' || activeTab === 'tax') && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 text-xs">4</span>
                  <h3>GRA Marketplace Tax Compliance (L.I. 2523)</h3>
                </div>

                <div className="space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/5 text-[11px]">
                  <p>
                    <strong className="text-white">4.1 Platform-Managed Tax Withholding:</strong> Under Ghana Revenue Authority (GRA) digital marketplace guidelines, ClickFlicks automates required withholding tax remittances. Artisans receive detailed statements to assist their annual tax filings without bureaucratic headaches.
                  </p>
                  <p>
                    <strong className="text-white">4.2 Transparent Split:</strong> You receive 85% net settlement on standard bookings, with platform fees and withholding deductions fully itemized on every booking receipt.
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-gray-400">
              Creator Agreement v2026.1 • ClickFlicks Artisan Council
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Close & Return
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LegalTermsModal;
