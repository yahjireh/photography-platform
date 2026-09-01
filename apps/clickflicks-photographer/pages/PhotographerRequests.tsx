import React, { useState } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotographerBookings } from '../hooks/usePhotographerBookings';
import { Booking } from '../types';

interface PhotographerRequestsProps {
  onOpenChat?: (clientId: string, bookingId?: string) => void;
}

const PhotographerRequests: React.FC<PhotographerRequestsProps> = ({ onOpenChat }) => {
  const { bookings, acceptBooking, rejectBooking, refetch, isLoading } = usePhotographerBookings();
  const [selectedRequest, setSelectedRequest] = useState<Booking | null>(null);
  const [acceptingRequest, setAcceptingRequest] = useState<Booking | null>(null);
  const [promisedTurnaroundDays, setPromisedTurnaroundDays] = useState<number>(7);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingType, setProcessingType] = useState<'accept' | 'decline' | null>(null);
  const [actionStatuses, setActionStatuses] = useState<Record<string, 'accepted' | 'declined'>>({});

  // Display all pending requests plus any card currently undergoing the full-card animation
  const pendingRequests = bookings.filter(b => {
    const s = String(b.status).toLowerCase();
    return s === 'pending' || !!actionStatuses[b.id];
  });

  const handleAction = async (id: string, status: 'accepted' | 'declined', deliveryDays?: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProcessingId(id);
    setProcessingType(status);

    try {
      if (status === 'accepted') {
        await acceptBooking(id, deliveryDays || promisedTurnaroundDays);
        setActionStatuses(prev => ({ ...prev, [id]: 'accepted' }));
        setAcceptingRequest(null);
      } else {
        await rejectBooking(id, 'Declined by photographer');
        setActionStatuses(prev => ({ ...prev, [id]: 'declined' }));
      }

      // Allow full-card animation to play for 1.4s, then remove card and close modal
      setTimeout(async () => {
        setActionStatuses(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        if (selectedRequest?.id === id) {
          setSelectedRequest(null);
        }
        await refetch();
      }, 1400);
    } catch (err) {
      console.error('Request action error:', err);
    } finally {
      setProcessingId(null);
      setProcessingType(null);
    }
  };

  return (
    <div className="pb-32 bg-gray-50/50 min-h-screen">
      <header className="pt-16 pb-8 px-6 bg-white border-b border-gray-100">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-DEFAULT mb-2">Inbound Briefs</p>
          <h1 className="text-3xl font-serif font-black text-gray-900 tracking-tight leading-none italic">
            Client Requests
          </h1>
        </motion.div>
      </header>

      <div className="p-6 space-y-4">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
            <Icons.CheckCircle size={40} className="text-brand-DEFAULT mx-auto mb-3" />
            <h3 className="font-serif font-black text-xl text-gray-900 mb-1">All Briefs Reviewed</h3>
            <p className="text-xs text-gray-500 font-medium">New client shoot requests will appear here in real-time.</p>
          </div>
        ) : (
          <AnimatePresence>
            {pendingRequests.map((req) => {
              const isProcessing = processingId === req.id;
              const statusAction = actionStatuses[req.id];
              const clientInitials = req.clientName 
                ? req.clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                : 'CL';

              return (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.35 }}
                  onClick={() => !statusAction && setSelectedRequest(req)}
                  className={`bg-white rounded-[32px] p-6 border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                    statusAction === 'accepted' 
                      ? 'border-emerald-400 bg-emerald-50/30 ring-2 ring-emerald-400/20'
                      : statusAction === 'declined'
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-gray-100 hover:border-gray-200 hover:shadow-md active:scale-[0.99]'
                  }`}
                >
                  {/* Action Banner Full-Card Animation */}
                  {statusAction && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`absolute inset-0 z-20 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center ${
                        statusAction === 'accepted' ? 'bg-emerald-950/90 text-white' : 'bg-red-950/90 text-white'
                      }`}
                    >
                      {statusAction === 'accepted' ? (
                        <>
                          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20">
                            <Icons.Check size={28} strokeWidth={3} />
                          </div>
                          <h4 className="font-serif font-black text-2xl italic text-emerald-300">Brief Accepted</h4>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-100 mt-1">
                            Added to Schedule & Imminent Sessions
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center text-red-400 mb-3 shadow-lg shadow-red-500/20">
                            <Icons.X size={28} strokeWidth={3} />
                          </div>
                          <h4 className="font-serif font-black text-2xl italic text-red-300">Brief Declined</h4>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-red-100 mt-1">
                            Client has been notified
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      {req.clientAvatar ? (
                        <img src={req.clientAvatar} alt="" className="w-12 h-12 rounded-2xl object-cover border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700">
                          {clientInitials}
                        </div>
                      )}
                      <div>
                        <h3 className="font-serif font-bold text-lg text-gray-900 leading-tight">{req.clientName || 'Private Client'}</h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-DEFAULT">{req.service}</span>
                      </div>
                    </div>
                    <span className="font-serif font-black italic text-xl text-gray-900">₵{req.price || req.amount || 0}</span>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 space-x-2">
                      <Icons.Calendar size={14} className="text-gray-400" />
                      <span className="text-xs font-bold">{req.date} {req.daysCount && req.daysCount > 1 ? `(${req.daysCount} Days Multi-Session)` : ''}</span>
                    </div>
                    <div className="flex items-center text-gray-600 space-x-2">
                      <Icons.Clock size={14} className="text-gray-400" />
                      <span className="text-xs font-medium">{req.time} ({req.estimatedHours || 2} hrs total)</span>
                    </div>
                    <div className="flex items-center text-gray-600 space-x-2">
                      <Icons.MapPin size={14} className="text-brand-DEFAULT" />
                      <span className="text-xs font-medium truncate">{req.location}</span>
                    </div>
                  </div>

                  {req.specialRequirements && (
                    <p className="text-[11px] text-gray-500 italic mb-4 line-clamp-2 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                      "{req.specialRequirements}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat?.(req.clientId || req.photographerId, req.id);
                      }}
                      className="px-3.5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1"
                    >
                      <Icons.MessageSquare size={13} />
                      <span>Chat / Negotiate</span>
                    </button>

                    <button
                      onClick={(e) => handleAction(req.id, 'declined', undefined, e)}
                      disabled={isProcessing}
                      className="px-4 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 hover:bg-gray-200"
                    >
                      {isProcessing && processingType === 'decline' ? (
                        <Icons.Loader2 size={14} className="animate-spin text-gray-600" />
                      ) : (
                        <span>Decline</span>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAcceptingRequest(req);
                      }}
                      disabled={isProcessing}
                      className="flex-1 py-3.5 bg-gray-900 text-gray-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-gray-900/10 flex items-center justify-center space-x-1.5 disabled:opacity-50 hover:bg-brand-DEFAULT hover:text-black"
                    >
                      {isProcessing && processingType === 'accept' ? (
                        <Icons.Loader2 size={14} className="animate-spin text-brand-light" />
                      ) : (
                        <>
                          <Icons.Check size={14} />
                          <span>Accept Brief</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Promised Turnaround Modal upon Acceptance */}
      <AnimatePresence>
        {acceptingRequest && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setAcceptingRequest(null)} 
              className="absolute inset-0 bg-black/70 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-DEFAULT">Turnaround Promise</span>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mt-1">
                    Promised Delivery Time
                  </h3>
                </div>
                <button onClick={() => setAcceptingRequest(null)} className="p-2 text-gray-400">
                  <Icons.X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Specify the maximum turnaround time for {acceptingRequest.clientName}. Photos must be delivered within 7 days maximum (up to 30 days for video/nuptials).
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { days: 3, label: '⚡ 3 Days', sub: 'Express Turnaround' },
                    { days: 7, label: '✨ 7 Days', sub: 'Standard Photo Delivery' },
                    { days: 14, label: '📅 14 Days', sub: 'High Volume Session' },
                    { days: 28, label: '🎬 28 Days', sub: 'Video & Grand Nuptials' }
                  ].map((option) => (
                    <div
                      key={option.days}
                      onClick={() => setPromisedTurnaroundDays(option.days)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        promisedTurnaroundDays === option.days
                          ? 'bg-brand-DEFAULT/10 border-brand-DEFAULT ring-2 ring-brand-DEFAULT/30'
                          : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="font-serif font-black text-base text-gray-900 italic block">{option.label}</span>
                      <span className="text-[9px] font-bold uppercase text-gray-400 mt-0.5 block">{option.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-brand-DEFAULT/5 border border-brand-DEFAULT/20 rounded-2xl mb-6">
                <p className="text-[10px] text-gray-600 font-medium">
                  🔒 Upon accepting, client will be notified to deposit 40% (₵{Math.round((Number(acceptingRequest.price || acceptingRequest.amount || 0)) * 0.4)}) into platform escrow.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setAcceptingRequest(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(acceptingRequest.id, 'accepted', promisedTurnaroundDays)}
                  className="flex-1 py-4 bg-gray-900 text-brand-light hover:bg-brand-DEFAULT hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2"
                >
                  <Icons.Check size={16} />
                  <span>Confirm & Accept ({promisedTurnaroundDays}d)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Request Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedRequest(null)} 
              className="absolute inset-0 bg-black/70 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-DEFAULT">Brief Specification</span>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mt-1">
                    {selectedRequest.service}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Proposed Budget</span>
                  <span className="font-serif font-black text-2xl text-gray-900 italic">₵{selectedRequest.price || selectedRequest.amount || 0}</span>
                </div>
              </div>

              {/* Client Profile Card */}
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between mb-6 border border-gray-100">
                <div className="flex items-center space-x-3">
                  {selectedRequest.clientAvatar ? (
                    <img src={selectedRequest.clientAvatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-700">
                      {selectedRequest.clientName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{selectedRequest.clientName}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Verified Marketplace Client</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const cId = selectedRequest.clientId || selectedRequest.photographerId;
                    setSelectedRequest(null);
                    onOpenChat?.(cId, selectedRequest.id);
                  }}
                  className="p-3 bg-brand-DEFAULT/10 hover:bg-brand-DEFAULT text-black rounded-xl text-xs font-bold transition-colors"
                >
                  <Icons.MessageSquare size={16} />
                </button>
              </div>

              {/* Session Specification Table */}
              <div className="space-y-3 mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Date</span>
                  <span className="font-bold text-gray-900">{selectedRequest.date}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Call Time</span>
                  <span className="font-bold text-gray-900">{selectedRequest.time}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Estimated Duration</span>
                  <span className="font-bold text-gray-900">{selectedRequest.estimatedHours || 2} Hours</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Location</span>
                  <span className="font-bold text-gray-900 max-w-[220px] text-right truncate">{selectedRequest.location}</span>
                </div>
              </div>

              {/* Client Brief Notes */}
              {selectedRequest.specialRequirements && (
                <div className="mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Artistic Direction / Notes</span>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-medium text-gray-700 leading-relaxed">
                    {selectedRequest.specialRequirements}
                  </div>
                </div>
              )}

              {/* Escrow Settlement Terms */}
              <div className="p-4 bg-brand-DEFAULT/5 border border-brand-DEFAULT/20 rounded-2xl mb-8">
                <div className="flex items-center space-x-2 text-brand-DEFAULT mb-1">
                  <Icons.ShieldCheck size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Escrow Protected</span>
                </div>
                <p className="text-[10px] text-gray-600 font-medium">
                  40% deposit is held in platform escrow upon acceptance and released upon session check-in.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleAction(selectedRequest.id, 'declined')}
                  disabled={processingId === selectedRequest.id}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  {processingId === selectedRequest.id && processingType === 'decline' ? (
                    <Icons.Loader2 size={16} className="animate-spin text-gray-600" />
                  ) : (
                    <span>Decline Brief</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    const req = selectedRequest;
                    setSelectedRequest(null);
                    setAcceptingRequest(req);
                  }}
                  disabled={processingId === selectedRequest.id}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-xl flex items-center justify-center space-x-2 hover:bg-brand-DEFAULT hover:text-black"
                >
                  {processingId === selectedRequest.id && processingType === 'accept' ? (
                    <Icons.Loader2 size={16} className="animate-spin text-brand-light" />
                  ) : (
                    <>
                      <Icons.Check size={16} />
                      <span>Accept Brief</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographerRequests;
