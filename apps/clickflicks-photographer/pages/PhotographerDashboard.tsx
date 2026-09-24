import React, { useState, useEffect } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotographerProfile } from '../hooks/usePhotographerProfile';
import { usePhotographerBookings } from '../hooks/usePhotographerBookings';
import { apiClient } from '../lib/api-client';

interface PhotographerDashboardProps {
  kycStatus?: 'pending' | 'submitted' | 'verified';
  onGeminiClick?: () => void;
  onNavigateTab?: (tab: string) => void;
  onNavigateKYC?: () => void;
}

const PhotographerDashboard: React.FC<PhotographerDashboardProps> = ({ 
  kycStatus, 
  onGeminiClick,
  onNavigateTab,
  onNavigateKYC
}) => {
  const { user, profile } = usePhotographerProfile();
  const { bookings } = usePhotographerBookings();
  const [selectedLedgerItem, setSelectedLedgerItem] = useState<any | null>(null);
  const [kycData, setKycData] = useState<any>(null);
  const [isNoteDismissed, setIsNoteDismissed] = useState(false);

  useEffect(() => {
    apiClient.get('/photographers/kyc/me').then(res => {
      if (res.data?.success && res.data?.data?.kyc) {
        setKycData(res.data.data.kyc);
      }
    }).catch(() => {});
  }, []);

  // Compute live financial & booking metrics
  const activeShoots = bookings.filter(b => {
    const s = String(b.status).toLowerCase();
    return s === 'confirmed' || s === 'accepted' || s === 'in_progress';
  }).sort((a, b) => {
    const timeA = new Date(a.rawDate || a.date).getTime() || 0;
    const timeB = new Date(b.rawDate || b.date).getTime() || 0;
    return timeA - timeB;
  });

  const imminentSession = activeShoots[0] || null;

  const totalRevenue = bookings
    .filter(b => {
      const s = String(b.status).toLowerCase();
      return s === 'confirmed' || s === 'accepted' || s === 'in_progress' || s === 'completed';
    })
    .reduce((sum, b) => sum + (Number(b.price) || Number(b.amount) || 0), 0);

  const averageRating = profile?.average_rating != null && Number(profile.average_rating) > 0 
    ? Number(profile.average_rating).toFixed(1) 
    : (user?.is_verified ? '5.0' : 'New');

  const isKYCCompletedLocal = typeof window !== 'undefined' && (
    (user?.id && (localStorage.getItem(`clickflicks_photographer_kyc_${user.id}`) === 'submitted' || localStorage.getItem(`clickflicks_photographer_kyc_${user.id}`) === 'verified'))
  );

  const rawKycStatus = (kycData?.kyc_status || (profile as any)?.photographer_kyc?.kyc_status || '').toUpperCase();
  const decisionNotes = (kycData?.decision_notes || (profile as any)?.photographer_kyc?.decision_notes || '').trim();
  const isRejected = rawKycStatus === 'REJECTED' || profile?.verification_status === 'REJECTED';
  const isNeedsMoreInfo = rawKycStatus === 'NEEDS_MORE_INFO';

  const hasSubmittedKYC = rawKycStatus === 'SUBMITTED' || 
    rawKycStatus === 'IN_REVIEW' ||
    kycStatus === 'submitted' ||
    isKYCCompletedLocal;

  const isVerifiedUser = (
    (profile?.verification_status === 'VERIFIED' && (rawKycStatus === 'APPROVED' || (profile as any)?.kyc_verified_at != null)) ||
    kycStatus === 'verified'
  );

  const isKYCAlreadyDone = (hasSubmittedKYC || isVerifiedUser) && !isRejected && !isNeedsMoreInfo;

  const handleNavigate = (loc?: string) => {
    const query = encodeURIComponent(loc || 'Accra, Ghana');
    window.open(`https://maps.google.com/?q=${query}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:+233200000000';
  };

  // Derive real ledger items from bookings
  const ledgerItems = bookings.map((b) => {
    const s = String(b.status).toLowerCase();
    const isIncome = s === 'completed' || s === 'confirmed' || s === 'accepted';
    return {
      id: b.id,
      type: isIncome ? 'income' : 'inquiry',
      title: s === 'completed' ? 'Shoot Completed & Settled' : s === 'accepted' ? 'Brief Accepted (Escrow Pending)' : s === 'confirmed' ? 'Booking Escrow Confirmed' : 'Booking Request Inbound',
      subtitle: `${b.service} • ${b.clientName}`,
      time: b.date,
      amount: isIncome ? (b.price || b.amount) : null,
      status: b.status ? String(b.status).toUpperCase() : 'PENDING'
    };
  });

  const userInitials = user?.first_name 
    ? `${user.first_name[0]}${user.last_name ? user.last_name[0] : ''}`.toUpperCase()
    : 'PH';

  return (
    <div className="pb-32 bg-gray-50/50 min-h-screen relative">
      <header className="relative pt-16 pb-10 px-6">
        <div className="flex justify-between items-center mb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-2">Studio Command</p>
             <h1 className="text-3xl font-serif font-black text-gray-900 tracking-tight leading-none italic">
               Welcome Back, <br />
               <span className="text-brand-DEFAULT not-italic">
                 {user?.first_name ? `Master ${user.first_name}` : 'Master Creator'}
               </span>
             </h1>
          </motion.div>
          <div className="w-12 h-12 rounded-2xl bg-gray-900 text-brand-light font-serif font-black italic flex items-center justify-center p-0.5 shadow-xl overflow-hidden border border-gray-800">
             {user?.profile_image_url ? (
               <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover rounded-[14px]" />
             ) : (
               <span>{userInitials}</span>
             )}
          </div>
        </div>
        
        {/* Verification Status & Curator Feedback Banner */}
        {isRejected ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onClick={onNavigateKYC}
            className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between cursor-pointer hover:bg-rose-100/70 transition-colors shadow-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
                <Icons.AlertCircle size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800">
                    Verification Update Required
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900 mt-1">Application Reviewed • Action Needed</p>
                {decisionNotes ? (
                  <p className="text-[11px] text-rose-950 font-medium leading-relaxed mt-1 bg-white/80 p-2 rounded-xl border border-rose-200/60">
                    💬 Curator Feedback: "{decisionNotes}"
                  </p>
                ) : (
                  <p className="text-[10px] text-rose-800 font-medium leading-tight mt-0.5">
                    Your verification was not approved. Tap to review curator feedback and update your documents.
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onNavigateKYC?.(); }}
              className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-rose-700 transition-colors shrink-0 ml-2 shadow-sm"
            >
              Update
            </button>
          </motion.div>
        ) : isNeedsMoreInfo ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onClick={onNavigateKYC}
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between cursor-pointer hover:bg-amber-100/70 transition-colors shadow-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shrink-0 mt-0.5">
                <Icons.AlertCircle size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                    More Info Requested
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900 mt-1">Curator Action Needed</p>
                {decisionNotes ? (
                  <p className="text-[11px] text-amber-950 font-medium leading-relaxed mt-1 bg-white/80 p-2 rounded-xl border border-amber-200/60">
                    💬 Curator Note: "{decisionNotes}"
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-800 font-medium leading-tight mt-0.5">
                    The curator team requested further verification details. Tap to update your application.
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onNavigateKYC?.(); }}
              className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-amber-700 transition-colors shrink-0 ml-2 shadow-sm"
            >
              Provide
            </button>
          </motion.div>
        ) : isVerifiedUser && decisionNotes && !isNoteDismissed ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start justify-between shadow-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                <Icons.ShieldCheck size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                    Verified Master Artisan
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900 mt-1">Studio Verification Approved</p>
                <p className="text-[11px] text-emerald-950 font-medium leading-relaxed mt-1 bg-white/80 p-2 rounded-xl border border-emerald-200/60">
                  💬 Curator Note: "{decisionNotes}"
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsNoteDismissed(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-emerald-100 rounded-lg transition-colors ml-2"
              title="Dismiss"
            >
              <Icons.X size={16} />
            </button>
          </motion.div>
        ) : !isKYCAlreadyDone ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onClick={onNavigateKYC}
            className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
                <Icons.AlertCircle size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Action Required • Complete KYC</p>
                <p className="text-[10px] text-amber-800 font-medium leading-tight mt-0.5">Complete your verification to publish your studio.</p>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onNavigateKYC?.(); }}
              className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-amber-600 transition-colors shrink-0 ml-2 shadow-sm"
            >
              Start
            </button>
          </motion.div>
        ) : !isVerifiedUser ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            onClick={onNavigateKYC}
            className="mb-6 p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-start justify-between cursor-pointer hover:bg-sky-100/70 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-sky-100 text-sky-600 rounded-xl shrink-0 mt-0.5">
                <Icons.Clock size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Verification Pending</p>
                {decisionNotes ? (
                  <p className="text-[11px] text-sky-950 font-medium leading-relaxed mt-1 bg-white/80 p-2 rounded-xl border border-sky-200/60">
                    💬 Curator Note: "{decisionNotes}"
                  </p>
                ) : (
                  <p className="text-[9px] text-gray-500 font-medium leading-tight mt-0.5">Application under review • Tap to review or edit details anytime.</p>
                )}
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onNavigateKYC?.(); }}
              className="px-3 py-1.5 bg-sky-600 text-white text-[10px] font-bold rounded-xl hover:bg-sky-700 transition-colors shrink-0 ml-2"
            >
              Edit
            </button>
          </motion.div>
        ) : null}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-gray-900 p-5 rounded-[32px] text-gray-200 shadow-xl shadow-gray-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-light/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
                <div className="relative z-10">
                    <Icons.Briefcase className="text-brand-light mb-3" size={24} />
                    <p className="text-3xl font-serif font-black italic">₵{totalRevenue > 1000 ? `${(totalRevenue / 1000).toFixed(1)}k` : totalRevenue}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">Total Revenue</p>
                </div>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
                <Icons.Star className="text-yellow-500 mb-3" size={24} fill="currentColor" />
                <p className="text-3xl font-serif font-black italic text-gray-900">{averageRating}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">Client Rating</p>
            </motion.div>
        </div>
      </header>

      {/* Next Session Card */}
      <section className="px-6 mb-8">
         <div className="flex items-center space-x-2 mb-4">
            <Icons.Clock size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Imminent Session</h2>
         </div>
         <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[40px] p-1 border border-gray-100 shadow-xl shadow-black/5"
         >
            {imminentSession ? (
              <div className="bg-gray-50 rounded-[36px] p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-brand-DEFAULT/5 rounded-full blur-3xl group-hover:bg-brand-DEFAULT/10 transition-colors"></div>
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                          <div className="flex -space-x-2">
                             <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                               {imminentSession.clientAvatar ? (
                                 <img src={imminentSession.clientAvatar} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <span className="text-xs font-bold text-gray-700">
                                   {imminentSession.clientName ? imminentSession.clientName.slice(0, 2).toUpperCase() : 'CL'}
                                 </span>
                               )}
                             </div>
                          </div>
                          <div className="bg-brand-DEFAULT text-black px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                              {imminentSession.date}
                          </div>
                      </div>

                      <h3 className="font-serif font-black text-2xl text-gray-900 italic mb-1">{imminentSession.service}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-6">{imminentSession.clientName} • {imminentSession.location}</p>

                      <div className="grid grid-cols-2 gap-2">
                          <button 
                              onClick={() => handleNavigate(imminentSession.location)}
                              className="bg-white border border-gray-200 text-gray-900 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
                          >
                              <Icons.MapPin size={14} className="text-brand-DEFAULT" />
                              <span>Navigate</span>
                          </button>
                          <button 
                              onClick={handleCall}
                              className="bg-gray-900 text-gray-200 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-md shadow-gray-900/20"
                          >
                              <Icons.Phone size={14} />
                              <span>Call Client</span>
                          </button>
                      </div>
                  </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-[36px] p-8 text-center">
                <Icons.Calendar size={32} className="text-gray-300 mx-auto mb-2" />
                <h4 className="font-serif font-bold text-gray-900 text-base mb-1">No Upcoming Sessions</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your studio schedule is currently clear</p>
              </div>
            )}
         </motion.div>
      </section>

      {/* Quick Ops Controls */}
      <section className="px-6 mb-8">
         <div className="grid grid-cols-4 gap-2">
            <button onClick={() => onNavigateTab?.('studio')} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 mb-2 group-hover:bg-brand-DEFAULT group-hover:text-black transition-colors">
                    <Icons.Upload size={18} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Assets</span>
            </button>
            <button onClick={() => onNavigateTab?.('studio')} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 mb-2 group-hover:bg-brand-DEFAULT group-hover:text-black transition-colors">
                    <Icons.CreditCard size={18} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Payout</span>
            </button>
            <button onClick={() => onNavigateTab?.('schedule')} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 mb-2 group-hover:bg-brand-DEFAULT group-hover:text-black transition-colors">
                    <Icons.Calendar size={18} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Sync</span>
            </button>
            <button onClick={() => onNavigateTab?.('studio')} className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 mb-2 group-hover:bg-brand-DEFAULT group-hover:text-black transition-colors">
                    <Icons.Edit size={18} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Rates</span>
            </button>
         </div>
      </section>

      {/* Floating Gemini AI Studio Assistant */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onGeminiClick}
        className="fixed bottom-32 right-6 w-14 h-14 bg-black text-brand-light rounded-full shadow-2xl flex items-center justify-center z-50 border-2 border-brand-DEFAULT/30"
      >
        <Icons.Sparkles size={24} />
      </motion.button>

      {/* Activity Log */}
      <section className="px-6 mb-8">
         <div className="flex justify-between items-center mb-4">
             <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Live Ledger</h2>
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Realtime Sync</span>
         </div>
         <div className="space-y-3">
             {ledgerItems.length > 0 ? (
               ledgerItems.map(item => (
                   <div 
                      key={item.id} 
                      onClick={() => setSelectedLedgerItem(item)}
                      className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-all"
                   >
                       <div className="flex items-center space-x-3">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-DEFAULT/10 text-brand-DEFAULT'}`}>
                               {item.type === 'income' ? <Icons.ArrowRight className="-rotate-45" size={16} /> : <Icons.MessageSquare size={16} />}
                           </div>
                           <div>
                               <p className="text-xs font-bold text-gray-900">{item.title}</p>
                               <p className="text-[9px] text-gray-400 font-medium">{item.subtitle} • {item.time}</p>
                           </div>
                       </div>
                       {item.amount != null && item.amount > 0 && (
                           <span className="font-serif font-black italic text-sm text-emerald-600">
                               +₵{item.amount}
                           </span>
                       )}
                   </div>
               ))
             ) : (
               <div className="text-center py-10 bg-white rounded-3xl border border-gray-100">
                 <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No ledger transactions recorded yet</p>
               </div>
             )}
         </div>
      </section>

      {/* Ledger Item Detail Modal */}
      <AnimatePresence>
        {selectedLedgerItem && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLedgerItem(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-6">{selectedLedgerItem.title}</h3>
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</span>
                            <span className="text-xs font-bold text-gray-900">{selectedLedgerItem.subtitle}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Timestamp</span>
                            <span className="text-xs font-bold text-gray-900">{selectedLedgerItem.time}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Status</span>
                            <span className="text-xs font-bold text-brand-DEFAULT">{selectedLedgerItem.status}</span>
                        </div>
                        {selectedLedgerItem.amount && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Net Flow</span>
                                <span className="text-lg font-serif font-black italic text-gray-900">₵{Math.abs(selectedLedgerItem.amount)}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setSelectedLedgerItem(null)} className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest">
                        Close
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographerDashboard;
