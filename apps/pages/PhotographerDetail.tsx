import React, { useState } from 'react';
import { Photographer, OccasionType, CreateBookingData } from '../types';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_REVIEWS } from '../constants';

interface PhotographerDetailProps {
  photographer: Photographer;
  onBack: () => void;
  onOpenChat: () => void;
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
  const [bookingStep, setBookingStep] = useState<'form' | 'summary'>('form');
  const [isBooked, setIsBooked] = useState(false);
  const [showFullPortfolio, setShowFullPortfolio] = useState(false);
  const [formErrors, setFormErrors] = useState<{ location?: string; dateTime?: string }>({});
  
  const [formData, setFormData] = useState<Partial<CreateBookingData>>({
    occasionType: OccasionType.PORTRAIT,
    eventLocation: '',
    eventDate: new Date(),
    eventStartTime: '12:00',
    eventEndTime: '14:00',
    estimatedHours: 2,
    specialRequirements: ''
  });

  const reviews = MOCK_REVIEWS.filter(r => r.photographerId === photographer.id);

  const calculateHours = (start: string, end: string) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const diff = (eH + eM/60) - (sH + sM/60);
    return diff > 0 ? diff : 1;
  };

  const handleInitialConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { location?: string; dateTime?: string } = {};

    if (!formData.eventLocation?.trim()) {
      errors.location = 'Please enter a valid location';
    }

    const selectedDate = new Date(formData.eventDate!);
    const [hours, minutes] = (formData.eventStartTime || '00:00').split(':').map(Number);
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    if (selectedDateTime < new Date()) {
      errors.dateTime = 'Start time cannot be in the past';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const duration = calculateHours(formData.eventStartTime!, formData.eventEndTime!);
    setFormData(prev => ({ ...prev, estimatedHours: duration }));
    setFormErrors({});
    setBookingStep('summary');
  };

  const handleFinalConfirm = () => {
    setIsBooked(true);
    setIsBookingModalOpen(false);
  };

  if (isBooked) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
          className="w-24 h-24 bg-brand-DEFAULT rounded-3xl flex items-center justify-center text-brand-light mb-8 shadow-2xl shadow-brand-DEFAULT/30"
        >
          <Icons.Check size={48} strokeWidth={3} />
        </motion.div>
        <h2 className="text-3xl font-serif font-black text-gray-900 mb-4 tracking-tight">Request Dispatched</h2>
        <p className="text-gray-500 font-bold leading-relaxed mb-12 uppercase tracking-[0.3em] text-[10px]">Your session brief with {photographer.name} is in review.</p>
        <button onClick={onBack} className="bg-gray-900 text-gray-200 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl shadow-black/10">Return to Studio</button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-32">
      <div className="relative h-80">
        <motion.img initial={{ scale: 1.1 }} animate={{ scale: 1 }} src={photographer.imageUrl} alt={photographer.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
        <button onClick={onBack} className="absolute top-12 left-6 bg-white/50 backdrop-blur-xl p-3 rounded-2xl text-gray-900 border border-white/40 z-20 shadow-xl"><Icons.ChevronLeft size={20} strokeWidth={2.5} /></button>
        <div className="absolute top-12 right-6 flex space-x-3 z-20">
             <button onClick={onToggleFavorite} className={`backdrop-blur-xl p-3 rounded-2xl border transition-all shadow-xl active:scale-90 ${isFavorite ? 'bg-brand-DEFAULT text-brand-light border-brand-light' : 'bg-white/50 text-gray-900 border-white/40 hover:bg-white/80'}`}><Icons.Heart size={20} className={isFavorite ? 'fill-current' : ''} /></button>
             <button onClick={onOpenChat} className="bg-white/50 backdrop-blur-xl p-3 rounded-2xl text-gray-900 border border-white/40 hover:bg-white/80 transition-colors shadow-xl"><Icons.Send size={20} /></button>
        </div>
      </div>

      <div className="relative -mt-10 bg-white rounded-t-[44px] px-8 pt-10 shadow-2xl shadow-black/10">
        <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
                <div className="flex items-center space-x-2"><h1 className="text-3xl font-serif font-black text-gray-900 italic tracking-tighter">{photographer.name}</h1>{photographer.verified && (<div className="bg-brand-DEFAULT p-1.5 rounded-xl text-brand-light shadow-lg shadow-brand-DEFAULT/30"><Icons.ShieldCheck size={16} /></div>)}</div>
                <p className="text-brand-DEFAULT font-black uppercase tracking-[0.3em] text-[10px]">{photographer.category} Curator</p>
            </div>
            <div className="text-right"><p className="text-3xl font-serif font-black text-gray-900 italic tracking-tight">₵{photographer.hourlyRate}</p><p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">/ hour</p></div>
        </div>

        <div className="flex items-center space-x-6 mb-10">
            <div className="flex items-center bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm"><Icons.Star size={14} className="text-yellow-500 fill-current mr-2" /><span className="font-black text-sm text-gray-900">{photographer.rating}</span><span className="text-gray-500 font-bold text-[10px] ml-1 uppercase">({photographer.reviewCount})</span></div>
            <div className="flex items-center text-gray-600"><Icons.MapPin size={16} className="text-brand-DEFAULT mr-2" /><span className="text-[10px] font-bold uppercase tracking-widest">{photographer.location}</span></div>
        </div>

        <div className="mb-12"><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-4">The Artistic Vision</h3><p className="text-gray-700 leading-relaxed text-sm font-medium">{photographer.about}</p></div>

        <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Masterpieces</h3>
                <button 
                  onClick={() => setShowFullPortfolio(true)}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-DEFAULT border-b-2 border-brand-DEFAULT/10 pb-1"
                >
                  Full Portfolio
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {photographer.portfolio.slice(0, 4).map((img, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 0.98 }}
                        onClick={() => setShowFullPortfolio(true)}
                        className="relative h-44 rounded-[32px] overflow-hidden border border-gray-100 shadow-md shadow-black/5 cursor-pointer"
                    >
                        <img 
                            src={img} 
                            alt="Portfolio" 
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                ))}
            </div>
        </div>

        <div className="mb-8 pb-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-6">Client Testimonials</h3>
            <div className="space-y-6">
                {reviews.length > 0 ? reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50/50 p-5 rounded-[32px] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3"><img src={review.userImage} alt="" className="w-10 h-10 rounded-xl object-cover" /><div><p className="text-sm font-bold text-gray-900">{review.userName}</p><p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{review.timestamp}</p></div></div>
                            <div className="flex items-center space-x-1">{[...Array(5)].map((_, i) => (<Icons.Star key={i} size={10} className={i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"} />))}</div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">"{review.comment}"</p>
                    </div>
                )) : (<div className="text-center py-8"><Icons.MessageSquare size={24} className="text-gray-200 mx-auto mb-3" /><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No testimonials yet</p></div>)}
            </div>
        </div>
      </div>

      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBookingModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="relative w-full max-w-[480px] bg-white rounded-t-[44px] p-8 pb-12 shadow-2xl overflow-y-auto no-scrollbar max-h-[92vh]">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-auto mb-10" />
              <AnimatePresence mode="wait">
                {bookingStep === 'form' ? (
                  <motion.div key="form" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <h2 className="text-3xl font-serif font-black italic text-gray-900 mb-2 tracking-tight">Schedule Session</h2>
                    <form onSubmit={handleInitialConfirm} className="space-y-6">
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Occasion Archetype</label>
                        <div className="relative">
                          <Icons.Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 z-10" size={18} />
                          <select className="w-full bg-gray-50 border border-gray-100 p-5 pl-12 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-900 outline-none" value={formData.occasionType} onChange={(e) => setFormData({...formData, occasionType: e.target.value as OccasionType})}>
                            {Object.values(OccasionType).map(type => (<option key={type} value={type}>{type}</option>))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Event Domain</label>
                        <div className="relative">
                          <Icons.MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 z-10" size={18} />
                          <input type="text" required placeholder="Enter studio address..." className={`w-full bg-gray-50 border ${formErrors.location ? 'border-red-400' : 'border-gray-100'} p-5 pl-12 rounded-2xl text-sm font-bold text-gray-900 outline-none`} value={formData.eventLocation} onChange={(e) => setFormData({...formData, eventLocation: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Date</label>
                          <div className="relative">
                            <Icons.Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 z-10" size={18} />
                            <input type="date" required value={formData.eventDate?.toISOString().split('T')[0]} onChange={(e) => setFormData({...formData, eventDate: new Date(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 p-5 pl-12 rounded-2xl text-sm font-bold text-gray-900 outline-none" />
                          </div>
                        </div>
                        <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Call Time</label>
                          <div className="relative">
                            <Icons.Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 z-10" size={18} />
                            <input type="time" required className="w-full bg-gray-50 border border-gray-100 p-5 pl-12 rounded-2xl text-sm font-bold text-gray-900 outline-none" value={formData.eventStartTime} onChange={(e) => setFormData({...formData, eventStartTime: e.target.value})} />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Wrap Time</label>
                        <div className="relative">
                          <Icons.Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 z-10" size={18} />
                          <input type="time" required className="w-full bg-gray-50 border border-gray-100 p-5 pl-12 rounded-2xl text-sm font-bold text-gray-900 outline-none" value={formData.eventEndTime} onChange={(e) => setFormData({...formData, eventEndTime: e.target.value})} />
                        </div>
                      </div>
                      <div className="bg-gray-900 p-6 rounded-3xl flex justify-between items-center shadow-2xl">
                        <div><p className="text-3xl font-serif font-black italic text-gray-200">Review Session</p></div>
                        <button type="submit" className="bg-brand-DEFAULT text-brand-light px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 flex items-center space-x-2">
                          <span>Next</span>
                          <Icons.ArrowRight size={16} />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div key="summary" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                    <div className="flex justify-between items-start"><div><h2 className="text-3xl font-serif font-black italic text-gray-900 mb-1 tracking-tight">Session Ledger</h2><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Review Reservation Brief</p></div><button onClick={() => setBookingStep('form')} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-colors"><Icons.ArrowLeft size={20} strokeWidth={2.5} /></button></div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-[32px] p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Occasion</p><p className="text-sm font-bold text-gray-900">{formData.occasionType}</p></div>
                        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Timeline</p><p className="text-sm font-bold text-gray-900">{formData.eventStartTime} - {formData.eventEndTime}</p></div>
                        <div className="col-span-2"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Location</p><p className="text-sm font-bold text-gray-900">{formData.eventLocation}</p></div>
                        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Date</p><p className="text-sm font-bold text-gray-900">{formData.eventDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p></div>
                        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Duration</p><p className="text-sm font-bold text-gray-900">~{formData.estimatedHours?.toFixed(1)} Hours</p></div>
                      </div>
                      <div className="pt-6 border-t border-gray-100 flex justify-between items-center"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900">Investment</span><span className="text-2xl font-serif font-black italic text-brand-DEFAULT">₵{(photographer.hourlyRate * (formData.estimatedHours || 1)).toFixed(0)}</span></div>
                    </div>
                    <button onClick={handleFinalConfirm} className="w-full bg-gray-900 text-gray-200 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] active:scale-95 flex items-center justify-center space-x-3"><span>Authorize Session</span><Icons.Check size={20} /></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullPortfolio && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFullPortfolio(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full p-8 overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-serif font-black italic text-gray-200">The Portfolio</h3>
                <button onClick={() => setShowFullPortfolio(false)} className="p-3 bg-white/10 rounded-2xl text-gray-200"><Icons.X size={24} /></button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {photographer.portfolio.map((img, idx) => (
                  <img key={idx} src={img} alt="" className="w-full rounded-[40px] shadow-2xl border border-white/5" />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 pb-12 bg-white/90 backdrop-blur-2xl border-t border-gray-100 z-50 flex space-x-4 shadow-2xl">
        <button onClick={() => { setFormErrors({}); setBookingStep('form'); setIsBookingModalOpen(true); }} className="flex-1 py-5 rounded-3xl font-serif font-black italic text-xl shadow-2xl transition-all flex items-center justify-center space-x-3 active:scale-[0.98] bg-gray-900 text-gray-200 hover:bg-brand-DEFAULT shadow-black/20"><span>Reserve Now</span><Icons.ArrowRight size={22} className="not-italic" /></button>
        <button onClick={onOpenChat} className="w-16 h-16 bg-gray-50 border border-gray-200 flex items-center justify-center rounded-3xl text-gray-900 shadow-md active:scale-95 hover:bg-gray-100"><Icons.MessageSquare size={26} strokeWidth={2.5} /></button>
      </div>
    </div>
  );
};

export default PhotographerDetail;