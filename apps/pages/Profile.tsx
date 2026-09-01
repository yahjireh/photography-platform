import React, { useState } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PHOTOGRAPHERS } from '../constants';

type VaultSubPage = 'main' | 'persona' | 'billing' | 'collection' | 'comms' | 'security';
type TopUpStep = 'idle' | 'source' | 'waiting' | 'success';

interface ProfileProps {
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onViewPhotographer?: (id: string) => void;
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ favorites = [], onToggleFavorite, onViewPhotographer, onLogout }) => {
  const [subPage, setSubPage] = useState<VaultSubPage>('main');
  
  // Billing States
  const [balance, setBalance] = useState(0.0);
  const [topUpStep, setTopUpStep] = useState<TopUpStep>('idle');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'visa', last4: '4242', exp: '12/26', label: 'VISA •••• 4242' },
    { id: 2, type: 'momo', last4: '2345', exp: '', label: 'MTN MoMo •••• 2345' }
  ]);
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [paymentType, setPaymentType] = useState<'card' | 'momo'>('card');

  // Persona States
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [personaSaved, setPersonaSaved] = useState(false);

  // Security States
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activePopup, setActivePopup] = useState<'delete-account' | 'sessions' | null>(null);
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'iPhone 15 Pro', location: 'Accra, GH', current: true },
    { id: 2, device: 'MacBook Pro', location: 'Kumasi, GH', current: false }
  ]);

  // Comms Preferences
  const [preferences, setPreferences] = useState({
    push: true,
    asset: true,
    email: false,
    sms: true
  });
  const [systemTone, setSystemTone] = useState<'cinematic' | 'standard'>('cinematic');

  const favoritePhotographers = MOCK_PHOTOGRAPHERS.filter(p => favorites.includes(p.id));

  const handleTopUpClick = () => {
    setTopUpStep('source');
  };

  const handleSourceSelect = (sourceId: number) => {
    setTopUpStep('waiting');
  };

  const handlePaymentApproved = () => {
    setTopUpStep('success');
    setBalance(prev => prev + 500);
    setTimeout(() => {
      setTopUpStep('idle');
    }, 2500);
  };

  const handleSavePersona = () => {
    setIsSavingPersona(true);
    setTimeout(() => {
      setIsSavingPersona(false);
      setPersonaSaved(true);
      setTimeout(() => setPersonaSaved(false), 2000);
    }, 1500);
  };

  const handleUpdateAuth = () => {
    setIsUpdatingAuth(true);
    setTimeout(() => {
      setIsUpdatingAuth(false);
      setCurrentPassword('');
      setNewPassword('');
    }, 1500);
  };

  const handleDeleteAccount = () => {
    setActivePopup(null);
    onLogout?.();
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRemovePaymentMethod = (id: number) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
  };

  const handleAddPayment = () => {
    // Logic to add payment would go here
    if (paymentType === 'momo') {
        const newMethod = { id: Date.now(), type: 'momo', last4: mobileMoneyNumber.slice(-4), exp: '', label: `MoMo •••• ${mobileMoneyNumber.slice(-4)}` };
        setPaymentMethods(prev => [...prev, newMethod]);
    } else {
        const newMethod = { id: Date.now(), type: 'visa', last4: '8888', exp: '10/28', label: 'VISA •••• 8888' };
        setPaymentMethods(prev => [...prev, newMethod]);
    }
    setShowAddPayment(false);
  };

  const handleRevokeSession = (id: number) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
  };

  const renderHeader = (title: string, subtitle: string) => (
    <header className="pt-16 pb-8 px-6 bg-white border-b border-gray-100 flex items-center space-x-4 sticky top-0 z-50">
      <button 
        onClick={() => setSubPage('main')} 
        className="p-3 bg-gray-50 rounded-2xl text-gray-900 active:scale-90 transition-transform"
      >
        <Icons.ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <div>
        <h1 className="text-2xl font-serif font-black text-gray-900 italic leading-none">{title}</h1>
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mt-1">{subtitle}</p>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-white pb-32">
      <AnimatePresence mode="wait">
        {subPage === 'main' && (
          <motion.div 
            key="main"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="bg-gray-950 min-h-screen"
          >
            <div className="relative pt-20 pb-16 px-6 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-brand-DEFAULT/20 blur-[100px] pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-28 h-28 rounded-3xl bg-gradient-to-br from-brand-light via-brand-DEFAULT to-brand-dark p-[1px] mb-6 shadow-2xl shadow-brand-DEFAULT/40"
                >
                  <div className="w-full h-full rounded-[23px] bg-gray-950 flex items-center justify-center overflow-hidden">
                      <span className="text-3xl font-serif font-black italic text-brand-light">KA</span>
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <h1 className="text-3xl font-serif font-black text-gray-200 italic tracking-tight">Kwadwo Asamoah</h1>
                  <p className="text-brand-light font-bold text-[10px] uppercase tracking-[0.4em] mt-2 opacity-70">Legacy Tier Client</p>
                </motion.div>
              </div>
            </div>

            <div className="px-6 -mt-8 relative z-10">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5"
                >
                  <p className="text-3xl font-serif font-black text-gray-200 italic">02</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Confirmed</p>
                </motion.div>
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5"
                >
                  <p className="text-3xl font-serif font-black text-gray-200 italic">₵{balance.toFixed(1)}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Wallet Credit</p>
                </motion.div>
              </div>

              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-2">
                      <MenuItem icon={Icons.User} label="Studio Persona" detail="Edit Profile" onClick={() => setSubPage('persona')} />
                      <MenuItem icon={Icons.ShieldCheck} label="Financial Keys" detail="Manage Billing" onClick={() => setSubPage('billing')} />
                      <MenuItem icon={Icons.Heart} label="Collection" detail={`${favorites.length} Saved Masters`} onClick={() => setSubPage('collection')} />
                  </div>

                  <div className="p-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 ml-2">System Config</p>
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-2">
                          <MenuItem icon={Icons.MessageSquare} label="Comms Center" detail="Notifications" onClick={() => setSubPage('comms')} />
                          <MenuItem icon={Icons.Lock} label="Security Core" detail="Privacy Settings" onClick={() => setSubPage('security')} />
                      </div>
                  </div>

                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-center space-x-3 py-6 px-4 text-red-400/80 font-bold text-xs uppercase tracking-[0.2em] group transition-all"
                  >
                      <Icons.LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                      <span>Log Out</span>
                  </button>
              </motion.div>
            </div>
            <p className="text-center text-[9px] font-bold text-gray-600 uppercase tracking-[0.4em] pb-12 mt-8">LensCreate Engine v2.5.0</p>
          </motion.div>
        )}

        {subPage === 'persona' && (
          <motion.div key="persona" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-white min-h-screen">
            {renderHeader('Studio Persona', 'Account Details')}
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center text-brand-DEFAULT relative group overflow-hidden">
                  <span className="text-2xl font-serif font-bold">KA</span>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.Camera className="text-gray-200" size={24} />
                  </div>
                </div>
                <button className="mt-4 text-[10px] font-bold uppercase tracking-widest text-brand-DEFAULT">Update Avatar</button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">Full Name</label>
                  <input type="text" defaultValue="Kwadwo Asamoah" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">Email Domain</label>
                  <input type="email" defaultValue="kwadwo@lenscreate.gh" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">Phone Number</label>
                  <input type="tel" defaultValue="+233 24 555 6789" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">City Access</label>
                  <input type="text" defaultValue="Accra" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">Brief Bio</label>
                  <textarea defaultValue="Passionate collector of visual stories. Always looking for the next master of light." className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-medium text-gray-900 h-32 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10 resize-none" />
                </div>
                <button 
                  onClick={handleSavePersona}
                  disabled={isSavingPersona}
                  className="w-full py-5 bg-gray-900 text-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  {isSavingPersona ? <Icons.Loader2 className="animate-spin" size={16} /> : personaSaved ? <span>Identity Secured <Icons.Check size={16} className="inline ml-1"/></span> : 'Save Identity'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {subPage === 'billing' && (
          <motion.div key="billing" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-white min-h-screen">
            {renderHeader('Financial Keys', 'Wallet & Payments')}
            <div className="p-6">
              <div className="bg-gray-900 p-8 rounded-[40px] text-gray-200 shadow-2xl shadow-black/10 mb-8 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-light opacity-10 rounded-full blur-3xl pointer-events-none" />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-50 mb-2 relative z-10">Available Credit</p>
                <p className="text-4xl font-serif font-black italic relative z-10">₵{balance.toFixed(2)}</p>
                <div className="mt-10 flex justify-between items-end relative z-10">
                   <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20" />
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20" />
                   </div>
                   <button 
                    onClick={handleTopUpClick}
                    className="bg-brand-DEFAULT text-gray-100 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all border-2 border-white shadow-lg"
                   >
                     Top Up
                   </button>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4 ml-2">Active Methods</h3>
                <div className="space-y-4 mb-4">
                  {paymentMethods.map(pm => (
                    <div key={pm.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="flex items-center space-x-4">
                        <div className="w-12 h-8 bg-white border border-gray-200 rounded flex items-center justify-center font-bold text-[8px] tracking-tighter text-gray-900 shadow-sm uppercase">{pm.type}</div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{pm.label}</p>
                            {pm.exp && <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Expires {pm.exp}</p>}
                        </div>
                        </div>
                        <button onClick={() => handleRemovePaymentMethod(pm.id)} className="p-2 text-red-400 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                            <Icons.Trash2 size={16} />
                        </button>
                    </div>
                  ))}
                  {paymentMethods.length === 0 && <p className="text-xs text-gray-400 font-medium italic pl-2">No payment methods.</p>}
                </div>
                <button 
                  onClick={() => setShowAddPayment(true)}
                  className="w-full flex items-center justify-center space-x-3 py-5 border-2 border-dashed border-gray-200 rounded-3xl text-gray-500 hover:text-brand-DEFAULT hover:border-brand-DEFAULT transition-all active:scale-95"
                >
                  <Icons.X size={18} className="rotate-45" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Add Payment Method</span>
                </button>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4 ml-2">History Log</h3>
                <div className="space-y-2">
                   {[1,2].map(i => (
                     <div key={i} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                           <div className="p-2 bg-white rounded-lg text-emerald-500 shadow-sm"><Icons.ArrowRight className="-rotate-45" size={14} /></div>
                           <div>
                              <p className="text-[11px] font-bold text-gray-900">Wallet Dispatch</p>
                              <p className="text-[9px] font-medium text-gray-500 uppercase tracking-widest">May 14, 2026</p>
                           </div>
                        </div>
                        <span className="text-[11px] font-black text-gray-900">₵250.00</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
            
            {/* Top Up Flow Modal */}
            <AnimatePresence>
                {topUpStep !== 'idle' && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setTopUpStep('idle')}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-[400px] bg-white rounded-[40px] p-8 shadow-2xl"
                        >
                            {topUpStep === 'source' && (
                                <>
                                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-2">Fund Wallet</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Select a funding source</p>
                                    <div className="space-y-3">
                                        {paymentMethods.map(pm => (
                                            <button 
                                                key={pm.id} 
                                                onClick={() => handleSourceSelect(pm.id)}
                                                className="w-full flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center font-bold text-[8px] text-gray-900 uppercase">{pm.type}</div>
                                                <span className="text-sm font-bold text-gray-900">{pm.label}</span>
                                            </button>
                                        ))}
                                        <button onClick={() => { setTopUpStep('idle'); setShowAddPayment(true); }} className="w-full p-4 border border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-brand-DEFAULT hover:border-brand-DEFAULT">
                                            + Add New Source
                                        </button>
                                    </div>
                                    <button onClick={() => setTopUpStep('idle')} className="w-full mt-6 py-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
                                </>
                            )}

                            {topUpStep === 'waiting' && (
                                <div className="text-center py-4">
                                    <div className="w-20 h-20 bg-brand-light/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                        <div className="absolute inset-0 border-4 border-brand-DEFAULT/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-brand-DEFAULT rounded-full border-t-transparent animate-spin"></div>
                                        <Icons.Smartphone size={32} className="text-brand-DEFAULT" />
                                    </div>
                                    <h3 className="text-xl font-serif font-black italic text-gray-900 mb-2">Waiting for Approval</h3>
                                    <p className="text-xs text-gray-500 font-medium mb-8 px-4">Please verify the transaction on your mobile device to proceed.</p>
                                    <button 
                                        onClick={handlePaymentApproved}
                                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                                    >
                                        I Have Paid
                                    </button>
                                </div>
                            )}

                            {topUpStep === 'success' && (
                                <div className="text-center py-8">
                                    <motion.div 
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600"
                                    >
                                        <Icons.Check size={40} strokeWidth={3} />
                                    </motion.div>
                                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-2">Funds Secured</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Balance Updated</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Payment Drawer */}
            <AnimatePresence>
              {showAddPayment && (
                <div className="fixed inset-0 z-[120] flex items-end justify-center">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowAddPayment(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl"
                  >
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-8">Add Method</h3>
                    
                    <div className="flex space-x-2 mb-6">
                        <button onClick={() => setPaymentType('card')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${paymentType === 'card' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>Card</button>
                        <button onClick={() => setPaymentType('momo')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${paymentType === 'momo' ? 'bg-brand-DEFAULT text-white' : 'bg-gray-100 text-gray-500'}`}>Mobile Money</button>
                    </div>

                    <div className="space-y-4">
                      {paymentType === 'card' ? (
                          <>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Card Identifier</label>
                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Expiry</label>
                                <input type="text" placeholder="MM/YY" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" />
                                </div>
                                <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">CVV</label>
                                <input type="password" placeholder="•••" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" />
                                </div>
                            </div>
                          </>
                      ) : (
                          <>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Network</label>
                                <select className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none">
                                    <option>MTN Mobile Money</option>
                                    <option>Vodafone Cash</option>
                                    <option>AirtelTigo Money</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Phone Number</label>
                                <input type="tel" value={mobileMoneyNumber} onChange={(e) => setMobileMoneyNumber(e.target.value)} placeholder="024 444 4444" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" />
                            </div>
                          </>
                      )}
                      
                      <button 
                        onClick={handleAddPayment}
                        className="w-full bg-gray-900 text-gray-200 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-6"
                      >
                        Secure Authorize
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {subPage === 'collection' && (
          <motion.div key="collection" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-white min-h-screen">
            {renderHeader('Collection', 'Saved Masters')}
            <div className="p-6 grid grid-cols-1 gap-6">
              {favoritePhotographers.length > 0 ? (
                favoritePhotographers.map(p => (
                  <div key={p.id} onClick={() => onViewPhotographer?.(p.id)} className="bg-white rounded-[32px] p-4 border border-gray-100 shadow-sm flex items-center space-x-4 active:scale-[0.98] transition-all cursor-pointer">
                    <img src={p.imageUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <h3 className="font-serif font-black text-lg italic text-gray-900">{p.name}</h3>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{p.category}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <Icons.Star size={10} className="text-yellow-500 fill-current" />
                        <span className="text-[10px] font-bold text-gray-900">{p.rating}</span>
                        <span className="text-[9px] font-medium text-gray-500">₵{p.hourlyRate}/hr</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(p.id); }}
                      className="p-3 text-brand-DEFAULT active:scale-90 transition-transform"
                    >
                      <Icons.Heart size={20} className="fill-current" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <Icons.Heart className="mx-auto text-gray-200 mb-4" size={48} />
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Your collection is empty</p>
                  <p className="text-gray-400 text-[9px] uppercase tracking-widest mt-2 px-12">Heart your favorite masters to build your artistic collection.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {subPage === 'comms' && (
          <motion.div key="comms" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-white min-h-screen">
            {renderHeader('Comms Center', 'Notifications')}
            <div className="p-6 space-y-4">
               <ToggleItem 
                 label="Push Alerts" 
                 description="Notify me for session updates" 
                 active={preferences.push} 
                 onToggle={() => togglePreference('push')}
               />
               <ToggleItem 
                 label="Asset Dispatch" 
                 description="Alert when photos are delivered" 
                 active={preferences.asset}
                 onToggle={() => togglePreference('asset')}
               />
               <ToggleItem 
                 label="Email Reports" 
                 description="Weekly booking summaries" 
                 active={preferences.email}
                 onToggle={() => togglePreference('email')}
               />
               <ToggleItem 
                 label="SMS Dispatch" 
                 description="Emergency schedule changes" 
                 active={preferences.sms}
                 onToggle={() => togglePreference('sms')}
               />
               <div className="pt-8">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4 ml-2">System Tone</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setSystemTone('cinematic')} className={`p-5 rounded-3xl font-bold text-[10px] uppercase tracking-widest transition-all ${systemTone === 'cinematic' ? 'bg-gray-900 text-gray-200 shadow-lg' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>Cinematic</button>
                    <button onClick={() => setSystemTone('standard')} className={`p-5 rounded-3xl font-bold text-[10px] uppercase tracking-widest transition-all ${systemTone === 'standard' ? 'bg-gray-900 text-gray-200 shadow-lg' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>Standard</button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {subPage === 'security' && (
          <motion.div key="security" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-white min-h-screen">
            {renderHeader('Security Core', 'Privacy & Access')}
            <div className="p-6 space-y-6">
               <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-brand-DEFAULT">
                      <Icons.Smartphone size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">2-Factor Auth</p>
                      <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest">Shielded</p>
                    </div>
                  </div>
                  <Icons.Check className="text-brand-DEFAULT" />
               </div>
               
               <div className="space-y-4">
                  <div className="p-4 space-y-4 bg-gray-50 rounded-[32px] border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-2">Passphrase Access</p>
                    <div className="space-y-3">
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current Secret Key" 
                        className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" 
                      />
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Secret Key" 
                        className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" 
                      />
                    </div>
                    <button 
                      onClick={handleUpdateAuth}
                      disabled={isUpdatingAuth}
                      className="w-full py-4 bg-gray-900 text-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                      {isUpdatingAuth ? <Icons.Loader2 className="animate-spin" size={16} /> : 'Update Access'}
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setActivePopup('sessions')}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 rounded-[32px] transition-all group text-gray-900 border border-gray-100"
                  >
                    <div className="flex items-center space-x-4">
                       <Icons.User size={20} className="text-gray-900 group-hover:text-brand-DEFAULT" />
                       <span className="font-bold text-sm uppercase tracking-widest">Manage Active Sessions</span>
                    </div>
                    <Icons.ChevronRight size={16} className="text-gray-400" />
                 </button>
               </div>

               <div className="pt-12">
                  <button 
                    onClick={() => setActivePopup('delete-account')}
                    className="w-full py-5 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-50 rounded-2xl transition-colors active:scale-95"
                  >
                    Delete Studio Account
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePopup === 'delete-account' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActivePopup(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[400px] bg-white rounded-[40px] p-8 shadow-2xl text-center"
            >
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icons.X size={32} className="text-red-500" />
               </div>
               <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-2">Delete Account?</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed px-4 mb-8">
                 This action is irreversible. All your gallery assets and booking history will be permanently erased.
               </p>
               <div className="flex space-x-3">
                  <button onClick={() => setActivePopup(null)} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Cancel</button>
                  <button 
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-500 text-gray-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20"
                  >
                    Confirm Delete
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {activePopup === 'sessions' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActivePopup(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[400px] bg-white rounded-[40px] p-8 shadow-2xl"
            >
               <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-6">Active Sessions</h3>
               <div className="space-y-4">
                 {activeSessions.map(session => (
                   <div key={session.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="flex items-center space-x-3">
                       <div className={`w-2 h-2 rounded-full ${session.current ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                       <div>
                         <p className="text-sm font-bold text-gray-900">{session.device}</p>
                         <p className="text-[10px] text-gray-500 font-medium uppercase">{session.location} {session.current && '(Current)'}</p>
                       </div>
                     </div>
                     {!session.current && (
                       <button onClick={() => handleRevokeSession(session.id)} className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Revoke</button>
                     )}
                   </div>
                 ))}
               </div>
               <button onClick={() => setActivePopup(null)} className="w-full mt-8 py-4 bg-gray-900 text-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MenuItem: React.FC<{ icon: any, label: string, detail?: string, onClick?: () => void }> = ({ icon: Icon, label, detail, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-5 hover:bg-white/5 rounded-2xl transition-all group active:scale-[0.98]">
        <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-brand-light border border-white/5 group-hover:bg-brand-DEFAULT group-hover:text-brand-light transition-all">
                <Icon size={20} strokeWidth={1.5} />
            </div>
            <div className="text-left">
                <p className="text-sm font-bold text-gray-200 tracking-wide">{label}</p>
                {detail && <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{detail}</p>}
            </div>
        </div>
        <Icons.ChevronRight size={16} className="text-gray-600 group-hover:text-gray-200 transition-colors" />
    </button>
);

const ToggleItem: React.FC<{ label: string, description: string, active: boolean, onToggle?: () => void }> = ({ label, description, active, onToggle }) => (
  <div onClick={onToggle} className="flex items-center justify-between p-6 bg-gray-50 rounded-[32px] border border-gray-100 cursor-pointer active:scale-[0.98] transition-all">
    <div className="flex-1">
      <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">{label}</p>
      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-1">{description}</p>
    </div>
    <div className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-200'}`}>
      <motion.div 
        initial={false}
        animate={{ left: active ? '28px' : '4px' }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
      />
    </div>
  </div>
);

export default Profile;