import React, { useState } from 'react';
import { MOCK_BOOKINGS } from '../constants';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking } from '../types';

type BookingTab = 'upcoming' | 'history';
type MockPopup = 'invoice' | 'contract' | 'gallery' | 'reschedule' | 'cancel-warning' | null;

interface BookingsProps {
  onTabChange?: (tab: string) => void;
  onOpenChat?: (photographerId: string) => void;
}

const Bookings: React.FC<BookingsProps> = ({ onTabChange, onOpenChat }) => {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [managingBooking, setManagingBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<string | null>(null);
  const [activePopup, setActivePopup] = useState<MockPopup>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING');
  const historyBookings = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED');

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : historyBookings;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewingBooking(null);
    setReviewComment('');
    setReviewRating(5);
  };

  const handleCancelSession = () => {
    if (managingBooking) {
      setBookings(prev => prev.map(b => b.id === managingBooking.id ? { ...b, status: 'CANCELLED' } : b));
      setManagingBooking(null);
      setActivePopup(null);
    }
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
          {activePopup === 'invoice' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 tracking-tight">Invoice</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">LNC-INV-2026-001</p>
                </div>
                <Icons.Package size={32} className="text-gray-200" />
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-gray-500">Session Fee</span>
                  <span className="text-gray-900">₵2,200.00</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-gray-500">Processing</span>
                  <span className="text-gray-900">₵300.00</span>
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-between">
                  <span className="text-[12px] font-black uppercase text-gray-900">Total</span>
                  <span className="text-xl font-serif font-black italic text-brand-DEFAULT">₵2,500.00</span>
                </div>
              </div>
              <button className="w-full bg-gray-900 text-gray-200 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2">
                <Icons.Check size={16} /> <span>Paid</span>
              </button>
            </div>
          )}

          {activePopup === 'contract' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-serif font-black italic text-gray-900 tracking-tight">Standard Mandate</h3>
              <div className="h-64 overflow-y-auto no-scrollbar bg-gray-50 rounded-3xl p-6 text-[11px] leading-relaxed text-gray-600 font-medium space-y-4">
                <p className="font-bold text-gray-900">1. SCOPE OF ARTISTRY</p>
                <p>The Master agrees to deliver high-fidelity photographic assets within 14 business days post-session.</p>
                <p className="font-bold text-gray-900">2. INTELLECTUAL PROPERTY</p>
                <p>Clients are granted a non-exclusive usage license for personal portfolio and social broadcasting.</p>
                <p className="font-bold text-gray-900">3. CANCELLATION DISPATCH</p>
                <p>Termination of session must occur 48 hours prior to call time for full credit retrieval.</p>
              </div>
              <button className="w-full bg-gray-900 text-gray-200 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                Download PDF
              </button>
            </div>
          )}

          {activePopup === 'gallery' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif font-black italic text-gray-900 tracking-tight">Final Assets</h3>
                <span className="px-3 py-1 bg-brand-DEFAULT/10 text-brand-DEFAULT rounded-full text-[9px] font-black uppercase tracking-widest">Delivered</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative group">
                    <img src={`https://picsum.photos/seed/gallery${i}/400/400`} alt="" className="w-full h-full object-cover" />
                    <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icons.Check className="text-white" size={24} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                Download Full Album
              </button>
            </div>
          )}

          {activePopup === 'reschedule' && (
            <div className="space-y-6 text-center">
              <h3 className="text-2xl font-serif font-black italic text-gray-900 tracking-tight">Modify Session</h3>
              <p className="text-xs text-gray-500 font-medium">Please select your new preferred dispatch window.</p>
              <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                <div className="relative">
                  <Icons.Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 z-10" size={18} />
                  <input type="date" className="w-full bg-white border border-gray-200 p-4 pl-12 rounded-2xl font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" />
                </div>
                <div className="relative">
                  <Icons.Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 z-10" size={18} />
                  <input type="time" className="w-full bg-white border border-gray-200 p-4 pl-12 rounded-2xl font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" />
                </div>
              </div>
              <button onClick={() => setActivePopup(null)} className="w-full bg-gray-900 text-gray-200 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                Request Change
              </button>
            </div>
          )}

          {activePopup === 'cancel-warning' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-serif font-black italic text-gray-900 tracking-tight">Abort Session?</h3>
              <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed">This action cannot be undone. Cancellation fees may apply within 48h of call time.</p>
              <div className="flex space-x-3 pt-4">
                  <button onClick={() => setActivePopup(null)} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors">Keep</button>
                  <button onClick={handleCancelSession} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">Confirm</button>
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
            layoutId="tab-highlight" className="absolute inset-y-1.5 bg-white rounded-xl shadow-sm z-0"
            style={{ width: 'calc(50% - 6px)', left: activeTab === 'upcoming' ? '6px' : '50%' }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />
          <button onClick={() => setActiveTab('upcoming')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] relative z-10 transition-colors ${activeTab === 'upcoming' ? 'text-gray-900' : 'text-gray-500'}`}>Upcoming</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] relative z-10 transition-colors ${activeTab === 'history' ? 'text-gray-900' : 'text-gray-500'}`}>Archive</button>
        </div>
      </header>

      <div className="px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {displayBookings.length > 0 ? (
              displayBookings.map((booking, idx) => (
                <motion.div key={booking.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-black/5 border border-gray-100 group">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <img src={booking.photographerImage} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md" />
                        <div>
                          <h3 className="font-serif font-bold text-xl text-gray-900 leading-tight group-hover:text-brand-DEFAULT transition-colors italic">{booking.photographerName}</h3>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mt-0.5">{booking.category} Session</p>
                        </div>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>

                    <div className="bg-gray-50/80 rounded-2xl p-4 flex justify-between items-center mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Icons.Calendar size={14} strokeWidth={1.5} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">{new Date(booking.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Icons.MapPin size={14} strokeWidth={1.5} />
                          <span className="text-[11px] font-medium">Studio C, Accra Central</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-serif font-black text-gray-900 italic">₵{booking.amount}</p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      {booking.status === 'CONFIRMED' || booking.status === 'PENDING' ? (
                        <>
                          <button onClick={() => onOpenChat?.(booking.photographerId)} className="flex-1 bg-gray-900 text-gray-200 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all">Message</button>
                          <button onClick={() => setManagingBooking(booking)} className="flex-1 border border-gray-200 text-gray-700 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all">Manage</button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => booking.status === 'COMPLETED' ? setActivePopup('gallery') : onTabChange?.('explore')} 
                            className="flex-1 bg-gray-900 text-gray-200 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all shadow-md"
                          >
                             {booking.status === 'COMPLETED' ? 'View Gallery' : 'Book Again'}
                          </button>
                          {booking.status === 'COMPLETED' ? (
                             <button onClick={() => setReviewingBooking(booking.id)} className="flex-1 bg-white border border-gray-200 text-gray-900 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all">Rate Session</button>
                          ) : (
                            <button onClick={() => setManagingBooking(booking)} className="flex-1 border border-gray-200 text-gray-700 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all">Manage</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-16 px-6 bg-white rounded-[44px] shadow-2xl shadow-black/5 border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-brand-DEFAULT/5 rounded-full blur-3xl" />
                <div className="relative mb-8">
                  <div className="flex justify-center -space-x-4 mb-4">
                    <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm z-10"><Icons.Camera size={28} className="text-gray-300" /></motion.div>
                    <motion.div animate={{ rotate: [5, -5, 5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="w-16 h-16 bg-brand-DEFAULT/10 rounded-2xl flex items-center justify-center border border-brand-DEFAULT/20 shadow-sm"><Icons.Sparkles size={28} className="text-brand-DEFAULT" /></motion.div>
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-black text-gray-900 italic tracking-tight mb-2">No Artistic Schedule</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-[240px] mx-auto">Your timeline is a blank canvas. Start your next cinematic journey today.</p>
                <button onClick={() => onTabChange?.('explore')} className="bg-gray-900 text-gray-200 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all">Explore Masters</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {managingBooking && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManagingBooking(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                    <div className="mb-8"><h3 className="text-2xl font-serif font-black text-gray-900 italic leading-none">Manage Session</h3><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Reference: {managingBooking.id}</p></div>
                    <div className="space-y-3">
                        {(managingBooking.status === 'CONFIRMED' || managingBooking.status === 'COMPLETED') && (
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <button onClick={() => setActivePopup('invoice')} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                <Icons.Check size={18} className="text-gray-900" />
                                <span className="font-bold text-[10px] uppercase tracking-widest text-gray-900">Invoice</span>
                            </button>
                            <button onClick={() => setActivePopup('contract')} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                <Icons.ShieldCheck size={18} className="text-gray-900" />
                                <span className="font-bold text-[10px] uppercase tracking-widest text-gray-900">Contract</span>
                            </button>
                          </div>
                        )}
                        <button onClick={() => setActivePopup('reschedule')} className="w-full flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center space-x-4"><div className="p-3 bg-white rounded-xl text-gray-900 shadow-sm"><Icons.Calendar size={20} /></div><span className="font-bold text-sm uppercase tracking-wider text-gray-900">Reschedule</span></div>
                            <Icons.ChevronRight size={16} className="text-gray-400" />
                        </button>
                        {(managingBooking.status === 'CONFIRMED' || managingBooking.status === 'PENDING') && (
                            <button onClick={() => setActivePopup('cancel-warning')} className="w-full flex items-center justify-between p-5 bg-red-50/50 rounded-2xl border border-red-100 hover:bg-red-50 transition-colors group">
                                <div className="flex items-center space-x-4"><div className="p-3 bg-white rounded-xl text-red-500 shadow-sm"><Icons.X size={20} /></div><span className="font-bold text-sm uppercase tracking-wider text-red-600">Cancel Session</span></div>
                                <Icons.ChevronRight size={16} className="text-red-300" />
                            </button>
                        )}
                    </div>
                    <button onClick={() => setManagingBooking(null)} className="w-full mt-8 py-4 text-gray-400 text-xs font-bold uppercase tracking-widest">Dismiss</button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>{activePopup && renderPopup()}</AnimatePresence>

      <AnimatePresence>
        {reviewingBooking && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReviewingBooking(null)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-[400px] bg-white rounded-[44px] p-8 shadow-2xl z-20">
              <h3 className="text-2xl font-serif font-black text-gray-900 italic mb-2 tracking-tight">Share Experience</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-8">
                 <div className="flex justify-center space-x-2">{[1,2,3,4,5].map(star => (<button key={star} type="button" onClick={() => setReviewRating(star)} className="p-1"><Icons.Star size={32} className={star <= reviewRating ? "text-yellow-500 fill-current" : "text-gray-200"} /></button>))}</div>
                 <textarea required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Describe the mastery..." className="w-full bg-gray-50 border border-gray-100 p-5 rounded-2xl text-sm font-medium h-32 outline-none resize-none focus:ring-2 focus:ring-brand-DEFAULT/10" />
                 <div className="flex space-x-3 pt-4"><button type="button" onClick={() => setReviewingBooking(null)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400">Dismiss</button><button type="submit" className="flex-1 bg-gray-900 text-gray-200 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Post Review</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'COMPLETED': return 'bg-gray-50 text-gray-600 border-gray-100';
      default: return 'bg-red-50 text-red-600 border-red-100';
    }
  };
  return (<span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStyles()}`}>{status}</span>);
};

export default Bookings;