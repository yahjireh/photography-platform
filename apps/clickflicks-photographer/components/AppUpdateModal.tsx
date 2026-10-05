import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/icons';

// Increment this version string whenever releasing updates to notify photographers once
export const CURRENT_PHOTOGRAPHER_APP_VERSION = '1.2.5';
const STORAGE_KEY = 'clickflicks_photographer_last_version';

interface ReleaseFeature {
  title: string;
  description: string;
  badge?: string;
}

const RELEASE_NOTES: { version: string; title: string; highlights: ReleaseFeature[] } = {
  version: CURRENT_PHOTOGRAPHER_APP_VERSION,
  title: "What's New in ClickFlicks Studio",
  highlights: [
    {
      title: "Direct Rate Controls",
      description: "Quickly set custom hourly and daily rates with instant numeric entry boxes and local backup persistence.",
      badge: "Rates"
    },
    {
      title: "Optimized Profile Photo Uploads",
      description: "Fast on-device image processing ensures quick and reliable profile picture updates.",
      badge: "Profile"
    },
    {
      title: "Interactive Face Liveness",
      description: "Complete your verification with the upgraded interactive 4-direction camera prompt for instant admin approval.",
      badge: "Verification"
    },
    {
      title: "Ghana Telecom MoMo Guard",
      description: "Automatic network prefix validation prevents failed payouts by verifying MTN, Telecel, and AT numbers accurately.",
      badge: "Payouts"
    }
  ]
};

export const AppUpdateModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [previousVersion, setPreviousVersion] = useState<string | null>(null);

  useEffect(() => {
    try {
      const lastVersion = localStorage.getItem(STORAGE_KEY);
      const isAlreadySeen = localStorage.getItem(`clickflicks_pro_modal_viewed_${CURRENT_PHOTOGRAPHER_APP_VERSION}`) === 'true' ||
                            localStorage.getItem(`clickflicks_pro_modal_dismissed_${CURRENT_PHOTOGRAPHER_APP_VERSION}`) === 'true';

      if (!lastVersion) {
        // Initial first install / launch: register current version without popping update modal
        localStorage.setItem(STORAGE_KEY, CURRENT_PHOTOGRAPHER_APP_VERSION);
        localStorage.setItem(`clickflicks_pro_modal_viewed_${CURRENT_PHOTOGRAPHER_APP_VERSION}`, 'true');
      } else if (lastVersion !== CURRENT_PHOTOGRAPHER_APP_VERSION && !isAlreadySeen) {
        // App was silently updated in the background - show once
        setPreviousVersion(lastVersion);
        setIsOpen(true);
        // Persist viewed state immediately so closing app or reopening doesn't re-trigger it
        localStorage.setItem(`clickflicks_pro_modal_viewed_${CURRENT_PHOTOGRAPHER_APP_VERSION}`, 'true');
        localStorage.setItem(STORAGE_KEY, CURRENT_PHOTOGRAPHER_APP_VERSION);
      }
    } catch {
      // LocalStorage restricted
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_PHOTOGRAPHER_APP_VERSION);
      localStorage.setItem(`clickflicks_pro_modal_dismissed_${CURRENT_PHOTOGRAPHER_APP_VERSION}`, 'true');
      localStorage.setItem(`clickflicks_pro_modal_viewed_${CURRENT_PHOTOGRAPHER_APP_VERSION}`, 'true');
    } catch {
      // Ignore
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden border border-gray-100 z-10"
          >
            {/* Header glow effect */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-0 -ml-12 -mt-12 w-40 h-40 bg-brand-DEFAULT/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-sm">
                  <Icons.Sparkles size={24} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {previousVersion ? `Updated v${previousVersion} → v${CURRENT_PHOTOGRAPHER_APP_VERSION}` : `Studio v${CURRENT_PHOTOGRAPHER_APP_VERSION} Live`}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-black text-gray-900 mt-1">
                    {RELEASE_NOTES.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <Icons.X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-5 leading-relaxed font-medium">
              {previousVersion ? (
                <>Your ClickFlicks Studio has been updated from <strong className="text-gray-900 font-bold">v{previousVersion}</strong> to <strong className="text-teal-700 font-bold">v{CURRENT_PHOTOGRAPHER_APP_VERSION}</strong>. Here is a summary of what's new:</>
              ) : (
                <>We've updated ClickFlicks Studio with high-impact features to streamline your onboarding, package offerings, and earnings:</>
              )}
            </p>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
              {RELEASE_NOTES.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100/80 hover:border-teal-100 transition-colors flex items-start space-x-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Icons.Check size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                      {item.badge && (
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3.5 px-6 rounded-2xl bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <span>Explore Studio</span>
              <Icons.ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
