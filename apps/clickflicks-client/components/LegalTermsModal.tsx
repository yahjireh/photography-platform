import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/icons';

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'all' | 'terms' | 'privacy' | 'escrow';
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'all'
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'terms' | 'privacy' | 'escrow'>(initialTab);

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
                  Legal Compliance & Governance
                </span>
                <h2 className="text-base sm:text-lg font-black text-white">
                  Terms, Privacy & Escrow Charter
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
              { id: 'terms', label: '1. Terms of Service' },
              { id: 'privacy', label: '2. Ghana DPC Privacy' },
              { id: 'escrow', label: '3. Escrow & Refunds' }
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
                <span>Data Controller Registration Notice</span>
              </div>
              <p className="text-[11px] text-gray-200">
                <strong>ClickFlicks Limited</strong> operates as a registered Data Controller under the <strong>Data Protection Commission (DPC) of Ghana</strong>, in strict accordance with the <strong>Data Protection Act, 2012 (Act 843)</strong>. All user consents, agreements, and interactions are cryptographically recorded and audited for legal enforceability, consumer safety, and platform security.
              </p>
            </div>

            {/* SECTION 1: TERMS OF SERVICE */}
            {(activeTab === 'all' || activeTab === 'terms') && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 text-xs">1</span>
                  <h3>Marketplace Terms of Service</h3>
                </div>

                <div className="space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/5 text-[11px]">
                  <p>
                    <strong className="text-white">1.1 Eligibility & Account Integrity:</strong> By creating an account, clients and creators confirm they are at least 18 years of age or legally permitted to contract under the laws of Ghana. Users agree to maintain truthful profile credentials.
                  </p>
                  <p>
                    <strong className="text-white">1.2 Bookings & Platform Mediation:</strong> All shoot scheduling, location agreements, and creative assignments arranged through ClickFlicks must adhere to our standardized messaging and billing channels to remain protected under ClickFlicks Escrow Guarantees.
                  </p>
                  <p>
                    <strong className="text-white">1.3 Artisan Independence:</strong> Photographers, videographers, and creators on ClickFlicks are independent artisans and contractors. While ClickFlicks performs identity validation (Ghana Card & KYC), creators control their creative process, equipment, and artistic vision.
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
                    <strong className="text-white">2.1 Lawful Basis & Consent Logging:</strong> Your consent is actively requested and recorded alongside device metadata, timestamp, IP address, and platform version. This creates an immutable legal receipt that satisfies Section 20 of Act 843.
                  </p>
                  <p>
                    <strong className="text-white">2.2 Categories of Personal Data Collected:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li><strong>Account Credentials:</strong> Full name, telephone number, verified email address, hashed passwords.</li>
                    <li><strong>Location Data:</strong> Approximate and precise geolocation (only when permitted) to match nearby clients and local creators.</li>
                    <li><strong>Financial Logs:</strong> Transaction identifiers and Mobile Money/Card token hashes processed securely via Paystack. ClickFlicks never stores raw card CVVs or MoMo PINs.</li>
                    <li><strong>Photographer Verification (KYC):</strong> Ghana Card pin, date of birth, front/back photos, and biometric liveness verification as required by L.I. 2523.</li>
                  </ul>
                  <p>
                    <strong className="text-white">2.3 Your Statutory Rights:</strong> Under Act 843, you have the right to request access to your stored personal data, request rectification of inaccurate records, or demand the deletion (right to erasure) of your personal account data at any time via the profile menu.
                  </p>
                </div>
              </section>
            )}

            {/* SECTION 3: ESCROW, PAYMENTS & REFUNDS */}
            {(activeTab === 'all' || activeTab === 'escrow') && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 text-xs">3</span>
                  <h3>Escrow Protection, Cancellations & Refunds</h3>
                </div>

                <div className="space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/5 text-[11px]">
                  <p>
                    <strong className="text-white">3.1 Escrow Security:</strong> Client booking deposits are held in a segregated Paystack escrow custody pool. Payouts are not disbursed until the shoot is completed and preview or full assets are delivered into the ClickFlicks client vault.
                  </p>
                  <p>
                    <strong className="text-white">3.2 Client Cancellation Terms:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li><strong>48+ Hours Before Shoot:</strong> 100% deposit refund to original payment source (less standard telecom processing fees).</li>
                    <li><strong>24 to 48 Hours Before Shoot:</strong> 70% deposit refund; 30% released to creator for reserved schedule hold.</li>
                    <li><strong>Under 24 Hours:</strong> 50% deposit retained to cover artisan travel prep and blocked calendar bookings.</li>
                  </ul>
                  <p>
                    <strong className="text-white">3.3 Inclement Weather & Emergencies:</strong> Outdoor sessions disrupted by tropical rainfall or verifiable force majeure events may be rescheduled within 30 calendar days at no penalty upon mutual client-creator agreement.
                  </p>
                  <p>
                    <strong className="text-white">3.4 Creator No-Show Guarantee:</strong> If a creator fails to attend a confirmed shoot, the client receives a 100% full refund immediately, and ClickFlicks provides priority re-booking support.
                  </p>
                </div>
              </section>
            )}

            {/* SECTION 4: COPYRIGHT & MODEL LIKENESS */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 text-xs">4</span>
                <h3>Copyright & Likeness Consent</h3>
              </div>

              <div className="space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/5 text-[11px]">
                <p>
                  <strong className="text-white">4.1 Master Authorship:</strong> Creators retain the original moral and master authorship of their captures unless an explicit full-commercial copyright buyout contract is executed.
                </p>
                <p>
                  <strong className="text-white">4.2 Client Usage License:</strong> Upon settlement, clients receive a perpetual, royalty-free, worldwide license for personal, private, and non-commercial portfolio use.
                </p>
                <p>
                  <strong className="text-white">4.3 Portfolio Display:</strong> Creators may showcase non-confidential imagery in their verified ClickFlicks portfolio unless the client explicitly opts out for private/corporate privacy reasons.
                </p>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-gray-400">
              Version 2026.1.0 • ClickFlicks Legal Operations
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
