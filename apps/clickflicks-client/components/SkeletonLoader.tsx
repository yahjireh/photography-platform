import React from 'react';
import { motion } from 'framer-motion';

export const ShimmerEffect: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-gray-200/70 ${className}`}>
    <motion.div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
      animate={{ translateX: ['-100%', '200%'] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
    />
  </div>
);

export const PhotographerCardSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 ${compact ? 'min-w-[200px] w-[200px]' : 'w-full mb-6'}`}>
      <div className={`relative ${compact ? 'h-48' : 'h-64'} overflow-hidden`}>
        <ShimmerEffect className="w-full h-full" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <ShimmerEffect className="h-5 w-32 rounded-lg" />
          <ShimmerEffect className="h-4 w-12 rounded-lg" />
        </div>
        <ShimmerEffect className="h-3 w-24 rounded-md" />
        {!compact && (
          <div className="space-y-1.5 pt-1">
            <ShimmerEffect className="h-3 w-full rounded-md" />
            <ShimmerEffect className="h-3 w-3/4 rounded-md" />
          </div>
        )}
        <div className="flex justify-between items-center pt-2">
          <ShimmerEffect className="h-6 w-16 rounded-lg" />
          <ShimmerEffect className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const BookingCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-[32px] overflow-hidden shadow-md shadow-black/5 border border-gray-100 p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <ShimmerEffect className="w-14 h-14 rounded-2xl" />
          <div className="space-y-2">
            <ShimmerEffect className="h-5 w-36 rounded-lg" />
            <ShimmerEffect className="h-3 w-20 rounded-md" />
          </div>
        </div>
        <ShimmerEffect className="h-6 w-20 rounded-xl" />
      </div>

      <div className="bg-gray-50/80 rounded-2xl p-4 flex justify-between items-center">
        <div className="space-y-2">
          <ShimmerEffect className="h-3.5 w-28 rounded-md" />
          <ShimmerEffect className="h-3.5 w-36 rounded-md" />
        </div>
        <ShimmerEffect className="h-6 w-16 rounded-lg" />
      </div>

      <div className="flex space-x-3">
        <ShimmerEffect className="flex-1 h-12 rounded-2xl" />
        <ShimmerEffect className="flex-1 h-12 rounded-2xl" />
      </div>
    </div>
  );
};

export const ConversationSkeleton: React.FC = () => {
  return (
    <div className="flex items-center p-6 space-x-4 border-b border-gray-50">
      <ShimmerEffect className="w-14 h-14 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center">
          <ShimmerEffect className="h-4 w-32 rounded-lg" />
          <ShimmerEffect className="h-3 w-12 rounded-md" />
        </div>
        <ShimmerEffect className="h-3 w-48 rounded-md" />
      </div>
    </div>
  );
};

export const AperturePulseLoader: React.FC<{ label?: string }> = ({ label = 'Connecting with visual artists...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative w-16 h-16 mb-4">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-brand-DEFAULT/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-brand-DEFAULT border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-brand-DEFAULT rounded-full" />
        </div>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500 animate-pulse">{label}</p>
    </div>
  );
};

export default {
  ShimmerEffect,
  PhotographerCardSkeleton,
  BookingCardSkeleton,
  ConversationSkeleton,
  AperturePulseLoader
};
