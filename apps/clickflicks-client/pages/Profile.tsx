import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { usePhotographers } from '../hooks/usePhotographers';
import apiClient from '../lib/api-client';
import { OtpVerificationModal } from '../components/OtpVerificationModal';

type VaultSubPage = 'main' | 'persona' | 'billing' | 'collection' | 'comms' | 'security' | 'support';
type TopUpStep = 'idle' | 'amount' | 'source' | 'waiting' | 'success';

interface ProfileProps {
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onViewPhotographer?: (id: string) => void;
  onLogout?: () => void;
  onStartTour?: () => void;
}

interface StoredPaymentMethod {
  id: number;
  type: string;
  last4: string;
  exp: string;
  label: string;
}

const Profile: React.FC<ProfileProps> = ({ favorites = [], onToggleFavorite, onViewPhotographer, onLogout, onStartTour }) => {
  const { user, logout, fetchProfile } = useAuth();
  const { photographers } = usePhotographers();
  const [subPage, setSubPage] = useState<VaultSubPage>('main');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInitialTab, setOtpInitialTab] = useState<'email' | 'phone'>('email');
  
  // Billing States (Live from localStorage scoped to user)
  const [balance, setBalance] = useState<number>(0.0);
  const [topUpStep, setTopUpStep] = useState<TopUpStep>('idle');
  const [topUpAmount, setTopUpAmount] = useState<string>('100');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<StoredPaymentMethod[]>([]);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState('MTN Mobile Money');
  const [paymentType, setPaymentType] = useState<'card' | 'momo'>('card');

  // Persona States (Live from User)
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [personaSaved, setPersonaSaved] = useState(false);
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Support Screen States
  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState('Booking Support');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [isLoadingSupportTickets, setIsLoadingSupportTickets] = useState(false);

  useEffect(() => {
    const mainContainer = document.getElementById('app-main-scroll');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
      mainContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [subPage]);

  useEffect(() => {
    fetchProfile?.().catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.id) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPhoneNumber(user.phone_number || '');
      setLocationCity(user.location_city || 'Accra');
      setProfileImageUrl(user.profile_image_url || null);

      try {
        const storedBal = localStorage.getItem(`clickflicks_wallet_balance_${user.id}`);
        setBalance(storedBal ? parseFloat(storedBal) : 0.0);
      } catch (_) { setBalance(0.0); }

      try {
        const storedPM = localStorage.getItem(`clickflicks_payment_methods_${user.id}`);
        setPaymentMethods(storedPM ? JSON.parse(storedPM) : []);
      } catch (_) { setPaymentMethods([]); }
    } else {
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setLocationCity('Accra');
      setProfileImageUrl(null);
      setBalance(0.0);
      setPaymentMethods([]);
    }
  }, [user]);

  // Security States
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);
  const [authUpdated, setAuthUpdated] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activePopup, setActivePopup] = useState<'delete-account' | 'sessions' | null>(null);
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: navigator.userAgent.includes('Mobile') ? 'Mobile Client (Active)' : 'Desktop Studio (Active)', location: 'Accra, GH', current: true }
  ]);

  // Comms Preferences (Persisted Live per user)
  const [preferences, setPreferences] = useState(() => {
    try {
      const uId = user?.id || 'guest';
      const stored = localStorage.getItem(`clickflicks_comms_preferences_${uId}`);
      return stored ? JSON.parse(stored) : { push: true, asset: true, email: true, sms: false };
    } catch (_) {
      return { push: true, asset: true, email: true, sms: false };
    }
  });
  const [systemTone, setSystemTone] = useState<'cinematic' | 'standard'>('cinematic');

  const favoritePhotographers = photographers.filter(p => favorites.includes(p.id));

  const handleTopUpClick = () => {
    setTopUpStep('amount');
  };

  const handleAmountContinue = () => {
    const parsed = parseFloat(topUpAmount);
    if (!parsed || parsed <= 0) {
      alert('Please enter a valid top-up amount');
      return;
    }
    if (paymentMethods.length === 0) {
      setShowAddPayment(true);
    } else {
      setTopUpStep('source');
    }
  };

  const handleSourceSelect = (_sourceId: number) => {
    setTopUpStep('waiting');
  };

  const handlePaymentApproved = () => {
    setTopUpStep('success');
    const amountToAdd = Math.max(1, parseFloat(topUpAmount) || 100);
    const newBal = balance + amountToAdd;
    setBalance(newBal);
    if (user?.id) {
      try { localStorage.setItem(`clickflicks_wallet_balance_${user.id}`, newBal.toString()); } catch (_) {}
    }
    setTimeout(() => {
      setTopUpStep('idle');
    }, 2200);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePersona = async () => {
    setIsSavingPersona(true);
    setPersonaError(null);
    try {
      let finalAvatarUrl = profileImageUrl;

      // 1. If a new image file was chosen, upload directly via multipart /users/avatar (to Cloudflare R2)
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('avatar', selectedImageFile);
        const uploadRes = await apiClient.post('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data?.data?.avatarUrl) {
          finalAvatarUrl = uploadRes.data.data.avatarUrl;
          setProfileImageUrl(finalAvatarUrl);
        }
      }

      // 2. Save profile fields to /users/me
      await apiClient.patch('/users/me', {
        firstName,
        lastName,
        phoneNumber,
        locationCity,
        profileImageUrl: finalAvatarUrl || undefined
      });

      // 3. Immediately refresh global auth state so new image & names reflect app-wide
      await fetchProfile?.();

      setPersonaSaved(true);
      setSelectedImageFile(null);
      setTimeout(() => setPersonaSaved(false), 2500);
    } catch (err: any) {
      console.error('Error saving persona:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save identity';
      setPersonaError(msg);
    } finally {
      setIsSavingPersona(false);
    }
  };

  const loadSupportTickets = async () => {
    try {
      setIsLoadingSupportTickets(true);
      const res = await apiClient.get('/support/my-tickets');
      if (res.data?.data) {
        setSupportTickets(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setIsLoadingSupportTickets(false);
    }
  };

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      alert('Please enter a subject and message');
      return;
    }

    try {
      setIsSubmittingSupport(true);
      await apiClient.post('/support/contact', {
        subject: supportSubject.trim(),
        category: supportCategory,
        message: supportMessage.trim()
      });
      setSupportSubject('');
      setSupportMessage('');
      alert('Your message has been sent to our support team! The admin will reply shortly.');
      loadSupportTickets();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit support inquiry');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handleUpdateAuth = () => {
    if (!currentPassword || !newPassword) return;
    setIsUpdatingAuth(true);
    setTimeout(() => {
      setIsUpdatingAuth(false);
      setAuthUpdated(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setAuthUpdated(false), 2000);
    }, 1000);
  };

  const handleDeleteAccount = () => {
    setActivePopup(null);
    onLogout?.();
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('clickflicks_comms_preferences', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };

  const handleSetSystemTone = (tone: 'cinematic' | 'standard') => {
    setSystemTone(tone);
    try { localStorage.setItem('clickflicks_system_tone', tone); } catch (_) {}
  };

  const handleRemovePaymentMethod = (id: number) => {
    setPaymentMethods(prev => {
      const updated = prev.filter(pm => pm.id !== id);
      const uId = user?.id || 'guest';
      try { localStorage.setItem(`clickflicks_payment_methods_${uId}`, JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };

  const handleAddPayment = () => {
    let newMethod: StoredPaymentMethod;
    if (paymentType === 'momo') {
      const lastDigits = mobileMoneyNumber ? mobileMoneyNumber.slice(-4) : '0000';
      newMethod = {
        id: Date.now(),
        type: 'momo',
        last4: lastDigits,
        exp: '',
        label: `${mobileMoneyProvider.split(' ')[0]} MoMo •••• ${lastDigits}`
      };
    } else {
      const lastDigits = cardNumber ? cardNumber.slice(-4) : '8888';
      newMethod = {
        id: Date.now(),
        type: 'visa',
        last4: lastDigits,
        exp: cardExpiry || '12/28',
        label: `Card •••• ${lastDigits}`
      };
    }

    setPaymentMethods(prev => {
      const updated = [...prev, newMethod];
      const uId = user?.id || 'guest';
      try { localStorage.setItem(`clickflicks_payment_methods_${uId}`, JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
    setCardNumber('');
    setCardExpiry('');
    setMobileMoneyNumber('');
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

  const initials = user?.first_name 
    ? `${user.first_name[0]}${user.last_name ? user.last_name[0] : ''}`.toUpperCase()
    : 'KA';

  const userDisplayName = user?.first_name 
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Kwadwo Asamoah';

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
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-serif font-black italic text-brand-light">
                        {initials}
                      </span>
                    )}
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <h1 className="text-3xl font-serif font-black text-gray-200 italic tracking-tight">
                    {userDisplayName}
                  </h1>
                  <p className="text-brand-light font-bold text-[10px] uppercase tracking-[0.4em] mt-2 opacity-70">
                    {user?.email || 'Client Tier'}
                  </p>
                  {user?.is_verified ? (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-2.5">
                      <Icons.Check size={12} strokeWidth={3} />
                      <span>Verified Client</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setOtpInitialTab('email');
                        setShowOtpModal(true);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-widest mt-2.5 active:scale-95 transition-all"
                    >
                      <Icons.AlertCircle size={12} strokeWidth={2.5} />
                      <span>Unverified • Tap to Verify</span>
                    </button>
                  )}
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
                  <p className="text-3xl font-serif font-black text-gray-200 italic">{favorites.length.toString().padStart(2, '0')}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Saved Masters</p>
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

              {!user?.is_verified && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  onClick={() => {
                    setOtpInitialTab('email');
                    setShowOtpModal(true);
                  }}
                  className="mb-6 cursor-pointer bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border border-amber-500/40 rounded-[28px] p-4 flex items-center justify-between shadow-xl shadow-amber-500/5 active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <Icons.ShieldAlert size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Account Not Verified</p>
                      <p className="text-[11px] text-gray-300 mt-0.5">Verify via Email link or SMS code</p>
                    </div>
                  </div>
                  <span className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md transition-colors">
                    Verify Now
                  </span>
                </motion.div>
              )}

              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-2">
                      <MenuItem icon={Icons.User} label="Studio Persona" detail="Edit Profile & Photo" onClick={() => setSubPage('persona')} />
                      <MenuItem icon={Icons.ShieldCheck} label="Financial Keys" detail={paymentMethods.length > 0 ? `${paymentMethods.length} Methods Configured` : 'Manage Billing'} onClick={() => setSubPage('billing')} />
                      <MenuItem icon={Icons.Heart} label="Collection" detail={`${favorites.length} Saved Masters`} onClick={() => setSubPage('collection')} />
                  </div>

                  <div className="p-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 ml-2">System Config</p>
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-2">
                          <MenuItem icon={Icons.Compass || Icons.Sparkles} label="App Tour & Guide" detail="Interactive walkthrough of features" onClick={() => onStartTour?.()} />
                          <MenuItem icon={Icons.MessageSquare} label="Comms Center" detail="Live Alerts & Tone" onClick={() => setSubPage('comms')} />
                          <MenuItem icon={Icons.HelpCircle} label="Contact Support" detail="Chat directly with Platform Admin" onClick={() => { setSubPage('support'); loadSupportTickets(); }} />
                          <MenuItem icon={Icons.Lock} label="Security Core" detail="Access & Sessions" onClick={() => setSubPage('security')} />
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
            <p className="text-center text-[9px] font-bold text-gray-600 uppercase tracking-[0.4em] pb-12 mt-8">ClickFlicks Native Platform</p>
          </motion.div>
        )}

        {subPage === 'persona' && (
          <motion.div key="persona" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-white min-h-screen">
            {renderHeader('Studio Persona', 'Account Details')}
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <div className="w-28 h-28 bg-gray-900 rounded-3xl flex items-center justify-center text-brand-light relative overflow-hidden border-2 border-gray-100 shadow-xl">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-serif font-black">{initials}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-brand-DEFAULT text-white p-2.5 rounded-2xl shadow-lg border-2 border-white hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Icons.Camera size={16} />
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-DEFAULT hover:underline"
                >
                  Change Profile Photo
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">Email Domain</label>
                    {user?.is_verified ? (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center">
                        <Icons.Check size={12} className="mr-1" /> Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpInitialTab('email');
                          setShowOtpModal(true);
                        }}
                        className="text-[10px] font-black text-amber-600 uppercase tracking-wider hover:underline"
                      >
                        Verify Email
                      </button>
                    )}
                  </div>
                  <input 
                    type="email" 
                    readOnly
                    value={user?.email || ''} 
                    className="w-full bg-gray-100 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-500 outline-none cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">Phone Number</label>
                    {phoneNumber && !user?.is_verified && (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpInitialTab('phone');
                          setShowOtpModal(true);
                        }}
                        className="text-[10px] font-black text-teal-600 uppercase tracking-wider hover:underline"
                      >
                        Verify via SMS
                      </button>
                    )}
                  </div>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+233 24 000 0000"
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-1">City Location</label>
                  <input 
                    type="text" 
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" 
                  />
                </div>
                {personaError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
                    <Icons.AlertCircle size={16} className="shrink-0" />
                    <span>{personaError}</span>
                  </div>
                )}
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
                    className="bg-brand-DEFAULT text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all border-2 border-white shadow-lg"
                   >
                     Top Up
                   </button>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4 ml-2">Active Methods</h3>
                <div className="space-y-4 mb-4">
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map(pm => (
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
                    ))
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">No payment methods configured</p>
                      <p className="text-[10px] text-gray-400 mt-1">Add a card or Mobile Money account to fund your sessions.</p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setShowAddPayment(true)}
                  className="w-full flex items-center justify-center space-x-3 py-5 border-2 border-dashed border-gray-200 rounded-3xl text-gray-500 hover:text-brand-DEFAULT hover:border-brand-DEFAULT transition-all active:scale-95"
                >
                  <Icons.X size={18} className="rotate-45" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Add Payment Method</span>
                </button>
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
                            {topUpStep === 'amount' && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-serif font-black italic text-gray-900 leading-none">Top Up Wallet</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Select or type funding amount</p>
                                        </div>
                                        <button onClick={() => setTopUpStep('idle')} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                                            <Icons.X size={18} />
                                        </button>
                                    </div>

                                    {/* Amount Input Box */}
                                    <div className="my-6 p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center space-x-2">
                                        <span className="text-3xl font-serif font-black italic text-brand-DEFAULT">₵</span>
                                        <input 
                                            type="number" 
                                            min="1"
                                            step="any"
                                            value={topUpAmount}
                                            onChange={(e) => setTopUpAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="text-4xl font-serif font-black italic text-gray-900 bg-transparent outline-none w-44 text-left"
                                        />
                                    </div>

                                    {/* Quick Amount Chips */}
                                    <div className="grid grid-cols-4 gap-2 mb-6">
                                        {['50', '100', '200', '500'].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setTopUpAmount(preset)}
                                                className={`py-2.5 rounded-2xl text-xs font-black transition-all ${
                                                    topUpAmount === preset
                                                        ? 'bg-brand-DEFAULT text-white shadow-md shadow-brand-DEFAULT/20'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                ₵{preset}
                                            </button>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={handleAmountContinue}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2"
                                    >
                                        <span>Continue with ₵{parseFloat(topUpAmount || '0').toFixed(2)}</span>
                                        <Icons.ChevronRight size={16} />
                                    </button>
                                </>
                            )}

                            {topUpStep === 'source' && (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <button onClick={() => setTopUpStep('amount')} className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center space-x-1">
                                            <Icons.ChevronLeft size={16} />
                                            <span>Change Amount</span>
                                        </button>
                                        <span className="text-xs font-black text-brand-DEFAULT">₵{parseFloat(topUpAmount || '0').toFixed(2)}</span>
                                    </div>
                                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-1">Select Payment</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Choose MoMo or Card</p>
                                    <div className="space-y-3">
                                        {paymentMethods.map(pm => (
                                            <button 
                                                key={pm.id} 
                                                onClick={() => handleSourceSelect(pm.id)}
                                                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center font-bold text-[8px] text-gray-900 uppercase">{pm.type}</div>
                                                    <span className="text-sm font-bold text-gray-900">{pm.label}</span>
                                                </div>
                                                <Icons.ChevronRight size={16} className="text-gray-400" />
                                            </button>
                                        ))}
                                        <button onClick={() => { setShowAddPayment(true); }} className="w-full p-4 border border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-brand-DEFAULT hover:border-brand-DEFAULT">
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
                                    <h3 className="text-xl font-serif font-black italic text-gray-900 mb-2">Authorize Payment</h3>
                                    <p className="text-xs text-gray-500 font-medium mb-2 px-4">
                                        A transaction prompt for <span className="font-bold text-gray-900">₵{parseFloat(topUpAmount || '0').toFixed(2)}</span> has been dispatched.
                                    </p>
                                    <p className="text-[11px] text-gray-400 mb-8 px-4">Please approve the prompt on your mobile phone to complete.</p>
                                    <button 
                                        onClick={handlePaymentApproved}
                                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                                    >
                                        I Have Approved Payment
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
                                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                                        Balance Credited: +₵{parseFloat(topUpAmount || '0').toFixed(2)}
                                    </p>
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
                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-8">Add Payment Source</h3>
                    
                    <div className="flex space-x-2 mb-6">
                        <button onClick={() => setPaymentType('card')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${paymentType === 'card' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>Debit / Credit Card</button>
                        <button onClick={() => setPaymentType('momo')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${paymentType === 'momo' ? 'bg-brand-DEFAULT text-white' : 'bg-gray-100 text-gray-500'}`}>Mobile Money</button>
                    </div>

                    <div className="space-y-4">
                      {paymentType === 'card' ? (
                          <>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Card Number</label>
                                <input 
                                  type="text" 
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value)}
                                  placeholder="0000 0000 0000 0000" 
                                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Expiry Date</label>
                                <input 
                                  type="text" 
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                  placeholder="MM/YY" 
                                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" 
                                />
                                </div>
                                <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Security CVV</label>
                                <input type="password" placeholder="•••" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" />
                                </div>
                            </div>
                          </>
                      ) : (
                          <>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Network Provider</label>
                                <select 
                                  value={mobileMoneyProvider}
                                  onChange={(e) => setMobileMoneyProvider(e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none"
                                >
                                    <option>MTN Mobile Money</option>
                                    <option>Telecel Cash</option>
                                    <option>AT Money</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Mobile Phone Number</label>
                                <input 
                                  type="tel" 
                                  value={mobileMoneyNumber} 
                                  onChange={(e) => setMobileMoneyNumber(e.target.value)} 
                                  placeholder="024 000 0000" 
                                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" 
                                />
                            </div>
                          </>
                      )}
                      
                      <button 
                        onClick={handleAddPayment}
                        className="w-full bg-gray-900 text-gray-200 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-6 active:scale-95 transition-transform"
                      >
                        Securely Register Payment
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
                favoritePhotographers.map(p => {
                  const pInitials = p.name ? p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'PH';
                  return (
                    <div key={p.id} onClick={() => onViewPhotographer?.(p.id)} className="bg-white rounded-[32px] p-4 border border-gray-100 shadow-sm flex items-center space-x-4 active:scale-[0.98] transition-all cursor-pointer">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gray-900 text-brand-light flex items-center justify-center font-serif font-bold text-lg">
                          {pInitials}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-serif font-black text-lg italic text-gray-900">{p.name}</h3>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{p.category}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Icons.Star size={10} className="text-yellow-500 fill-current" />
                          <span className="text-[10px] font-bold text-gray-900">{p.rating > 0 ? p.rating.toFixed(1) : 'New'}</span>
                          {p.hourlyRate && <span className="text-[9px] font-medium text-gray-500">₵{p.hourlyRate}/hr</span>}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(p.id); }}
                        className="p-3 text-brand-DEFAULT active:scale-90 transition-transform"
                      >
                        <Icons.Heart size={20} className="fill-current" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20">
                  <Icons.Heart className="mx-auto text-gray-200 mb-4" size={48} />
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Your collection is empty</p>
                  <p className="text-gray-400 text-[9px] uppercase tracking-widest mt-2 px-12">Heart your favorite visual artists to build your collection.</p>
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
                 description="Instant notifications for session and message updates" 
                 active={preferences.push} 
                 onToggle={() => togglePreference('push')}
               />
               <ToggleItem 
                 label="Asset Dispatch" 
                 description="Alert when delivered photo assets are ready" 
                 active={preferences.asset}
                 onToggle={() => togglePreference('asset')}
               />
               <ToggleItem 
                 label="Email Reports" 
                 description="Booking summaries and receipt invoices" 
                 active={preferences.email}
                 onToggle={() => togglePreference('email')}
               />
               <ToggleItem 
                 label="SMS Dispatch" 
                 description="Emergency shoot schedule reminders" 
                 active={preferences.sms}
                 onToggle={() => togglePreference('sms')}
               />
               <div className="pt-8">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4 ml-2">System Tone</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleSetSystemTone('cinematic')} className={`p-5 rounded-3xl font-bold text-[10px] uppercase tracking-widest transition-all ${systemTone === 'cinematic' ? 'bg-gray-900 text-gray-200 shadow-lg' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>Cinematic</button>
                    <button onClick={() => handleSetSystemTone('standard')} className={`p-5 rounded-3xl font-bold text-[10px] uppercase tracking-widest transition-all ${systemTone === 'standard' ? 'bg-gray-900 text-gray-200 shadow-lg' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>Standard</button>
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
                      <Icons.ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Protected Account</p>
                      <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest">Active & Shielded</p>
                    </div>
                  </div>
                  <Icons.Check className="text-brand-DEFAULT" />
               </div>
               
               <div className="space-y-4">
                  <div className="p-4 space-y-4 bg-gray-50 rounded-[32px] border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 ml-2">Update Password</p>
                    <div className="space-y-3">
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current Password" 
                        className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" 
                      />
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password" 
                        className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" 
                      />
                    </div>
                    <button 
                      onClick={handleUpdateAuth}
                      disabled={isUpdatingAuth || !currentPassword || !newPassword}
                      className="w-full py-4 bg-gray-900 text-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
                    >
                      {isUpdatingAuth ? <Icons.Loader2 className="animate-spin" size={16} /> : authUpdated ? <span>Password Updated <Icons.Check size={16} className="inline ml-1"/></span> : 'Update Password'}
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setActivePopup('sessions')}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 rounded-[32px] transition-all group text-gray-900 border border-gray-100"
                  >
                    <div className="flex items-center space-x-4">
                       <Icons.User size={20} className="text-gray-900 group-hover:text-brand-DEFAULT" />
                       <span className="font-bold text-sm uppercase tracking-widest">Active Device Sessions</span>
                    </div>
                    <Icons.ChevronRight size={16} className="text-gray-400" />
                  </button>
               </div>

               <div className="pt-12">
                  <button 
                    onClick={() => setActivePopup('delete-account')}
                    className="w-full py-5 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-50 rounded-2xl transition-colors active:scale-95"
                  >
                    Sign Out & Close Account
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {subPage === 'support' && (
          <motion.div key="support" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="bg-white min-h-screen pb-32">
            {renderHeader('Contact Support', 'Direct Admin Communication')}
            <div className="p-6 space-y-6">
              {/* Submit Inquiry Card */}
              <form onSubmit={handleSubmitSupport} className="bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-base font-serif font-black text-gray-900 italic">Submit New Inquiry</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Your message will go straight to the platform administrators.</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Category</label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-3.5 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                  >
                    <option value="Booking Support">Booking Support</option>
                    <option value="Payment & Escrow">Payment & Escrow</option>
                    <option value="Photographer Inquiry">Photographer Inquiry</option>
                    <option value="Account & Security">Account & Security</option>
                    <option value="General Question">General Question</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="e.g., Question about my recent booking"
                    className="w-full bg-white border border-gray-200 p-3.5 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Provide details so our admin team can assist you..."
                    className="w-full bg-white border border-gray-200 p-3.5 rounded-2xl text-xs font-medium text-gray-900 outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="w-full py-4 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-98 transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Icons.Send size={14} />
                  <span>{isSubmittingSupport ? 'Submitting to Admin...' : 'Send to Support'}</span>
                </button>
              </form>

              {/* Inquiries & Replies History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Your Support Tickets</h3>
                  <button
                    type="button"
                    onClick={loadSupportTickets}
                    className="text-[10px] font-bold uppercase tracking-widest text-brand-DEFAULT hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                {isLoadingSupportTickets ? (
                  <div className="text-center py-8 text-xs text-gray-400">Loading tickets...</div>
                ) : supportTickets.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6">
                    <Icons.HelpCircle size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-600">No support tickets submitted yet</p>
                    <p className="text-[10px] text-gray-400 mt-1">Submit your message above and replies will appear here in real-time.</p>
                  </div>
                ) : (
                  supportTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase tracking-wider">
                            {ticket.category}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900 mt-1.5">{ticket.title}</h4>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          ticket.hasReply ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ticket.hasReply ? 'Replied' : 'Pending Admin'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl leading-relaxed">{ticket.message}</p>
                      <p className="text-[10px] text-gray-400">Submitted: {new Date(ticket.createdAt).toLocaleString()}</p>

                      {/* Admin Replies */}
                      {ticket.replies && ticket.replies.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Official Admin Response:</span>
                          {ticket.replies.map((reply: any, idx: number) => (
                            <div key={reply.id || idx} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                              <div className="flex items-center justify-between text-[10px] text-emerald-900 font-bold mb-1">
                                <span>{reply.repliedBy || 'Platform Administrator'}</span>
                                <span className="font-normal text-emerald-700">{new Date(reply.repliedAt).toLocaleString()}</span>
                              </div>
                              <p className="text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
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
               <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-2">Close Account Session?</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed px-4 mb-8">
                 This will sign out your active identity and clear credentials from this device.
               </p>
               <div className="flex space-x-3">
                  <button onClick={() => setActivePopup(null)} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Cancel</button>
                  <button 
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-500 text-gray-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20"
                  >
                    Sign Out
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
               <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-6">Active Device Sessions</h3>
               <div className="space-y-4">
                 {activeSessions.map(session => (
                   <div key={session.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="flex items-center space-x-3">
                       <div className={`w-2.5 h-2.5 rounded-full ${session.current ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                       <div>
                         <p className="text-sm font-bold text-gray-900">{session.device}</p>
                         <p className="text-[10px] text-gray-500 font-medium uppercase">{session.location} {session.current && '(Current Session)'}</p>
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

      {/* Account Verification Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        email={user?.email || ''}
        phoneNumber={phoneNumber || user?.phone_number || undefined}
        initialTab={otpInitialTab}
        autoSendOnOpen={true}
        onSuccess={async () => {
          setShowOtpModal(false);
          await fetchProfile?.();
        }}
        onClose={() => setShowOtpModal(false)}
      />
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
