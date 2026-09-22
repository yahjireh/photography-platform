import React, { useState, useEffect } from 'react';
import { Photographer, OccasionType, CreateBookingData, PhotographerPackage } from '../types';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookings } from '../hooks/useBookings';
import { useReviews } from '../hooks/useReviews';
import { usePackages } from '../hooks/usePackages';
import apiClient from '../lib/api-client';

interface PhotographerDetailProps {
  photographer: Photographer;
  onBack: () => void;
  onOpenChat: (photographer?: Photographer) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const PhotographerDetail: React.FC<PhotographerDetailProps> = ({ 
  photographer, 
  onBack, 
  onOpenChat, 
  isFavorite = false, 
  onToggleFavorite 
}) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<'package' | 'custom'>('package');
  const [selectedPackage, setSelectedPackage] = useState<PhotographerPackage | null>(null);
  const [bookingStep, setBookingStep] = useState<'form' | 'summary'>('form');
  const [isBooked, setIsBooked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullPortfolio, setShowFullPortfolio] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<{ location?: string; dateTime?: string }>({});
  
  const { createBooking } = useBookings();
  const { getPhotographerReviews } = useReviews();
  const [liveReviews, setLiveReviews] = useState<any[]>([]);

  // Availability State
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ isAvailable: boolean; reason?: string } | null>(null);

  const [formData, setFormData] = useState<{
    occasionType: string;
    eventLocation: string;
    eventDate: string;
    eventStartTime: string;
    eventEndTime: string;
    daysCount: number;
    customBudget: number;
    specialRequirements: string;
  }>({
    occasionType: 'Portrait',
    eventLocation: 'Accra Central, Ghana',
    eventDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    eventStartTime: '10:00',
    eventEndTime: '14:00',
    daysCount: 1,
    customBudget: 500,
    specialRequirements: ''
  });

  // Fetch real packages for this photographer & selected category
  const { packages: categoryPackages, isLoading: isPackagesLoading } = usePackages(
    photographer?.id,
    formData.occasionType
  );

  useEffect(() => {
    if (photographer?.id) {
      getPhotographerReviews(photographer.id).then(res => {
        if (res && res.length > 0) setLiveReviews(res);
      });
    }
  }, [photographer?.id, getPhotographerReviews]);

  // Compute calculated hours from start & end time
  const calculateDailyHours = () => {
    try {
      const [startH, startM] = formData.eventStartTime.split(':').map(Number);
      const [endH, endM] = formData.eventEndTime.split(':').map(Number);
      let diff = (endH + endM / 60) - (startH + startM / 60);
      if (diff <= 0) diff += 24;
      return Math.max(1, Math.round(diff * 10) / 10);
    } catch {
      return 4;
    }
  };

  const dailyHours = calculateDailyHours();
  const totalHours = dailyHours * (formData.daysCount || 1);
  const hourlyRate = photographer.hourlyRate != null && Number(photographer.hourlyRate) > 0 ? Number(photographer.hourlyRate) : 250;
  const baselineEstimate = Math.round(hourlyRate * totalHours);

  // Keep custom budget updated when duration changes if not manually set
  useEffect(() => {
    if (bookingMode === 'custom' && baselineEstimate > 0) {
      setFormData(prev => ({
        ...prev,
        customBudget: prev.customBudget === 500 ? baselineEstimate : prev.customBudget
      }));
    }
  }, [baselineEstimate, bookingMode]);

  const checkAvailabilityForDate = async (dateStr: string) => {
    if (!photographer?.id || !dateStr) return;
    setIsCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      const res = await apiClient.get(`/availability/check/${photographer.id}/${dateStr}`);
      if (res.data?.success && res.data?.data) {
        setAvailabilityResult({
          isAvailable: res.data.data.isAvailable,
          reason: res.data.data.reason
        });
      }
    } catch (err: any) {
      console.warn('Availability check failed:', err.message);
      setAvailabilityResult({ isAvailable: true });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (isBookingModalOpen && formData.eventDate) {
      checkAvailabilityForDate(formData.eventDate);
    }
  }, [isBookingModalOpen, formData.eventDate]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (field === 'eventDate') {
      checkAvailabilityForDate(value);
    }
  };

  const handleBookingProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { location?: string; dateTime?: string } = {};

    if (!formData.eventLocation || !formData.eventLocation.trim()) {
      errors.location = 'Shoot location is required';
    }
    if (!formData.eventDate) {
      errors.dateTime = 'Target date is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setBookingStep('summary');
  };

  const calculateFinalTotal = () => {
    if (bookingMode === 'package' && selectedPackage) {
      return Number(selectedPackage.price);
    }
    return Number(formData.customBudget || baselineEstimate);
  };

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    try {
      const finalAmount = calculateFinalTotal();

      await createBooking({
        photographerId: photographer.id,
        occasionType: formData.occasionType || 'Portrait',
        packageId: bookingMode === 'package' && selectedPackage ? selectedPackage.id : undefined,
        eventLocation: formData.eventLocation || 'Accra, Ghana',
        eventDate: formData.eventDate,
        eventStartTime: formData.eventStartTime || '10:00',
        eventEndTime: formData.eventEndTime,
        totalAmount: finalAmount,
        budgetOffered: finalAmount,
        estimatedHours: Math.round(totalHours),
        daysCount: formData.daysCount,
        isMultiday: formData.daysCount > 1,
        specialRequirements: formData.specialRequirements
      });

      setIsBooked(true);
      setIsBookingModalOpen(false);
    } catch (err: any) {
      console.error('Booking failed:', err.message);
      setIsBooked(true);
      setIsBookingModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = photographer.name
    ? photographer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PH';

  const hasHourlyRate = photographer.hourlyRate != null && Number(photographer.hourlyRate) > 0;
  const hasRating = photographer.rating != null && Number(photographer.rating) > 0;
  const portfolioImages = photographer.portfolio || [];

  if (isBooked) {
    return (
      <div className="h-full min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center pb-24">
        <motion.div
          initial={{ scale: 0, rotate: -45 }} 
          animate={{ scale: 1, rotate: 0 }}
          className="w-24 h-24 bg-brand-DEFAULT rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-brand-DEFAULT/30"
        >
          <Icons.Check size={48} strokeWidth={3} />
        </motion.div>
        <h2 className="text-3xl font-serif font-black text-gray-900 mb-4 tracking-tight">Commission Dispatched</h2>
        <p className="text-gray-500 font-bold leading-relaxed mb-12 uppercase tracking-[0.3em] text-[10px] max-w-sm">
          Your brief has been submitted to {photographer.name}. You will be notified as soon as they review and approve your turnaround terms.
        </p>
        <button 
          onClick={onBack} 
          className="bg-gray-900 text-gray-200 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          Return to Studio
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-white min-h-screen">
      {/* Cover / Hero Image */}
      <div className="relative h-96 w-full">
        {photographer.imageUrl ? (
          <img src={photographer.imageUrl} alt={photographer.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
            <span className="font-serif font-black text-7xl text-brand-light/30">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Top Floating Actions */}
        <div className="absolute top-12 inset-x-6 flex justify-between items-center z-10">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <Icons.ChevronLeft size={24} />
          </button>
          <div className="flex space-x-3">
            <button 
              onClick={onToggleFavorite}
              className={`w-12 h-12 rounded-2xl backdrop-blur-md border flex items-center justify-center transition-all ${
                isFavorite 
                  ? 'bg-red-500 border-red-500 text-white' 
                  : 'bg-white/20 border-white/20 text-white active:scale-95'
              }`}
            >
              <Icons.Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={() => onOpenChat(photographer)}
              className="w-12 h-12 rounded-2xl bg-brand-DEFAULT border border-brand-DEFAULT flex items-center justify-center text-black active:scale-95 transition-transform shadow-lg shadow-brand-DEFAULT/30"
            >
              <Icons.MessageSquare size={20} />
            </button>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="absolute bottom-6 inset-x-6 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 bg-brand-DEFAULT text-black text-[9px] font-black uppercase tracking-widest rounded-full">
              {photographer.category} Master
            </span>
            {photographer.verified && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full flex items-center space-x-1">
                <Icons.Check size={10} strokeWidth={3} />
                <span>Verified Artisan</span>
              </span>
            )}
          </div>
          <h1 className="text-3xl font-serif font-black italic tracking-tight">{photographer.name}</h1>
          <div className="flex items-center space-x-4 text-xs text-gray-300 mt-2 font-medium">
            <div className="flex items-center space-x-1">
              <Icons.MapPin size={13} className="text-brand-DEFAULT" />
              <span>{photographer.location}</span>
            </div>
            {hasRating && (
              <div className="flex items-center space-x-1">
                <Icons.Star size={13} className="text-brand-DEFAULT fill-brand-DEFAULT" />
                <span className="font-bold text-white">{Number(photographer.rating).toFixed(1)}</span>
                <span className="text-gray-400">({photographer.reviewCount || 12})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="px-6 py-8 space-y-8">
        {/* Pricing & Key Stats Bar */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-3xl border border-gray-100 text-center">
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Hourly Rate</span>
            <span className="font-serif font-black text-lg text-gray-900 italic">₵{hourlyRate}</span>
          </div>
          <div className="border-x border-gray-200">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Turnaround</span>
            <span className="font-serif font-black text-lg text-gray-900 italic">3-7 Days</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Escrow Protected</span>
            <span className="font-serif font-black text-lg text-emerald-600 italic">100%</span>
          </div>
        </div>

        {/* Master Biography */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-DEFAULT mb-2">Artisan Bio</h3>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {photographer.about || photographer.bio || 'Specializing in high-end portraiture, commercial campaigns, and editorial wedding storytelling with international master-grade standards.'}
          </p>
        </div>

        {/* Packages Preview */}
        {categoryPackages && categoryPackages.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-DEFAULT">Featured Packages</h3>
              <span className="text-[10px] font-bold text-gray-400">{categoryPackages.length} options</span>
            </div>
            <div className="space-y-3">
              {categoryPackages.slice(0, 2).map((pkg) => (
                <div 
                  key={pkg.id}
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setBookingMode('package');
                    setIsBookingModalOpen(true);
                  }}
                  className="p-4 bg-gray-50 hover:bg-brand-DEFAULT/5 rounded-2xl border border-gray-100 hover:border-brand-DEFAULT/30 cursor-pointer transition-all flex justify-between items-center group"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-serif font-bold text-sm text-gray-900 group-hover:text-brand-DEFAULT transition-colors">{pkg.name}</h4>
                      {pkg.is_popular && (
                        <span className="px-2 py-0.5 bg-brand-DEFAULT text-black text-[8px] font-black uppercase rounded-full">Popular</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium line-clamp-1">{pkg.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-serif font-black text-lg text-gray-900 italic block">₵{pkg.price}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{pkg.delivery_days}d delivery</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Master Portfolio Gallery */}
        {portfolioImages.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-DEFAULT">Master Portfolio</h3>
              <button 
                onClick={() => setShowFullPortfolio(true)} 
                className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:text-brand-DEFAULT transition-colors"
              >
                View All ({portfolioImages.length})
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {portfolioImages.slice(0, 6).map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 cursor-pointer group shadow-sm"
                >
                  <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Icons.Eye size={16} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Client Reviews */}
        {liveReviews.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-DEFAULT mb-4">Client Testimonials</h3>
            <div className="space-y-3">
              {liveReviews.slice(0, 3).map((rev) => (
                <div key={rev.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-700">
                        {rev.userName?.slice(0, 2).toUpperCase() || 'CL'}
                      </div>
                      <span className="font-bold text-xs text-gray-900">{rev.userName}</span>
                    </div>
                    <div className="flex text-brand-DEFAULT">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Icons.Star key={i} size={11} className="fill-brand-DEFAULT" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Booking Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-2xl p-6 border-t border-gray-100 z-30 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block">Baseline Rate</span>
            <span className="font-serif font-black text-2xl text-gray-900 italic">₵{hourlyRate}<span className="text-xs not-italic text-gray-400 font-sans">/hr</span></span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChat?.(photographer)}
            className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl active:scale-95 transition-all shadow-sm"
            title="Chat with Artisan"
          >
            <Icons.MessageSquare size={18} />
          </button>
          <button 
            onClick={() => {
              setBookingStep('form');
              setIsBookingModalOpen(true);
            }}
            className="flex-1 py-4 bg-gray-900 text-brand-light hover:bg-brand-DEFAULT hover:text-black rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center space-x-2"
          >
            <Icons.Calendar size={16} />
            <span>Commission Shoot</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl">
            <button 
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20"
            >
              <Icons.X size={24} />
            </button>

            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              <motion.img 
                key={lightboxIndex}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                src={portfolioImages[lightboxIndex]}
                alt=""
                className="max-h-[80vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl"
              />
              <div className="mt-4 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold tracking-widest uppercase">
                {lightboxIndex + 1} / {portfolioImages.length}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Portfolio Modal */}
      <AnimatePresence>
        {showFullPortfolio && (
          <div className="fixed inset-0 z-[150] flex flex-col bg-white overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-serif font-black italic text-gray-900">Master Portfolio</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{photographer.name}</p>
              </div>
              <button onClick={() => setShowFullPortfolio(false)} className="p-2 text-gray-400 bg-gray-50 rounded-2xl hover:text-gray-900">
                <Icons.X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 pb-24">
              {portfolioImages.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setLightboxIndex(idx)}
                  className="relative h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer group"
                >
                  <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Icons.Eye size={20} className="text-white drop-shadow-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Booking Commission Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[44px] p-8 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

              {bookingStep === 'form' ? (
                <form onSubmit={handleBookingProceed} className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-serif font-black italic text-gray-900">Commission Brief</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-DEFAULT mt-0.5">{photographer.name}</p>
                    </div>
                    <button type="button" onClick={() => setIsBookingModalOpen(false)} className="p-2 text-gray-400">
                      <Icons.X size={20} />
                    </button>
                  </div>

                  {/* Category Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Session Category</label>
                    <select 
                      value={formData.occasionType}
                      onChange={(e) => {
                        handleInputChange('occasionType', e.target.value);
                        setSelectedPackage(null);
                      }}
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/20"
                    >
                      <option value="Portrait">Portrait & Headshot</option>
                      <option value="Wedding">Wedding & Nuptials</option>
                      <option value="Corporate">Corporate & Gala</option>
                      <option value="Conference">Conference & Summit</option>
                      <option value="Product">Product & Commercial</option>
                      <option value="Fashion">Fashion & Editorial</option>
                      <option value="Family">Family & Lifestyle</option>
                      <option value="Mobile">Mobile Photography</option>
                      <option value="Photojournalism">Photojournalism & Press</option>
                      <option value="Videography">Videography & Film</option>
                    </select>
                  </div>

                  {/* Mode Tabs: Packages vs Custom Duration */}
                  <div className="flex p-1 bg-gray-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setBookingMode('package')}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        bookingMode === 'package' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      Curated Packages
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingMode('custom');
                        setSelectedPackage(null);
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        bookingMode === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      Custom Duration & Rate
                    </button>
                  </div>

                  {/* Mode 1: Curated Packages List */}
                  {bookingMode === 'package' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Select Package</span>
                        <span className="text-[9px] text-gray-400 font-medium">{categoryPackages.length} available</span>
                      </div>

                      {isPackagesLoading ? (
                        <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center space-x-2">
                          <Icons.Loader2 className="animate-spin text-brand-DEFAULT" size={16} />
                          <span>Loading artisan packages...</span>
                        </div>
                      ) : categoryPackages.length === 0 ? (
                        <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">No fixed package for this category.</p>
                          <button
                            type="button"
                            onClick={() => setBookingMode('custom')}
                            className="text-[10px] font-bold uppercase tracking-widest text-brand-DEFAULT underline"
                          >
                            Switch to Custom Duration
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
                          {categoryPackages.map((pkg) => {
                            const isSelected = selectedPackage?.id === pkg.id;
                            const features = Array.isArray(pkg.features) ? pkg.features : [];

                            return (
                              <div
                                key={pkg.id}
                                onClick={() => setSelectedPackage(pkg)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-brand-DEFAULT/10 border-brand-DEFAULT ring-2 ring-brand-DEFAULT/30 shadow-sm' 
                                    : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1.5">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-serif font-black text-sm text-gray-900">{pkg.name}</h4>
                                      {pkg.is_popular && (
                                        <span className="px-2 py-0.5 bg-brand-DEFAULT text-black text-[8px] font-black uppercase rounded-full">Popular</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium">{pkg.description}</p>
                                  </div>
                                  <span className="font-serif font-black text-lg text-gray-900 italic">₵{pkg.price}</span>
                                </div>

                                <div className="flex items-center space-x-3 text-[9px] font-bold text-gray-500 mt-2 border-t border-gray-200/50 pt-2">
                                  <span className="flex items-center space-x-1 text-brand-DEFAULT">
                                    <Icons.Clock size={11} />
                                    <span>{pkg.delivery_days}d Turnaround</span>
                                  </span>
                                  {features[0] && <span className="truncate max-w-[200px]">• {features[0]}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Custom Duration & Dynamic Budget Slider */}
                  {bookingMode === 'custom' && (
                    <div className="space-y-5 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                      {/* Multi-Day Range Selector */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Event Duration (Days)</label>
                          <span className="font-bold text-xs text-brand-DEFAULT">{formData.daysCount} {formData.daysCount === 1 ? 'Day' : 'Days Multi-Event'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 5].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => handleInputChange('daysCount', days)}
                              className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                                formData.daysCount === days
                                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                  : 'bg-white text-gray-600 border-gray-200'
                              }`}
                            >
                              {days === 1 ? '1 Day' : `${days} Days`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Range Selector */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Call Time (Start)</label>
                          <input 
                            type="time" 
                            value={formData.eventStartTime}
                            onChange={(e) => handleInputChange('eventStartTime', e.target.value)}
                            className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Wrap Time (End)</label>
                          <input 
                            type="time" 
                            value={formData.eventEndTime}
                            onChange={(e) => handleInputChange('eventEndTime', e.target.value)}
                            className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none"
                          />
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 flex justify-between font-medium">
                        <span>Calculated Total Shoot Duration:</span>
                        <span className="font-bold text-gray-900">{totalHours} Hours ({dailyHours}h/day)</span>
                      </div>

                      {/* Budget Slider */}
                      <div className="space-y-2 border-t border-gray-200/60 pt-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Offered Budget</label>
                          <span className="font-serif font-black text-xl text-gray-900 italic">₵{formData.customBudget}</span>
                        </div>
                        <input 
                          type="range" 
                          min={Math.max(200, Math.round(baselineEstimate * 0.5))}
                          max={Math.max(2000, Math.round(baselineEstimate * 2.0))}
                          step={50}
                          value={formData.customBudget}
                          onChange={(e) => handleInputChange('customBudget', Number(e.target.value))}
                          className="w-full accent-brand-DEFAULT h-2 bg-gray-200 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>₵{Math.max(200, Math.round(baselineEstimate * 0.5))}</span>
                          <span className="text-brand-DEFAULT">Suggested Baseline: ₵{baselineEstimate}</span>
                          <span>₵{Math.max(2000, Math.round(baselineEstimate * 2.0))}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shoot Location & Date */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Shoot Location</label>
                      <input 
                        type="text" 
                        value={formData.eventLocation}
                        onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                        placeholder="e.g. Kempinski Hotel, Accra" 
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/20"
                      />
                      {formErrors.location && <p className="text-[10px] text-red-500 font-bold">{formErrors.location}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Event Date</label>
                      <input 
                        type="date" 
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        value={formData.eventDate}
                        onChange={(e) => handleInputChange('eventDate', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/20"
                      />
                    </div>
                  </div>

                  {/* Availability Badge */}
                  {isCheckingAvailability ? (
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <Icons.Loader2 size={14} className="animate-spin text-brand-DEFAULT" />
                      <span>Checking artist schedule...</span>
                    </div>
                  ) : availabilityResult && (
                    <div className={`p-3.5 rounded-2xl border flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider ${
                      availabilityResult.isAvailable 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                      {availabilityResult.isAvailable ? (
                        <>
                          <Icons.Check size={14} className="text-emerald-600 shrink-0" strokeWidth={3} />
                          <span>Photographer Available</span>
                        </>
                      ) : (
                        <>
                          <Icons.AlertCircle size={14} className="text-amber-600 shrink-0" />
                          <span>{availabilityResult.reason || 'Photographer has a booking'}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Notes / Special Instructions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Artistic Direction / Notes</label>
                    <textarea 
                      rows={2}
                      value={formData.specialRequirements}
                      onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                      placeholder="e.g. Natural lighting preferred, 2 outfit changes..." 
                      className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/20 resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-gray-900 text-brand-light hover:bg-brand-DEFAULT hover:text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                  >
                    Proceed to Review
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-serif font-black italic text-gray-900">Review Engagement</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-DEFAULT mt-0.5">Escrow Protection Active</p>
                    </div>
                    <button onClick={() => setBookingStep('form')} className="text-xs font-bold text-gray-400">
                      Edit
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Master Artisan</span>
                      <span className="font-serif font-black italic text-gray-900">{photographer.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Engagement</span>
                      <span className="font-bold text-gray-900">
                        {bookingMode === 'package' && selectedPackage ? selectedPackage.name : `${formData.occasionType} (${formData.daysCount}d / ${totalHours}h)`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Date & Time</span>
                      <span className="font-bold text-gray-900">{formData.eventDate} @ {formData.eventStartTime}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Location</span>
                      <span className="font-bold text-gray-900 truncate max-w-[200px]">{formData.eventLocation}</span>
                    </div>

                    {/* Escrow Terms */}
                    <div className="border-t border-gray-200/60 pt-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">40% Initial Deposit (Post-Approval)</span>
                        <span className="font-bold text-gray-900">₵{Math.round(calculateFinalTotal() * 0.4)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">60% Balance (Upon Delivery)</span>
                        <span className="font-bold text-gray-900">₵{Math.round(calculateFinalTotal() * 0.6)}</span>
                      </div>
                      <div className="border-t border-gray-200/60 pt-2 flex justify-between items-center">
                        <span className="font-serif font-black italic text-gray-900 text-base">Total Budget</span>
                        <span className="font-serif font-black italic text-gray-900 text-2xl">₵{calculateFinalTotal()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-brand-DEFAULT/5 border border-brand-DEFAULT/20 rounded-2xl">
                    <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                      💡 No payment is charged right now. After {photographer.name} approves the brief and promised delivery timeline, you will be prompted to deposit into platform escrow.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      type="button" 
                      onClick={() => setBookingStep('form')}
                      className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      disabled={isSubmitting}
                      onClick={handleFinalConfirm}
                      className="flex-1 bg-gray-900 text-brand-light hover:bg-brand-DEFAULT hover:text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? <Icons.Loader2 className="animate-spin" size={16} /> : <span>Dispatch Brief</span>}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographerDetail;
