import React, { useState, useEffect } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, OccasionType } from '../types';
import { useBookings } from '../hooks/useBookings';
import { useReviews } from '../hooks/useReviews';
import { BookingCardSkeleton } from '../components/SkeletonLoader';

type BookingTab = 'upcoming' | 'history';
type BookingPopupType = 'invoice' | 'cancel-warning' | null;

interface BookingsProps {
  onTabChange?: (tab: string) => void;
  onOpenChat?: (photographerId: string, bookingId?: string) => void;
}

const Bookings: React.FC<BookingsProps> = ({ onTabChange, onOpenChat }) => {
  const { 
    bookings, 
    updateBookingDetails,
    checkWorkAccess,
    payDeposit, 
    confirmArrival, 
    payBalance, 
    createDispute, 
    cancelBooking, 
    isLoading 
  } = useBookings();

  const { submitReview } = useReviews();
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [managingBooking, setManagingBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [activePopup, setActivePopup] = useState<BookingPopupType>(null);

  // Escrow Lifecycle States
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<'deposit' | 'full'>('deposit');
  const [paymentChannel, setPaymentChannel] = useState<'momo' | 'card' | 'wallet'>('momo');
  const [momoNetwork, setMomoNetwork] = useState<'MTN' | 'Telecel' | 'AirtelTigo'>('MTN');
  const [momoNumber, setMomoNumber] = useState('0244123456');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Arrival Confirmation
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Balance Payment
  const [payingBalanceBooking, setPayingBalanceBooking] = useState<Booking | null>(null);
  const [isProcessingBalance, setIsProcessingBalance] = useState(false);

  // Work Access & Deliverables View Modal
  const [viewingWorkBooking, setViewingWorkBooking] = useState<Booking | null>(null);
  const [workLockedBooking, setWorkLockedBooking] = useState<Booking | null>(null);

  // Full Booking Edit Modal
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState<{
    occasionType: string;
    eventLocation: string;
    eventDate: string;
    eventStartTime: string;
    eventEndTime: string;
    daysCount: number;
    totalAmount: number;
    specialRequirements: string;
  }>({
    occasionType: 'Portrait',
    eventLocation: '',
    eventDate: '',
    eventStartTime: '10:00',
    eventEndTime: '14:00',
    daysCount: 1,
    totalAmount: 500,
    specialRequirements: ''
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Dispute Modal
  const [disputingBooking, setDisputingBooking] = useState<Booking | null>(null);
  const [disputeReason, setDisputeReason] = useState('Quality / Unmet Requirements');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Reviews & Cancelling
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const upcomingBookings = bookings.filter(b => {
    const s = String(b.status).toUpperCase();
    return s === 'CONFIRMED' || s === 'ACCEPTED' || s === 'APPROVED' || s === 'PENDING' || s === 'IN_PROGRESS' || s === 'DISPUTED';
  });

  const historyBookings = bookings.filter(b => {
    const s = String(b.status).toUpperCase();
    return s === 'COMPLETED' || s === 'CANCELLED' || s === 'REJECTED' || s === 'DECLINED';
  });

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : historyBookings;

  // Open Edit Modal with current values
  const handleOpenEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditFormData({
      occasionType: booking.category || booking.service || 'Portrait',
      eventLocation: booking.location || 'Accra, Ghana',
      eventDate: booking.rawDate || booking.date || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      eventStartTime: booking.time || '10:00',
      eventEndTime: '14:00',
      daysCount: booking.daysCount || 1,
      totalAmount: Number(booking.amount || booking.price || 500),
      specialRequirements: booking.specialRequirements || ''
    });
  };

  // Submit Full Booking Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setIsSubmittingEdit(true);
    try {
      await updateBookingDetails(editingBooking.id, {
        occasionType: editFormData.occasionType as OccasionType,
        eventLocation: editFormData.eventLocation,
        eventDate: editFormData.eventDate,
        eventStartTime: editFormData.eventStartTime,
        eventEndTime: editFormData.eventEndTime,
        daysCount: editFormData.daysCount,
        isMultiday: editFormData.daysCount > 1,
        totalAmount: Number(editFormData.totalAmount),
        budgetOffered: Number(editFormData.totalAmount),
        specialRequirements: editFormData.specialRequirements
      });
      setEditingBooking(null);
    } catch (err) {
      console.error('Failed to update booking:', err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle "View Work" button click
  const handleViewWorkClick = async (booking: Booking) => {
    const isPaid = booking.fullPaymentPaid || booking.balancePaid || String(booking.status).toUpperCase() === 'COMPLETED';

    if (!isPaid) {
      // Prompt client to make payment before unlocking PIN
      setWorkLockedBooking(booking);
    } else {
      // Work is paid & confirmed: display PIN & open gallery
      setViewingWorkBooking(booking);
      if (booking.deliveryUrl) {
        window.open(booking.deliveryUrl, '_blank');
      }
    }
  };

  // Handle Deposit / Full Payment Submission
  const handlePayDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBooking) return;
    setIsProcessingPayment(true);
    try {
      await payDeposit(payingBooking.id, {
        isFullPayment: paymentChoice === 'full',
        channel: paymentChannel === 'momo' ? momoNetwork : paymentChannel
      });
      setPayingBooking(null);
    } catch (err: any) {
      console.error('Payment failed:', err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Arrival Confirmation (Releases Initial Deposit)
  const handleConfirmArrival = async (booking: Booking) => {
    setConfirmingId(booking.id);
    try {
      await confirmArrival(booking.id);
    } catch (err) {
      console.error('Arrival check-in failed:', err);
    } finally {
      setConfirmingId(null);
    }
  };

  // Handle Remaining Balance Settlement
  const handlePayBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBalanceBooking) return;
    setIsProcessingBalance(true);
    try {
      const updated = await payBalance(payingBalanceBooking.id);
      setPayingBalanceBooking(null);
      setWorkLockedBooking(null);
      if (updated) {
        setViewingWorkBooking(updated);
        if (updated.deliveryUrl) {
          window.open(updated.deliveryUrl, '_blank');
        }
      }
    } catch (err) {
      console.error('Balance settlement failed:', err);
    } finally {
      setIsProcessingBalance(false);
    }
  };

  // Handle Dispute Submission
  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingBooking) return;
    setIsSubmittingDispute(true);
    try {
      await createDispute(disputingBooking.id, {
        reason: disputeReason,
        description: disputeDescription
      });
      setDisputingBooking(null);
      setDisputeDescription('');
    } catch (err) {
      console.error('Dispute failed:', err);
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingBooking) return;
    setIsSubmittingReview(true);
    try {
      await submitReview({
        bookingId: reviewingBooking.id,
        photographerId: reviewingBooking.photographerId,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewingBooking(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancelSession = async () => {
    if (managingBooking) {
      setIsCancelling(true);
      try {
        await cancelBooking(managingBooking.id, 'Cancelled by client from dashboard');
        setManagingBooking(null);
        setActivePopup(null);
      } catch (err) {
        console.error('Error cancelling session:', err);
      } finally {
        setIsCancelling(false);
      }
    }
  };

  // Countdown Helper Component
  const DeliveryCountdown: React.FC<{ booking: Booking }> = ({ booking }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
      const calculateTime = () => {
        const deadlineMs = booking.deliveryDeadline 
          ? new Date(booking.deliveryDeadline).getTime()
          : (booking.rawDate ? new Date(booking.rawDate).getTime() + (booking.deliveryDeadlineDays || 7) * 86400000 : Date.now() + 5 * 86400000);
        
        const now = Date.now();
        const diff = deadlineMs - now;

        if (diff <= 0) {
          setTimeLeft('Turnaround Deadline Reached');
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h remaining for delivery`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m remaining for delivery`);
        }
      };

      calculateTime();
      const interval = setInterval(calculateTime, 60000);
      return () => clearInterval(interval);
    }, [booking]);

    return (
      <div className="mx-auto my-2 px-3.5 py-1.5 bg-brand-DEFAULT/10 border border-brand-DEFAULT/20 rounded-full flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-wider text-brand-DEFAULT shadow-sm">
        <Icons.Clock size={12} className="animate-pulse" />
        <span>⏳ {timeLeft}</span>
      </div>
    );
  };

  const renderPopup = () => {
    if (!activePopup) return null;

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setActivePopup(null)}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-[400px] bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden"
        >
          {activePopup === 'invoice' && managingBooking && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 tracking-tight">Invoice</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    INV-{managingBooking.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <Icons.Package size={32} className="text-gray-200" />
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-gray-500">Session Fee</span>
                  <span className="text-gray-900">₵{(managingBooking.amount || managingBooking.price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-gray-500">Deposit Status</span>
                  <span className="text-emerald-600">{managingBooking.depositPaid ? '40% Escrow Secured' : 'Pending Authorization'}</span>
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-between">
                  <span className="text-[12px] font-black uppercase text-gray-900">Total Due</span>
                  <span className="text-xl font-serif font-black italic text-brand-DEFAULT">₵{(managingBooking.amount || managingBooking.price || 0).toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={() => setActivePopup(null)}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2"
              >
                <Icons.Check size={16} /> <span>Receipt Verified</span>
              </button>
            </div>
          )}

          {activePopup === 'cancel-warning' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <Icons.X size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-black italic text-gray-900 tracking-tight mb-2">Cancel Session?</h3>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 leading-relaxed px-2">
                  Are you sure you want to cancel your session with {managingBooking?.photographerName}?
                </p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setActivePopup(null)} className="flex-1 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Keep Booking</button>
                <button 
                  onClick={handleCancelSession}
                  disabled={isCancelling}
                  className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                >
                  {isCancelling ? <Icons.Loader2 className="animate-spin mx-auto" size={16} /> : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          )}
          
          {activePopup !== 'cancel-warning' && (
            <button onClick={() => setActivePopup(null)} className="mt-4 w-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dismiss</button>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="pb-32 bg-gray-50/30 min-h-screen">
      <header className="pt-16 pb-8 px-6 bg-white border-b border-gray-100">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-DEFAULT mb-2">My Schedule</p>
          <h1 className="text-4xl font-serif font-black text-gray-900 tracking-tight italic leading-none">
            Your <span className="text-brand-DEFAULT not-italic">Bookings</span>
          </h1>
        </motion.div>

        <div className="mt-10 flex p-1.5 bg-gray-100/80 rounded-2xl relative">
          <motion.div 
            layoutId="client-booking-tab-highlight" className="absolute inset-y-1.5 bg-white rounded-xl shadow-sm z-0"
            style={{ width: 'calc(50% - 6px)', left: activeTab === 'upcoming' ? '6px' : '50%' }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />
          <button onClick={() => setActiveTab('upcoming')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] relative z-10 transition-colors ${activeTab === 'upcoming' ? 'text-gray-900' : 'text-gray-500'}`}>Upcoming</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] relative z-10 transition-colors ${activeTab === 'history' ? 'text-gray-900' : 'text-gray-500'}`}>Archive</button>
        </div>
      </header>

      <div className="px-6 py-8">
        {isLoading ? (
          <div className="space-y-6">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {displayBookings.length > 0 ? (
                displayBookings.map((booking, idx) => {
                  const avatarUrl = booking.photographerImage || booking.photographerAvatar;
                  const initials = booking.photographerName
                    ? booking.photographerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'PH';

                  const normStatus = String(booking.status).toUpperCase();
                  const isApproved = normStatus === 'ACCEPTED' || normStatus === 'APPROVED';
                  const isDepositPaid = booking.depositPaid || normStatus === 'CONFIRMED' || normStatus === 'IN_PROGRESS' || normStatus === 'COMPLETED';
                  const isArrivalConfirmed = !!booking.clientConfirmedArrivalAt || normStatus === 'IN_PROGRESS' || normStatus === 'COMPLETED';
                  const isDelivered = booking.workDeliveryStatus === 'DELIVERED' || normStatus === 'COMPLETED';
                  const isFullyPaid = booking.fullPaymentPaid || booking.balancePaid || normStatus === 'COMPLETED';

                  return (
                    <motion.div 
                      key={booking.id} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: idx * 0.1 }} 
                      className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-black/5 border border-gray-100 group"
                    >
                      <div className="p-6">
                        {/* Status Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md" />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-brand-light flex items-center justify-center font-serif font-black text-lg border-2 border-white shadow-md">
                                {initials}
                              </div>
                            )}
                            <div>
                              <h3 className="font-serif font-bold text-xl text-gray-900 leading-tight group-hover:text-brand-DEFAULT transition-colors italic">{booking.photographerName}</h3>
                              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mt-0.5">
                                {booking.package?.name || `${booking.category || booking.service} Session`}
                              </p>
                            </div>
                          </div>
                          <StatusBadge 
                            status={booking.status} 
                            isDepositPaid={isDepositPaid} 
                            isArrivalConfirmed={isArrivalConfirmed} 
                            isDelivered={isDelivered}
                          />
                        </div>

                        {/* Middle Countdown Timer during active shoot turnaround */}
                        {(isDepositPaid || normStatus === 'IN_PROGRESS') && !isDelivered && (
                          <DeliveryCountdown booking={booking} />
                        )}

                        {/* Session Details Bar */}
                        <div className="bg-gray-50/80 rounded-2xl p-4 flex justify-between items-center mb-5">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Icons.Calendar size={14} strokeWidth={1.5} />
                              <span className="text-[11px] font-bold uppercase tracking-wider">{booking.date}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Icons.MapPin size={14} strokeWidth={1.5} />
                              <span className="text-[11px] font-medium truncate max-w-[180px]">{booking.location || 'Accra Central'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-serif font-black text-gray-900 italic">₵{booking.amount || booking.price || 0}</p>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                              {booking.depositPaid ? (isFullyPaid ? '100% Paid' : '40% Deposit Paid') : 'Unpaid'}
                            </span>
                          </div>
                        </div>

                        {/* Work Deliverables Ready Alert & View Work Button */}
                        {isDelivered && (
                          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-emerald-800">
                                <Icons.CheckCircle size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Master Gallery Uploaded</span>
                              </div>
                              {isFullyPaid && booking.accessPin ? (
                                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-mono font-black text-xs">
                                  PIN: {booking.accessPin}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-300 rounded-md text-[9px] font-bold uppercase">
                                  PIN Protected 🔒
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                              {isFullyPaid 
                                ? 'Your deliverables are unlocked! Click "View Work" to open your master gallery. Your PIN is displayed above.' 
                                : `Photographer has uploaded deliverables to external storage. Pay remaining balance (₵${booking.balanceAmount || Math.round((booking.amount || 0) * 0.6)}) to unlock your Access PIN.`}
                            </p>

                            <button
                              onClick={() => handleViewWorkClick(booking)}
                              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
                            >
                              <Icons.Eye size={14} />
                              <span>View Work Deliverables</span>
                            </button>
                          </div>
                        )}

                        {/* Dynamic Action Buttons per Lifecycle Stage */}
                        <div className="space-y-2">
                          {/* Stage 1: Approved -> Make Payment */}
                          {isApproved && !isDepositPaid && (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setPayingBooking(booking)}
                                className="flex-1 py-4 bg-brand-DEFAULT text-black rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg flex items-center justify-center space-x-2"
                              >
                                <Icons.CreditCard size={16} />
                                <span>Make Payment (Deposit)</span>
                              </button>
                              <button
                                onClick={() => onOpenChat?.(booking.photographerId, booking.id)}
                                className="p-4 bg-gray-100 text-gray-700 rounded-2xl active:scale-95 transition-all"
                              >
                                <Icons.MessageSquare size={16} />
                              </button>
                            </div>
                          )}

                          {/* Stage 2: Deposit Paid -> Confirm Arrival Check-in */}
                          {isDepositPaid && !isArrivalConfirmed && (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleConfirmArrival(booking)}
                                disabled={confirmingId === booking.id}
                                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg flex items-center justify-center space-x-2"
                              >
                                {confirmingId === booking.id ? (
                                  <Icons.Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <>
                                    <Icons.CheckCircle size={16} />
                                    <span>Confirm Photographer Arrival</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => onOpenChat?.(booking.photographerId, booking.id)}
                                className="p-4 bg-gray-100 text-gray-700 rounded-2xl active:scale-95 transition-all"
                              >
                                <Icons.MessageSquare size={16} />
                              </button>
                            </div>
                          )}

                          {/* Stage 3: In Progress & Deliverables Ready -> Pay Balance if not fully paid */}
                          {isDelivered && !isFullyPaid && (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setPayingBalanceBooking(booking)}
                                className="flex-1 py-4 bg-brand-DEFAULT text-black rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg flex items-center justify-center space-x-2"
                              >
                                <Icons.Unlock size={16} />
                                <span>Pay Remaining Balance (₵{booking.balanceAmount || Math.round((booking.amount || 0) * 0.6)})</span>
                              </button>
                            </div>
                          )}

                          {/* Stage 4: Pending / Negotiation actions */}
                          {normStatus === 'PENDING' && (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => onOpenChat?.(booking.photographerId, booking.id)}
                                className="flex-1 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg flex items-center justify-center space-x-2 hover:bg-brand-DEFAULT hover:text-black"
                              >
                                <Icons.MessageSquare size={14} /> <span>Negotiate / Chat</span>
                              </button>
                              <button 
                                onClick={() => handleOpenEdit(booking)}
                                className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1"
                              >
                                <Icons.Edit size={13} />
                                <span>Edit Brief</span>
                              </button>
                              <button 
                                onClick={() => { setManagingBooking(booking); setActivePopup('cancel-warning'); }}
                                className="p-3.5 bg-red-50 text-red-500 rounded-2xl active:scale-95 transition-all"
                              >
                                <Icons.X size={16} />
                              </button>
                            </div>
                          )}

                          {/* Stage 5: Completed Rate / Review */}
                          {normStatus === 'COMPLETED' && (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setReviewingBooking(booking)}
                                className="flex-1 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center space-x-2 hover:bg-brand-DEFAULT hover:text-black"
                              >
                                <Icons.Star size={14} className="text-yellow-400 fill-current" /> 
                                <span>Rate Session Experience</span>
                              </button>
                              <button 
                                onClick={() => { setManagingBooking(booking); setActivePopup('invoice'); }}
                                className="px-4 py-3.5 bg-gray-100 text-gray-700 rounded-2xl text-[10px] font-bold uppercase tracking-wider"
                              >
                                Invoice
                              </button>
                            </div>
                          )}

                          {/* Dispute Link for active engagements */}
                          {(isDepositPaid || isApproved) && normStatus !== 'COMPLETED' && normStatus !== 'CANCELLED' && normStatus !== 'DISPUTED' && (
                            <div className="flex justify-between items-center pt-2 px-1 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                              <button 
                                onClick={() => { setManagingBooking(booking); setActivePopup('invoice'); }}
                                className="hover:underline"
                              >
                                View Escrow Mandate
                              </button>
                              <button 
                                onClick={() => setDisputingBooking(booking)}
                                className="text-red-400 hover:text-red-600 hover:underline flex items-center space-x-1"
                              >
                                <Icons.AlertCircle size={10} />
                                <span>Raise Dispute</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icons.Calendar size={32} className="text-gray-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-serif font-black text-gray-900 italic tracking-tight mb-2">No {activeTab} sessions</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-[260px] mx-auto mb-8">
                    Discover Ghanaian visual artists and secure your session schedule.
                  </p>
                  <button 
                    onClick={() => onTabChange?.('explore')}
                    className="bg-gray-900 text-gray-200 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Find Masters
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Full Booking Edit Modal */}
      <AnimatePresence>
        {editingBooking && (
          <div className="fixed inset-0 z-[140] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingBooking(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-DEFAULT">Modify Commission</span>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mt-0.5">Edit Booking Brief</h3>
                </div>
                <button onClick={() => setEditingBooking(null)} className="p-2 text-gray-400">
                  <Icons.X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-5">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Category</label>
                  <select
                    value={editFormData.occasionType}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, occasionType: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                  >
                    <option value="Portrait">Portrait & Headshot</option>
                    <option value="Wedding">Wedding & Nuptials</option>
                    <option value="Corporate">Corporate & Gala</option>
                    <option value="Conference">Conference & Summit</option>
                    <option value="Product">Product & Commercial</option>
                    <option value="Fashion">Fashion & Editorial</option>
                    <option value="Family">Family & Lifestyle</option>
                  </select>
                </div>

                {/* Shoot Location */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Shoot Location</label>
                  <input 
                    type="text"
                    required
                    value={editFormData.eventLocation}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, eventLocation: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                  />
                </div>

                {/* Date & Time Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Event Date</label>
                    <input 
                      type="date"
                      required
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      value={editFormData.eventDate}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Call Time</label>
                    <input 
                      type="time"
                      value={editFormData.eventStartTime}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, eventStartTime: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>

                {/* Multi-Day */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Event Duration (Days)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 5].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, daysCount: d }))}
                        className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                          editFormData.daysCount === d ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}
                      >
                        {d === 1 ? '1 Day' : `${d} Days`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Slider */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Budget (Cedis)</span>
                    <span className="font-serif font-black text-xl text-gray-900 italic">₵{editFormData.totalAmount}</span>
                  </div>
                  <input 
                    type="range"
                    min={200}
                    max={15000}
                    step={50}
                    value={editFormData.totalAmount}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                    className="w-full accent-brand-DEFAULT h-2 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-gray-400">
                    <span>Min ₵200</span>
                    <span>Max ₵15,000</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Special Requirements</label>
                  <textarea 
                    rows={2}
                    value={editFormData.specialRequirements}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-medium text-gray-900 outline-none resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingBooking(null)}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="flex-1 py-4 bg-gray-900 text-brand-light hover:bg-brand-DEFAULT hover:text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2"
                  >
                    {isSubmittingEdit ? <Icons.Loader2 className="animate-spin" size={16} /> : <span>Save Brief Updates</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deliverables Locked Modal (When client clicks View Work but hasn't paid remaining balance) */}
      <AnimatePresence>
        {workLockedBooking && (
          <div className="fixed inset-0 z-[140] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setWorkLockedBooking(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

              <div className="text-center space-y-4 mb-6">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
                  <Icons.Lock size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">Password Protected</span>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mt-1">Deliverables Locked</h3>
                  <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed px-4">
                    {workLockedBooking.photographerName} has uploaded your full resolution gallery. Settle the remaining balance to receive your secure Access PIN.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Remaining Balance (60%)</span>
                  <span className="font-serif font-black text-xl text-gray-900 italic">
                    ₵{workLockedBooking.balanceAmount || Math.round(Number(workLockedBooking.amount || 0) * 0.6)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  Once payment is confirmed, your PIN is instantly sent via SMS text message, email, and app inbox.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setWorkLockedBooking(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const b = workLockedBooking;
                    setWorkLockedBooking(null);
                    setPayingBalanceBooking(b);
                  }}
                  className="flex-1 py-4 bg-brand-DEFAULT text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2"
                >
                  <Icons.Unlock size={14} />
                  <span>Pay Remaining Balance</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deliverables Unlocked & Access PIN Modal (When paid) */}
      <AnimatePresence>
        {viewingWorkBooking && (
          <div className="fixed inset-0 z-[140] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingWorkBooking(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

              <div className="text-center space-y-4 mb-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                  <Icons.CheckCircle size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Access Granted</span>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mt-1">Master Gallery Unlocked</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Your full balance has been verified and settled.
                  </p>
                </div>
              </div>

              {/* Access PIN Showcase */}
              <div className="p-6 bg-gradient-to-br from-gray-900 to-black rounded-3xl text-white text-center space-y-2 mb-6 shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-DEFAULT block">Your Gallery Access PIN</span>
                <span className="font-mono font-black text-4xl tracking-widest text-brand-light block">
                  {viewingWorkBooking.accessPin || '9482'}
                </span>
                <p className="text-[10px] text-gray-400 font-medium">
                  Use this PIN when prompted on the gallery host platform.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl mb-6">
                <p className="text-[10px] text-emerald-800 font-medium">
                  📱 This PIN has also been sent to your mobile phone number via text message and to your registered email address.
                </p>
              </div>

              <div className="space-y-3">
                {viewingWorkBooking.deliveryUrl && (
                  <button
                    onClick={() => window.open(viewingWorkBooking.deliveryUrl!, '_blank')}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Icons.Download size={14} />
                    <span>Open Full Resolution Gallery</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingWorkBooking(null)}
                  className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Escrow Deposit Payment Modal */}
      <AnimatePresence>
        {payingBooking && (
          <div className="fixed inset-0 z-[140] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPayingBooking(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-DEFAULT">Platform Escrow</span>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mt-0.5">Secure Deposit</h3>
                </div>
                <button onClick={() => setPayingBooking(null)} className="p-2 text-gray-400">
                  <Icons.X size={20} />
                </button>
              </div>

              <form onSubmit={handlePayDepositSubmit} className="space-y-6">
                {/* Choice: 40% Deposit vs 100% Full Payment */}
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setPaymentChoice('deposit')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentChoice === 'deposit' 
                        ? 'bg-brand-DEFAULT/10 border-brand-DEFAULT ring-2 ring-brand-DEFAULT/30' 
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">40% Initial Deposit</span>
                    <span className="font-serif font-black text-xl text-gray-900 italic">
                      ₵{payingBooking.depositAmount || Math.round(Number(payingBooking.amount || 0) * 0.4)}
                    </span>
                    <p className="text-[9px] text-gray-400 mt-1">Held in escrow until check-in</p>
                  </div>

                  <div 
                    onClick={() => setPaymentChoice('full')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentChoice === 'full' 
                        ? 'bg-brand-DEFAULT/10 border-brand-DEFAULT ring-2 ring-brand-DEFAULT/30' 
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">100% Full Upfront</span>
                    <span className="font-serif font-black text-xl text-gray-900 italic">
                      ₵{payingBooking.amount || payingBooking.price || 0}
                    </span>
                    <p className="text-[9px] text-gray-400 mt-1">Split escrow held automatically</p>
                  </div>
                </div>

                {/* Payment Channel Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('momo')}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        paymentChannel === 'momo' ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-100'
                      }`}
                    >
                      MoMo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('card')}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        paymentChannel === 'card' ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-100'
                      }`}
                    >
                      Bank Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('wallet')}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        paymentChannel === 'wallet' ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-100'
                      }`}
                    >
                      Vault Wallet
                    </button>
                  </div>
                </div>

                {paymentChannel === 'momo' && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex space-x-2">
                      {(['MTN', 'Telecel', 'AirtelTigo'] as const).map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setMomoNetwork(net)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border ${
                            momoNetwork === net ? 'bg-brand-DEFAULT text-black border-brand-DEFAULT font-bold' : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="tel"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="Mobile Money Number (e.g. 0244123456)"
                      className="w-full bg-white border border-gray-200 p-3.5 rounded-xl text-xs font-bold text-gray-900 outline-none"
                    />
                  </div>
                )}

                <div className="p-4 bg-brand-DEFAULT/5 border border-brand-DEFAULT/20 rounded-2xl space-y-1">
                  <div className="flex items-center space-x-2 text-brand-DEFAULT">
                    <Icons.ShieldCheck size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Escrow Guarantee</span>
                  </div>
                  <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                    Funds are held in platform trust by administration. Deposit is released to {payingBooking.photographerName} only after you confirm their physical check-in on shoot day.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-4 bg-gray-900 text-brand-light hover:bg-brand-DEFAULT hover:text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessingPayment ? (
                    <Icons.Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Icons.Lock size={14} />
                      <span>Authorize Escrow Deposit (₵{paymentChoice === 'deposit' ? (payingBooking.depositAmount || Math.round(Number(payingBooking.amount || 0) * 0.4)) : payingBooking.amount})</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Balance Payment Modal */}
      <AnimatePresence>
        {payingBalanceBooking && (
          <div className="fixed inset-0 z-[140] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPayingBalanceBooking(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-DEFAULT">Final Settlement</span>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mt-0.5">Unlock Deliverables</h3>
                </div>
                <button onClick={() => setPayingBalanceBooking(null)} className="p-2 text-gray-400">
                  <Icons.X size={20} />
                </button>
              </div>

              <form onSubmit={handlePayBalanceSubmit} className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Remaining Balance (60%)</span>
                  <span className="font-serif font-black text-3xl text-gray-900 italic">
                    ₵{payingBalanceBooking.balanceAmount || Math.round(Number(payingBalanceBooking.amount || 0) * 0.6)}
                  </span>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Settling this balance releases funds to {payingBalanceBooking.photographerName} and instantly unlocks your protected Access PIN.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessingBalance}
                  className="w-full py-4 bg-brand-DEFAULT text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessingBalance ? (
                    <Icons.Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Icons.Unlock size={14} />
                      <span>Settle Balance & Reveal Access PIN</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dispute Modal */}
      <AnimatePresence>
        {disputingBooking && (
          <div className="fixed inset-0 z-[140] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDisputingBooking(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">Arbitration Center</span>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mt-0.5">Raise Dispute</h3>
                </div>
                <button onClick={() => setDisputingBooking(null)} className="p-2 text-gray-400">
                  <Icons.X size={20} />
                </button>
              </div>

              <form onSubmit={handleDisputeSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Reason</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                  >
                    <option value="Photographer No-Show / Late">Photographer No-Show / Late</option>
                    <option value="Quality / Unmet Requirements">Quality / Unmet Requirements</option>
                    <option value="Delivery Deadline Exceeded">Delivery Deadline Exceeded</option>
                    <option value="Conduct / Policy Violation">Conduct / Policy Violation</option>
                    <option value="Other">Other Conflict</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Details & Evidence Description</label>
                  <textarea
                    required
                    rows={4}
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Describe what occurred with session timing, deliverables, or artisan communication..."
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-medium text-gray-900 outline-none resize-none"
                  />
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-[10px] text-red-700 font-medium">
                    ⚠️ When a dispute is submitted, escrow fund releases are paused and an administrator will review messages and deliverables within 24 hours.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingDispute}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  {isSubmittingDispute ? (
                    <Icons.Loader2 className="animate-spin" size={16} />
                  ) : (
                    <span>Submit Dispute to Admin</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {renderPopup()}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingBooking && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReviewingBooking(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[400px] bg-white rounded-[40px] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-1">Rate Experience</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">With {reviewingBooking.photographerName}</p>
              
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div className="flex justify-center space-x-3 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-yellow-500 active:scale-125 transition-transform"
                    >
                      <Icons.Star 
                        size={32} 
                        className={star <= reviewRating ? "fill-current" : "text-gray-200"} 
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Your Artistic Feedback</label>
                  <textarea
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe the creativity, precision, and delivery of the session..."
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-medium h-32 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10 resize-none"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setReviewingBooking(null)}
                    className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2"
                  >
                    {isSubmittingReview ? <Icons.Loader2 className="animate-spin" size={16} /> : 'Publish Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge: React.FC<{ 
  status: string; 
  isDepositPaid?: boolean; 
  isArrivalConfirmed?: boolean; 
  isDelivered?: boolean; 
}> = ({ status, isDepositPaid, isArrivalConfirmed, isDelivered }) => {
  const norm = String(status).toUpperCase();

  const getBadge = () => {
    if (norm === 'DISPUTED') {
      return { label: 'Disputed', style: 'bg-red-50 text-red-600 border-red-200' };
    }
    if (norm === 'COMPLETED') {
      return { label: 'Completed', style: 'bg-brand-DEFAULT/10 text-brand-DEFAULT border-brand-DEFAULT/20' };
    }
    if (isDelivered) {
      return { label: 'Deliverables Ready', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (isArrivalConfirmed || norm === 'IN_PROGRESS') {
      return { label: 'Shoot In Progress', style: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (isDepositPaid || norm === 'CONFIRMED') {
      return { label: 'Deposit Secured', style: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (norm === 'ACCEPTED' || norm === 'APPROVED') {
      return { label: 'Approved', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    }
    if (norm === 'PENDING') {
      return { label: 'Pending Approval', style: 'bg-amber-50 text-amber-600 border-amber-100' };
    }
    if (norm === 'REJECTED' || norm === 'DECLINED') {
      return { label: 'Declined', style: 'bg-red-50 text-red-500 border-red-100' };
    }
    if (norm === 'CANCELLED') {
      return { label: 'Cancelled', style: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
    return { label: status, style: 'bg-gray-50 text-gray-600 border-gray-100' };
  };

  const { label, style } = getBadge();

  return (
    <span className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${style}`}>
      {label}
    </span>
  );
};

export default Bookings;
