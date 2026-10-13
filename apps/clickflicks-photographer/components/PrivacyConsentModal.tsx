import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/icons';
import { LegalTermsModal } from './LegalTermsModal';
import { apiClient } from '../lib/api-client';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onConsent: () => void;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ isOpen, onConsent }) => {
  const [agreed, setAgreed] = useState(false);
  const [showLegalTerms, setShowLegalTerms] = useState(false);
  const [legalTab, setLegalTab] = useState<'all' | 'terms' | 'privacy' | 'escrow' | 'tax'>('all');
  const [isLogging, setIsLogging] = useState(false);

  if (!isOpen) return null;

  const handleContinue = async () => {
    if (!agreed) return;
    setIsLogging(true);
    const timestamp = new Date().toISOString();

    // 1. Persist locally first for instant user responsiveness
    try {
      localStorage.setItem('clickflicks_dpc_privacy_consented', 'true');
      localStorage.setItem('clickflicks_legal_consent_timestamp', timestamp);
      localStorage.setItem('clickflicks_legal_consent_version', 'v1.2.6');
    } catch (_) {}

    // 2. Transmit to backend legal compliance audit ledger
    try {
      const res = await apiClient.post('/auth/consent', {
        consentType: 'GHANA_DPC_ACT_843_PHOTOGRAPHER_TERMS_PRIVACY',
        termsVersion: 'v1.2.6',
        clientTimestamp: timestamp,
        platform: 'Photographer App'
      });
      if (res.data?.receipt) {
        localStorage.setItem('clickflicks_legal_consent_receipt', JSON.stringify(res.data.receipt));
      }
    } catch (err) {
      console.warn('Backend consent logging deferred:', err);
    } finally {
      setIsLogging(false);
      onConsent();
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-gray-950 border border-amber-500/30 rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 text-gray-100 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
          >
            {/* Subtle Glow Accent */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Icons.Shield size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                    Ghana Data Protection Act (Act 843)
                  </span>
                  <h2 className="text-lg font-black text-white">Your Privacy Matters at ClickFlicks 🛡️</h2>
                </div>
              </div>
              <img src="./icon.png" alt="ClickFlicks" className="w-9 h-9 object-contain opacity-80" />
            </div>

            {/* Body Content */}
            <div className="overflow-y-auto space-y-4 text-xs text-gray-300 pr-1 leading-relaxed">
              <p className="bg-white/5 border border-white/10 p-3 rounded-2xl text-[11px] text-gray-200">
                <strong className="text-amber-300">ClickFlicks Limited</strong> is registered as a lawful Data Controller with the <strong>Data Protection Commission (DPC) of Ghana</strong>. In compliance with the <strong>Data Protection Act, 2012 (Act 843)</strong>, we are committed to a transparent, fair, and highly secure environment for your personal information.
              </p>

              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-2">What We Collect & Why:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong className="text-white">Artisan Identity & KYC:</strong> Legal name, Ghana Card details, and biometric facial scan (L.I. 2523) to grant verified vendor status.</span>
                  </li>
                  <li className="flex items-start space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong className="text-white">Settlement Payout Route:</strong> Mobile Money or Bank details to disburse direct escrow settlements safely without delay.</span>
                  </li>
                  <li className="flex items-start space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong className="text-white">Transactional History:</strong> Booking logs and revenue ledgers to automate transparent GRA tax withholding reports.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-2xl">
                <h4 className="font-black text-emerald-400 text-xs mb-1 flex items-center gap-1.5">
                  <Icons.Lock size={14} /> Our Promise
                </h4>
                <p className="text-[11px] text-emerald-100/90">
                  We encrypt your data end-to-end, protect it using strict Supabase Row Level Security (RLS), and never sell your data to third-party advertising brokers.
                </p>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-4 border-t border-white/10 mt-4 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-2 border-amber-400/60 bg-black/40 text-amber-500 focus:ring-amber-500/40 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-gray-200 font-medium">
                  I have read and agree to the full{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLegalTab('terms');
                      setShowLegalTerms(true);
                    }}
                    className="text-amber-400 underline font-bold hover:text-amber-300 cursor-pointer"
                  >
                    Terms & Conditions
                  </button>{' '}
                  and the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLegalTab('privacy');
                      setShowLegalTerms(true);
                    }}
                    className="text-amber-400 underline font-bold hover:text-amber-300 cursor-pointer"
                  >
                    Privacy Policy
                  </button>.
                </span>
              </label>

              <button
                type="button"
                disabled={!agreed || isLogging}
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLogging ? (
                  <>
                    <Icons.Loader2 size={16} className="animate-spin" />
                    <span>Archiving Consent...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Account Registration</span>
                    <Icons.ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Full Terms Viewer Modal */}
      <LegalTermsModal
        isOpen={showLegalTerms}
        onClose={() => setShowLegalTerms(false)}
        initialTab={legalTab}
      />
    </>
  );
};

export default PrivacyConsentModal;
