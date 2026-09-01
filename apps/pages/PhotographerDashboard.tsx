import React, { useState } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotographerDashboardProps {
  kycStatus?: 'pending' | 'submitted' | 'verified';
  onGeminiClick?: () => void;
}

const PhotographerDashboard: React.FC<PhotographerDashboardProps> = ({ kycStatus, onGeminiClick }) => {
  const [selectedLedgerItem, setSelectedLedgerItem] = useState<any | null>(null);

  const handleNavigate = () => {
    window.open('https://maps.google.com', '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:+233555555555';
  };

  const ledgerItems = [
      { id: 1, type: 'income', title: 'Payment Received', subtitle: 'Wedding Deposit', time: '2 hours ago', amount: 1500, status: 'Completed' },
      { id: 2, type: 'inquiry', title: 'New Inquiry', subtitle: 'Fashion Shoot', time: '4 hours ago', amount: null, status: 'Pending' },
      { id: 3, type: 'expense', title: 'Studio Rent', subtitle: 'Monthly Debit', time: 'Yesterday', amount: -800, status: 'Paid' },
  ];

  return (
    <div className="pb-32 bg-gray-50/50 min-h-screen relative">
      <header className="relative pt-16 pb-10 px-6">
        <div className="flex justify-between items-center mb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-2">Studio Command</p>
             <h1 className="text-3xl font-serif font-black text-gray-900 tracking-tight leading-none italic">
               Welcome Back, <br />
               <span className="text-brand-DEFAULT not-italic">Master Kojo</span>
             </h1>
          </motion.div>
          <div className="w-12 h-12 rounded-2xl bg-gray-100 p-0.5 shadow-xl overflow-hidden border border-gray-200">
             <img src="https://picsum.photos/seed/photographer/200/200" alt="Profile" className="w-full h-full object-cover rounded-[14px]" />
          </div>
        </div>
        
        {/* Verification Status Banner */}
        {kycStatus === 'submitted' && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center space-x-3"
            >
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                    <Icons.Clock size={16} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-900">Verification Pending</p>
                    <p className="text-[9px] text-gray-500 font-medium leading-tight mt-0.5">Some features are restricted until review is complete.</p>
                </div>
            </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-gray-900 p-5 rounded-[32px] text-gray-200 shadow-xl shadow-gray-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-light/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
                <div className="relative z-10">
                    <Icons.Briefcase className="text-brand-light mb-3" size={24} />
                    <p className="text-3xl font-serif font-black italic">₵4.2k</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">April Revenue</p>
                </div>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
                <Icons.Star className="text-yellow-500 mb-3" size={24} fill="currentColor" />
                <p className="text-3xl font-serif font-black italic text-gray-900">4.9</p>
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
            <div className="bg-gray-50 rounded-[36px] p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-DEFAULT/5 rounded-full blur-3xl group-hover:bg-brand-DEFAULT/10 transition-colors"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex -space-x-2">
                           <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                             <img src="https://picsum.photos/seed/client1/100/100" alt="" />
                           </div>
                           <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-900 text-gray-200 flex items-center justify-center text-[10px] font-bold">+2</div>
                        </div>
                        <div className="bg-brand-DEFAULT text-black px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                            In 2 Hours
                        </div>
                    </div>
                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-1">The Mensah Wedding</h3>
                    <p className="text-xs text-gray-500 font-medium mb-6">Full Day Coverage • Kempinski Gold Coast</p>
                    
                    <div className="flex gap-3">
                        <button onClick={handleNavigate} className="flex-1 bg-gray-900 text-gray-200 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-gray-800 shadow-lg">
                            <Icons.MapPin size={14} /> <span>Navigate</span>
                        </button>
                        <button onClick={handleCall} className="w-14 flex items-center justify-center bg-white border border-gray-200 rounded-2xl text-gray-900 active:scale-95 transition-all hover:bg-gray-50 shadow-sm">
                            <Icons.Phone size={20} />
                        </button>
                    </div>
                </div>
            </div>
         </motion.div>
      </section>

      {/* Recent Activity */}
      <section className="px-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 ml-1">Studio Ledger</h2>
        <div className="space-y-4">
            {ledgerItems.map((item, i) => (
                <motion.div 
                    key={item.id}
                    onClick={() => setSelectedLedgerItem(item)}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    className="flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors cursor-pointer"
                >
                    <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : item.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                            {item.type === 'income' && <Icons.Check size={20} />}
                            {item.type === 'expense' && <Icons.ArrowRight className="-rotate-45" size={20} />}
                            {item.type === 'inquiry' && <Icons.Bell size={20} />}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{item.title}</p>
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{item.subtitle} • {item.time}</p>
                        </div>
                    </div>
                    {item.amount ? (
                        <span className={`text-sm font-black ${item.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {item.amount > 0 ? '+' : ''}₵{Math.abs(item.amount)}
                        </span>
                    ) : (
                        <Icons.ChevronRight size={16} className="text-gray-300" />
                    )}
                </motion.div>
            ))}
        </div>
      </section>

      {/* AI Concierge FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onGeminiClick}
        className="fixed bottom-32 right-6 w-14 h-14 bg-gray-900 text-gray-200 rounded-full shadow-2xl flex items-center justify-center z-50 border-2 border-brand-DEFAULT/30"
      >
        <Icons.Sparkles size={24} className="text-brand-light" />
      </motion.button>

      {/* Ledger Modal */}
      <AnimatePresence>
        {selectedLedgerItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setSelectedLedgerItem(null)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-[320px] bg-white rounded-[40px] p-8 shadow-2xl text-center"
                >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${selectedLedgerItem.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-900'}`}>
                        {selectedLedgerItem.type === 'income' ? <Icons.DollarSign size={32} /> : <Icons.FileText size={32} />}
                    </div>
                    <h3 className="text-xl font-serif font-black italic text-gray-900 mb-1">{selectedLedgerItem.title}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">{selectedLedgerItem.subtitle}</p>
                    
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-gray-500">Status</span>
                            <span className="text-gray-900">{selectedLedgerItem.status}</span>
                        </div>
                        {selectedLedgerItem.amount && (
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-gray-500">Amount</span>
                                <span className="text-gray-900">₵{Math.abs(selectedLedgerItem.amount).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-gray-500">Date</span>
                            <span className="text-gray-900">Today</span>
                        </div>
                    </div>

                    <button onClick={() => setSelectedLedgerItem(null)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                        Close Details
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographerDashboard;