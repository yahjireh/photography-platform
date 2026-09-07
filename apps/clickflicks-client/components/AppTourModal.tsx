import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/icons';

export interface TourStep {
  id: string;
  tab?: string;
  badge: string;
  title: string;
  description: string;
  tips?: string[];
  icon: any;
  color: string;
}

interface AppTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange?: (tab: string) => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    tab: 'home',
    badge: 'Welcome to ClickFlicks',
    title: 'Ghana’s Premier Photography Hub',
    description: 'Welcome to your creative sanctuary. ClickFlicks connects you with top-tier, verified Ghanaian photographers for weddings, portraits, fashion, and events.',
    tips: [
      'Browse curated visual artists',
      'Escrow-protected payments',
      'Instant direct messaging'
    ],
    icon: Icons.Sparkles,
    color: 'from-brand-light via-brand-DEFAULT to-amber-500'
  },
  {
    id: 'home',
    tab: 'home',
    badge: 'Home Navigation',
    title: 'Discover Curated Masters',
    description: 'Explore hand-picked photographers, featured portfolios, verified ratings, and transparent package pricing across Ghana.',
    tips: [
      'View verified client reviews',
      'Compare standard & day rates',
      'Bookmark favorites to your collection'
    ],
    icon: Icons.Home,
    color: 'from-teal-400 to-emerald-500'
  },
  {
    id: 'explore',
    tab: 'explore',
    badge: 'Explore & Search',
    title: 'Find Your Exact Aesthetic',
    description: 'Filter photographers by category (Wedding, Portrait, Fashion, Events, Real Estate) or city (Accra, Kumasi, Takoradi). Search by name or style.',
    tips: [
      'One-tap category filters',
      'City and availability search',
      'High-resolution portfolio galleries'
    ],
    icon: Icons.Search,
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: 'messages',
    tab: 'messages',
    badge: 'Real-Time Comms',
    title: 'Direct Creator Chat',
    description: 'Message photographers directly in real-time. Share your creative vision, agree on locations, and clarify session timings before and after booking.',
    tips: [
      'Direct 1-on-1 instant messaging',
      'Share shoot briefs & event notes',
      'Push notification alerts for replies'
    ],
    icon: Icons.MessageSquare,
    color: 'from-purple-400 to-pink-500'
  },
  {
    id: 'bookings',
    tab: 'bookings',
    badge: 'Booking & Security',
    title: 'Guaranteed Escrow Protection',
    description: 'Your payment is held safely in escrow. Only after your photoshoot is completed and you provide your 4-digit SMS PIN are funds released to the photographer.',
    tips: [
      'Pay with Mobile Money (MTN, Telecel, AT) or Card',
      'Track session milestones & deadlines',
      'SMS PIN release on completed delivery'
    ],
    icon: Icons.ShieldCheck,
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 'profile',
    tab: 'profile',
    badge: 'The Vault',
    title: 'Your Creative Headquarters',
    description: 'Access your profile persona, download high-res photos and deliverables from Cloudflare R2, manage saved masters, and reach 24/7 client support.',
    tips: [
      'Instant download links for finished photos',
      'Manage profile and contact information',
      'Replay this app tour anytime under System Config'
    ],
    icon: Icons.User,
    color: 'from-brand-light to-brand-dark'
  }
];

export const AppTourModal: React.FC<AppTourModalProps> = ({
  isOpen,
  onClose,
  onTabChange
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    if (TOUR_STEPS[nextIdx].tab && onTabChange) {
      onTabChange(TOUR_STEPS[nextIdx].tab!);
    }
  };

  const handlePrev = () => {
    if (isFirst) return;
    const prevIdx = currentStepIndex - 1;
    setCurrentStepIndex(prevIdx);
    if (TOUR_STEPS[prevIdx].tab && onTabChange) {
      onTabChange(TOUR_STEPS[prevIdx].tab!);
    }
  };

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-md">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -20 }}
          transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
          className="relative w-full max-w-sm bg-gray-950/95 border border-white/15 rounded-[32px] p-6 shadow-2xl text-white overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-brand-DEFAULT/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-brand-light/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Badge + Skip */}
          <div className="relative z-10 flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 bg-white/10 border border-white/10 rounded-full text-brand-light">
              {currentStep.badge}
            </span>
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider px-2 py-1"
            >
              Skip
            </button>
          </div>

          {/* Icon Badge */}
          <div className="relative z-10 my-4 flex justify-center">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentStep.color} p-[2px] shadow-xl shadow-black/40`}>
              <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center text-white">
                <StepIcon size={28} strokeWidth={2.2} />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="relative z-10 text-center mb-5">
            <h2 className="text-xl font-serif font-black italic text-gray-100 tracking-tight leading-tight mb-2">
              {currentStep.title}
            </h2>
            <p className="text-xs text-gray-300 font-medium leading-relaxed px-1">
              {currentStep.description}
            </p>
          </div>

          {/* Feature Highlights */}
          {currentStep.tips && (
            <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-6 space-y-2">
              {currentStep.tips.map((tip, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 text-left">
                  <div className="w-4 h-4 rounded-full bg-brand-DEFAULT/20 text-brand-light flex items-center justify-center shrink-0">
                    <Icons.Check size={11} strokeWidth={3} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-200">{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Dots Indicator */}
          <div className="relative z-10 flex justify-center items-center space-x-1.5 mb-5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'w-6 bg-brand-DEFAULT shadow-sm shadow-brand-DEFAULT/50'
                    : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="relative z-10 flex items-center space-x-3">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 py-3.5 bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider text-gray-200 transition-all flex items-center justify-center space-x-1.5"
              >
                <Icons.ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className={`flex-1 py-3.5 bg-gradient-to-r from-brand-dark via-brand-DEFAULT to-brand-light text-gray-900 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-brand-DEFAULT/30 active:scale-95 transition-all flex items-center justify-center space-x-2 ${
                isFirst ? 'w-full' : ''
              }`}
            >
              <span>{isLast ? 'Start Exploring' : 'Next Step'}</span>
              <Icons.ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AppTourModal;
