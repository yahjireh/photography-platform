import React, { useState } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Request {
  id: string;
  clientName: string;
  clientImage: string;
  type: string;
  date: string;
  amount: number;
  location: string;
}

const MOCK_REQUESTS: Request[] = [
  { id: '1', clientName: 'Sarah Osei', clientImage: 'https://picsum.photos/seed/req1/100/100', type: 'Portrait', date: 'May 12, 2026', amount: 450, location: 'Labadi Beach' },
  { id: '2', clientName: 'TechCorp Ghana', clientImage: 'https://picsum.photos/seed/req2/100/100', type: 'Corporate', date: 'May 15, 2026', amount: 2500, location: 'Airport City' },
  { id: '3', clientName: 'Kofi & Ama', clientImage: 'https://picsum.photos/seed/req3/100/100', type: 'Wedding', date: 'June 02, 2026', amount: 8000, location: 'Aburi Gardens' },
];

const PhotographerRequests: React.FC = () => {
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const handleAction = (id: string, action: 'accept' | 'decline') => {
    setRequests(prev => prev.filter(r => r.id !== id));
    setSelectedRequest(null);
  };

  return (
    <div className="pb-32 bg-gray-50/50 min-h-screen">
      <header className="pt-16 pb-8 px-6 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex justify-between items-end">
             <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-DEFAULT mb-2">Opportunities</p>
                <h1 className="text-4xl font-serif font-black text-gray-900 tracking-tight italic leading-none">
                    Booking <span className="not-italic text-gray-300">/</span><br />Requests
                </h1>
             </div>
             <div className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xl">
                 {requests.length}
             </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <AnimatePresence>
            {requests.length > 0 ? (
                requests.map((req, idx) => (
                    <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-[40px] p-2 shadow-xl shadow-black/5 border border-gray-100 cursor-pointer"
                        onClick={() => setSelectedRequest(req)}
                    >
                        <div className="bg-gray-50/50 rounded-[32px] p-6 mb-2 pointer-events-none">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center space-x-3">
                                    <img src={req.clientImage} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{req.clientName}</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{req.type}</p>
                                    </div>
                                </div>
                                <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="font-serif font-black italic text-gray-900">₵{req.amount}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-600 space-x-3">
                                    <Icons.Calendar size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wide">{req.date}</span>
                                </div>
                                <div className="flex items-center text-gray-600 space-x-3">
                                    <Icons.MapPin size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wide">{req.location}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-2 px-2 pb-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'decline'); }}
                                className="flex-1 py-4 rounded-[24px] font-bold text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                                Decline
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'accept'); }}
                                className="flex-1 bg-gray-900 text-white py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
                            >
                                <span>Accept</span>
                                <Icons.Check size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icons.Check size={32} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">All caught up</p>
                </div>
            )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
          {selectedRequest && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRequest(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-6">Request Details</h3>
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                             <img src={selectedRequest.clientImage} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                             <div>
                                 <h4 className="font-bold text-lg text-gray-900">{selectedRequest.clientName}</h4>
                                 <p className="text-xs text-gray-500">Verified Client • 12 Bookings</p>
                             </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                            <div className="flex justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Project Type</span>
                                <span className="text-sm font-bold text-gray-900">{selectedRequest.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Proposed Budget</span>
                                <span className="text-sm font-bold text-brand-DEFAULT">₵{selectedRequest.amount}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Note from Client</p>
                                <p className="text-sm text-gray-600 leading-relaxed">"Looking for a cinematic style for our upcoming event. Love your portfolio!"</p>
                            </div>
                        </div>
                        <div className="flex space-x-3 pt-4">
                            <button onClick={() => handleAction(selectedRequest.id, 'decline')} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-xs uppercase tracking-widest text-gray-500">Decline</button>
                            <button onClick={() => handleAction(selectedRequest.id, 'accept')} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Accept Job</button>
                        </div>
                    </div>
                </motion.div>
            </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographerRequests;