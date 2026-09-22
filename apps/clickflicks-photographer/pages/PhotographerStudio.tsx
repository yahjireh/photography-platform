import React, { useState, useEffect } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotographerProfile } from '../hooks/usePhotographerProfile';
import { apiClient } from '../lib/api-client';

interface PhotographerStudioProps {
  onLogout?: () => void;
  onNavigateKYC?: () => void;
  kycStatus?: 'pending' | 'submitted' | 'verified';
}

interface PaymentMethodConfig {
  id: string;
  type: 'momo' | 'bank';
  provider: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
}

const PhotographerStudio: React.FC<PhotographerStudioProps> = ({ onLogout, onNavigateKYC, kycStatus }) => {
  const { profile, updateProfile, updateUserProfile, addPortfolio, deletePortfolio, user } = usePhotographerProfile();
  
  // Rates state
  const [hourlyRate, setHourlyRate] = useState<number>(profile?.hourly_rate ? Number(profile.hourly_rate) : 350);
  const [dayRate, setDayRate] = useState<number>(profile?.day_rate ? Number(profile.day_rate) : 2500);
  const [isEditingRate, setIsEditingRate] = useState(false);

  // Bio & Vision state
  const [bioText, setBioText] = useState<string>(profile?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);

  // Operating City state
  const [cityText, setCityText] = useState<string>(user?.location_city || 'Accra');
  const [isEditingCity, setIsEditingCity] = useState(false);

  // Phone Number state
  const [phoneText, setPhoneText] = useState<string>(user?.phone_number || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Payment Methods state
  const [primaryPayout, setPrimaryPayout] = useState<PaymentMethodConfig>({
    id: 'pm_primary',
    type: 'momo',
    provider: 'MTN Mobile Money',
    accountNumber: user?.phone_number || '',
    accountName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Master Artisan',
    isPrimary: true
  });
  const [secondaryPayout, setSecondaryPayout] = useState<PaymentMethodConfig | null>(null);
  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [isAddingSecondary, setIsAddingSecondary] = useState(false);

  // New secondary form state
  const [newSecType, setNewSecType] = useState<'momo' | 'bank'>('bank');
  const [newSecProvider, setNewSecProvider] = useState('GCB Bank');
  const [newSecAccountNumber, setNewSecAccountNumber] = useState('');
  const [newSecAccountName, setNewSecAccountName] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState<'tier' | 'upload' | 'payout' | 'settings' | 'terms' | 'kyc-view' | 'support' | 'delete-account' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedPhotoTitle, setSelectedPhotoTitle] = useState('');

  // Delete Account State
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [deleteReasonDetails, setDeleteReasonDetails] = useState<string>('');
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  // Support Ticket States
  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState('Payout Support');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [isLoadingSupportTickets, setIsLoadingSupportTickets] = useState(false);

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
      alert('Your message has been sent to our platform administration! Replies will appear here.');
      loadSupportTickets();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit support inquiry');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason) {
      alert('Please select a reason for deleting your account.');
      return;
    }
    if (!deleteConfirmChecked) {
      alert('Please confirm that you understand this action is permanent and irreversible.');
      return;
    }

    const confirmFinal = window.confirm(
      'Are you completely sure you want to delete your account? All your profile information, portfolio items, bookings, and KYC records will be permanently deleted. This cannot be undone.'
    );
    if (!confirmFinal) return;

    try {
      setIsDeletingAccount(true);
      await apiClient.delete('/users/me', {
        data: {
          reason: deleteReason,
          reason_details: deleteReasonDetails.trim()
        }
      });
      alert('Your account and all associated data have been permanently removed.');
      localStorage.clear();
      onLogout();
    } catch (err: any) {
      console.error('Account deletion error:', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to delete account. Please contact support.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const portfolioList = profile?.portfolio_items || [];
  const tierName = (profile as any)?.subscriptions?.tier || 'FREE';
  const isVerified = profile?.verification_status === 'VERIFIED' || (profile as any)?.photographer_kyc?.kyc_status === 'APPROVED' || kycStatus === 'verified';
  const isKYCSubmitted = (profile as any)?.photographer_kyc?.kyc_status === 'SUBMITTED' || (profile as any)?.photographer_kyc?.kyc_status === 'IN_REVIEW' || kycStatus === 'submitted' || isVerified;

  useEffect(() => {
    if (profile?.hourly_rate != null) {
      setHourlyRate(Number(profile.hourly_rate));
    }
    if (profile?.day_rate != null) {
      setDayRate(Number(profile.day_rate));
    }
    if (profile?.bio) {
      setBioText(profile.bio);
    }
    if (user?.location_city) {
      setCityText(user.location_city);
    }
    if (user?.phone_number) {
      setPhoneText(user.phone_number);
    }

    if (user?.id) {
      try {
        const stored = localStorage.getItem(`clickflicks_photographer_payout_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.primary) setPrimaryPayout(parsed.primary);
          if (parsed.secondary) setSecondaryPayout(parsed.secondary);
        } else {
          setPrimaryPayout(prev => ({
            ...prev,
            accountNumber: user.phone_number || prev.accountNumber,
            accountName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || prev.accountName
          }));
        }
      } catch (_) {}
    }
  }, [profile?.hourly_rate, profile?.day_rate, profile?.bio, user?.location_city, user?.phone_number, user?.id]);

  const savePayoutConfig = (primary: PaymentMethodConfig, secondary: PaymentMethodConfig | null) => {
    setPrimaryPayout(primary);
    setSecondaryPayout(secondary);
    if (user?.id) {
      try {
        localStorage.setItem(`clickflicks_photographer_payout_${user.id}`, JSON.stringify({
          primary,
          secondary
        }));
      } catch (_) {}
    }
  };

  const handleSaveRate = async () => {
    if (isEditingRate) {
      try {
        await updateProfile({ hourlyRate, dayRate });
      } catch (err) {
        console.error('Rate update error:', err);
      }
      setIsEditingRate(false);
    } else {
      setIsEditingRate(true);
    }
  };

  const handleSaveBio = async () => {
    if (isEditingBio) {
      try {
        await updateProfile({ bio: bioText });
      } catch (err) {
        console.error('Bio update error:', err);
      }
      setIsEditingBio(false);
    } else {
      setIsEditingBio(true);
    }
  };

  const handleSaveCity = async () => {
    if (isEditingCity) {
      try {
        await updateUserProfile({ locationCity: cityText });
      } catch (err) {
        console.error('City update error:', err);
      }
      setIsEditingCity(false);
    } else {
      setIsEditingCity(true);
    }
  };

  const handleSavePhone = async () => {
    if (isEditingPhone) {
      try {
        await updateUserProfile({ phoneNumber: phoneText });
        setPrimaryPayout(prev => ({
          ...prev,
          accountNumber: prev.type === 'momo' ? phoneText : prev.accountNumber
        }));
      } catch (err) {
        console.error('Phone update error:', err);
      }
      setIsEditingPhone(false);
    } else {
      setIsEditingPhone(true);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdatingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          await updateUserProfile({ profileImageUrl: reader.result });
        } catch (err) {
          console.error('Error uploading profile photo:', err);
        } finally {
          setIsUpdatingAvatar(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          await addPortfolio({
            title: selectedPhotoTitle || 'Portfolio Masterpiece',
            imageUrl: reader.result,
            occasionType: 'PORTRAIT',
            isFeatured: false
          });
          setUploadSuccess(true);
          setTimeout(() => {
            setUploadSuccess(false);
            setActiveModal(null);
            setSelectedPhotoTitle('');
          }, 1200);
        } catch (err) {
          console.error('Error adding portfolio:', err);
        } finally {
          setIsUploading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deletePortfolio(id);
    } catch (err) {
      console.error('Error deleting portfolio:', err);
    }
  };

  const handleAddSecondaryMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecAccountNumber || !newSecAccountName) return;

    const newSecondary: PaymentMethodConfig = {
      id: `pm_sec_${Date.now()}`,
      type: newSecType,
      provider: newSecProvider,
      accountNumber: newSecAccountNumber.trim(),
      accountName: newSecAccountName.trim(),
      isPrimary: false
    };

    savePayoutConfig(primaryPayout, newSecondary);
    setIsAddingSecondary(false);
    setNewSecAccountNumber('');
    setNewSecAccountName('');
  };

  const handleDeleteSecondary = () => {
    savePayoutConfig(primaryPayout, null);
  };

  const userInitials = user?.first_name 
    ? `${user.first_name[0]}${user.last_name ? user.last_name[0] : ''}`.toUpperCase()
    : 'PH';

  return (
    <div className="pb-32 bg-gray-50/50 min-h-screen">
      {/* Studio Header */}
      <header className="relative pt-16 pb-8 px-6 bg-white border-b border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-DEFAULT">
                {tierName} Tier
              </span>
              {isVerified ? (
                <div className="flex items-center space-x-1 px-2 py-0.5 bg-brand-DEFAULT text-black rounded-md text-[8px] font-black uppercase">
                  <Icons.ShieldCheck size={10} />
                  <span>Verified Master</span>
                </div>
              ) : isKYCSubmitted ? (
                <button 
                  onClick={() => setActiveModal('kyc-view')}
                  className="flex items-center space-x-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[8px] font-black uppercase tracking-wider hover:bg-amber-200 transition-colors"
                >
                  <Icons.Clock size={10} />
                  <span>KYC Submitted</span>
                </button>
              ) : (
                <button 
                  onClick={onNavigateKYC}
                  className="flex items-center space-x-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[8px] font-black uppercase tracking-wider hover:bg-amber-200 transition-colors"
                >
                  <Icons.AlertTriangle size={10} />
                  <span>Verify Identity</span>
                </button>
              )}
            </div>
            <h1 className="text-3xl font-serif font-black text-gray-900 tracking-tight leading-none italic">
              Studio Settings
            </h1>
          </div>

          {/* Profile Photo Avatar with Change Action */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-900 text-brand-light flex items-center justify-center font-serif font-black italic text-xl">
              {isUpdatingAvatar ? (
                <Icons.Loader2 className="animate-spin text-brand-light" size={20} />
              ) : user?.profile_image_url ? (
                <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{userInitials}</span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-DEFAULT text-black rounded-full flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all">
              <Icons.Camera size={12} strokeWidth={2.5} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Dynamic Hourly & Daily Pricing Controls */}
        <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Hourly Rate</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="font-serif font-black text-2xl text-gray-900 italic">₵{hourlyRate}</span>
                <span className="text-xs text-gray-500 font-medium">/ hour</span>
              </div>
            </div>
            <button 
              onClick={handleSaveRate}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-900 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              {isEditingRate ? 'Save Rates' : 'Edit Rates'}
            </button>
          </div>

          {isEditingRate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-1">
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  <span>Hourly Rate Slider</span>
                  <span>₵{hourlyRate}/hr</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="2000" 
                  step="25" 
                  value={hourlyRate} 
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full accent-brand-DEFAULT"
                />
              </div>
            </motion.div>
          )}

          {/* Daily Rate Slider */}
          <div className="pt-3 border-t border-gray-200/60">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Daily Rate (Full Day Package)</span>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <span className="font-serif font-black text-2xl text-gray-900 italic">₵{dayRate}</span>
                  <span className="text-xs text-gray-500 font-medium">/ day</span>
                </div>
              </div>
            </div>

            {isEditingRate && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  <span>Daily Rate Slider</span>
                  <span>₵{dayRate}/day</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="15000" 
                  step="100" 
                  value={dayRate} 
                  onChange={(e) => setDayRate(Number(e.target.value))}
                  className="w-full accent-brand-DEFAULT"
                />
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* Profile & Contact Details Section */}
      <div className="px-6 pt-6 space-y-4">
        {/* Artistic Vision & Bio */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Artistic Vision & Bio</span>
            <button 
              onClick={handleSaveBio}
              className="text-[10px] font-black uppercase tracking-widest text-brand-DEFAULT"
            >
              {isEditingBio ? 'Save Bio' : 'Edit'}
            </button>
          </div>
          {isEditingBio ? (
            <textarea
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              placeholder="Describe your creative philosophy, visual signature, and specialty..."
              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-2xl text-xs font-medium text-gray-900 outline-none h-24 focus:ring-2 focus:ring-brand-DEFAULT/20"
            />
          ) : (
            <p className="text-xs font-medium text-gray-700 leading-relaxed italic">
              {bioText ? `"${bioText}"` : 'No artistic statement set yet. Tap Edit to add your vision.'}
            </p>
          )}
        </div>

        {/* Operating City & Primary Phone Number Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Operating City */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Operating City</span>
              <button 
                onClick={handleSaveCity}
                className="text-[9px] font-black uppercase tracking-widest text-brand-DEFAULT"
              >
                {isEditingCity ? 'Save' : 'Edit'}
              </button>
            </div>
            {isEditingCity ? (
              <input
                type="text"
                value={cityText}
                onChange={(e) => setCityText(e.target.value)}
                placeholder="e.g. Accra"
                className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 outline-none"
              />
            ) : (
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900 truncate">
                <Icons.MapPin size={13} className="text-brand-DEFAULT shrink-0" />
                <span className="truncate">{cityText || 'Accra'}</span>
              </div>
            )}
          </div>

          {/* Primary Phone Number */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Contact Number</span>
              <button 
                onClick={handleSavePhone}
                className="text-[9px] font-black uppercase tracking-widest text-brand-DEFAULT"
              >
                {isEditingPhone ? 'Save' : 'Edit'}
              </button>
            </div>
            {isEditingPhone ? (
              <input
                type="tel"
                value={phoneText}
                onChange={(e) => setPhoneText(e.target.value)}
                placeholder="+233..."
                className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 outline-none"
              />
            ) : (
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900 truncate">
                <Icons.Phone size={13} className="text-brand-DEFAULT shrink-0" />
                <span className="truncate">{phoneText || 'Not configured'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Showcase Grid */}
      <div className="px-6 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Curated Portfolio</h2>
          <button 
            onClick={() => setActiveModal('upload')}
            className="text-[10px] font-black uppercase tracking-widest text-brand-DEFAULT flex items-center space-x-1"
          >
            <Icons.Plus size={14} />
            <span>Add Asset</span>
          </button>
        </div>

        {portfolioList.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {portfolioList.map((item: any) => (
              <div key={item.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm group bg-gray-100">
                <img src={item.image_url || item.thumbnail_url} alt={item.title || ''} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handleDeleteItem(item.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Icons.X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 mb-8">
            <Icons.Camera size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">No Portfolio Assets</p>
            <p className="text-[9px] text-gray-400 mt-1">Tap + Add Asset above to upload your portfolio masterpieces</p>
          </div>
        )}

        {/* Master Controls Section */}
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Business Core</h2>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {/* Identity & KYC Verification Row */}
          <button 
            onClick={() => {
              if (isKYCSubmitted || isVerified) {
                setActiveModal('kyc-view');
              } else if (onNavigateKYC) {
                onNavigateKYC();
              }
            }} 
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {isVerified ? <Icons.ShieldCheck size={18} /> : <Icons.AlertTriangle size={18} />}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">Identity & KYC Verification</p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {isVerified ? 'Verified Master Artisan (Read Only)' : isKYCSubmitted ? 'Submitted • Under Review' : 'Action Required • Verify Identity'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isVerified ? 'bg-emerald-100 text-emerald-800' : isKYCSubmitted ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
              }`}>
                {isVerified ? 'Verified' : isKYCSubmitted ? 'Submitted' : 'Incomplete'}
              </span>
              <Icons.ChevronRight size={16} className="text-gray-400" />
            </div>
          </button>

          <button onClick={() => setActiveModal('tier')} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-DEFAULT/10 text-brand-DEFAULT rounded-xl"><Icons.Sparkles size={18} /></div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">Subscription Tier</p>
                <p className="text-[10px] text-gray-400 font-medium">{tierName} Artist Plan</p>
              </div>
            </div>
            <Icons.ChevronRight size={16} className="text-gray-400" />
          </button>

          {/* Payout Configuration */}
          <button onClick={() => setActiveModal('payout')} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Icons.CreditCard size={18} /></div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">Payout & Payment Channels</p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {primaryPayout.provider} • {secondaryPayout ? '+ Secondary Method' : 'Add Secondary Channel'}
                </p>
              </div>
            </div>
            <Icons.ChevronRight size={16} className="text-gray-400" />
          </button>

          <button onClick={() => setActiveModal('settings')} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gray-50 text-gray-600 rounded-xl"><Icons.Settings size={18} /></div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">Studio Preferences</p>
                <p className="text-[10px] text-gray-400 font-medium">Auto-accept, booking radius</p>
              </div>
            </div>
            <Icons.ChevronRight size={16} className="text-gray-400" />
          </button>

          <button onClick={() => setActiveModal('terms')} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gray-50 text-gray-600 rounded-xl"><Icons.FileText size={18} /></div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">Terms of Artistry</p>
                <p className="text-[10px] text-gray-400 font-medium">Vendor rights & liability</p>
              </div>
            </div>
            <Icons.ChevronRight size={16} className="text-gray-400" />
          </button>

          <button onClick={() => { setActiveModal('support'); loadSupportTickets(); }} className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-DEFAULT/10 text-brand-DEFAULT rounded-xl"><Icons.HelpCircle size={18} /></div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">Contact Support</p>
                <p className="text-[10px] text-gray-400 font-medium">Chat directly with platform administrators</p>
              </div>
            </div>
            <Icons.ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Log Out */}
        <button 
          onClick={onLogout}
          className="w-full mt-6 py-4 rounded-2xl border border-red-100 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Icons.LogOut size={16} />
          <span>Exit Studio</span>
        </button>

        {/* Delete Account */}
        <button 
          onClick={() => setActiveModal('delete-account')}
          className="w-full mt-3 mb-8 py-3 rounded-2xl text-gray-400 hover:text-red-500 font-bold text-[11px] uppercase tracking-wider hover:bg-red-50/60 transition-colors flex items-center justify-center space-x-2"
        >
          <Icons.Trash2 size={14} />
          <span>Permanently Delete Account</span>
        </button>
      </div>

      {/* Sub-Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              
              {/* KYC View-Only Modal (No GRA TIN) */}
              {activeModal === 'kyc-view' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-serif font-black italic text-gray-900">Artisan Credentials</h3>
                    <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center space-x-1">
                      <Icons.Lock size={10} />
                      <span>Locked / Verified</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-6">Government ID & biometrics registered with ClickFlicks Escrow Verification.</p>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 border border-gray-200">
                        {user?.profile_image_url ? (
                          <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-gray-600">{userInitials}</div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{user?.first_name} {user?.last_name}</h4>
                        <p className="text-[10px] text-brand-DEFAULT font-bold uppercase tracking-wider">{tierName} Master Creator</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{user?.email}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Identity Status</span>
                        <span className={`font-bold uppercase ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isVerified ? 'Ghana Card Biometric Verified' : 'Ghana Card Submitted • Review Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Business Designation</span>
                        <span className="font-bold text-gray-900">{isVerified ? 'Verified Master Artisan' : 'Studio Artisan (Under Review)'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Operating City</span>
                        <span className="font-bold text-gray-900">{user?.location_city || 'Accra, Ghana'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Primary Settlement</span>
                        <span className="font-bold text-emerald-600">{primaryPayout.provider} • {primaryPayout.accountNumber || user?.phone_number || 'Registered'}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 italic text-center">
                      Verified credentials cannot be altered directly. Contact compliance to request updates.
                    </p>
                  </div>

                  <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                    Done
                  </button>
                </div>
              )}

              {/* PAYOUT & PAYMENT METHODS MODAL */}
              {activeModal === 'payout' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-serif font-black italic text-gray-900">Payout Channels</h3>
                    <button 
                      onClick={() => setIsEditingPayout(!isEditingPayout)}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-DEFAULT"
                    >
                      {isEditingPayout ? 'Done' : 'Edit Primary'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-6">Manage your primary settlement route and secondary backup account (MoMo or Bank).</p>
                  
                  {/* Primary Method */}
                  <div className="p-4 border border-brand-DEFAULT/40 rounded-2xl bg-brand-DEFAULT/5 mb-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-DEFAULT">Primary Payout Channel</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase">{primaryPayout.type.toUpperCase()}</span>
                    </div>

                    {isEditingPayout ? (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-gray-500 block mb-1">Provider</label>
                          <select 
                            value={primaryPayout.provider} 
                            onChange={(e) => {
                              const prov = e.target.value;
                              const isBank = prov.includes('Bank');
                              const updated = {
                                ...primaryPayout,
                                provider: prov,
                                type: (isBank ? 'bank' : 'momo') as 'momo' | 'bank'
                              };
                              savePayoutConfig(updated, secondaryPayout);
                            }}
                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 outline-none"
                          >
                            <option value="MTN Mobile Money">MTN Mobile Money</option>
                            <option value="Telecel Cash">Telecel Cash</option>
                            <option value="AirtelTigo Money">AirtelTigo Money</option>
                            <option value="GCB Bank">GCB Bank</option>
                            <option value="Ecobank Ghana">Ecobank Ghana</option>
                            <option value="Stanbic Bank">Stanbic Bank</option>
                            <option value="Standard Chartered">Standard Chartered</option>
                            <option value="Fidelity Bank">Fidelity Bank</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-gray-500 block mb-1">Account / Phone Number</label>
                          <input 
                            type="text" 
                            value={primaryPayout.accountNumber} 
                            onChange={(e) => {
                              const updated = { ...primaryPayout, accountNumber: e.target.value };
                              savePayoutConfig(updated, secondaryPayout);
                            }}
                            placeholder="e.g. 0244123456"
                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-gray-500 block mb-1">Account Holder Name</label>
                          <input 
                            type="text" 
                            value={primaryPayout.accountName} 
                            onChange={(e) => {
                              const updated = { ...primaryPayout, accountName: e.target.value };
                              savePayoutConfig(updated, secondaryPayout);
                            }}
                            placeholder="Full name on account"
                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{primaryPayout.provider}</h4>
                        <p className="text-xs text-gray-600 font-medium">{primaryPayout.accountNumber || user?.phone_number || 'No number set'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Holder: {primaryPayout.accountName || user?.first_name || 'Master Artisan'}</p>
                      </div>
                    )}
                  </div>

                  {/* Secondary Method */}
                  {secondaryPayout ? (
                    <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50/80 mb-6 relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Secondary Backup Channel</span>
                        <button 
                          onClick={handleDeleteSecondary}
                          className="text-[9px] font-bold text-red-500 uppercase hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">{secondaryPayout.provider}</h4>
                      <p className="text-xs text-gray-600 font-medium">{secondaryPayout.accountNumber}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Holder: {secondaryPayout.accountName}</p>
                    </div>
                  ) : isAddingSecondary ? (
                    <form onSubmit={handleAddSecondaryMethod} className="p-4 border border-gray-200 rounded-2xl bg-gray-50 mb-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-700">Add Secondary Channel</span>
                        <button 
                          type="button"
                          onClick={() => setIsAddingSecondary(false)}
                          className="text-[10px] font-bold text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <button 
                          type="button"
                          onClick={() => { setNewSecType('momo'); setNewSecProvider('MTN Mobile Money'); }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase ${newSecType === 'momo' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                        >
                          Mobile Money
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setNewSecType('bank'); setNewSecProvider('GCB Bank'); }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase ${newSecType === 'bank' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                        >
                          Bank Account
                        </button>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold uppercase text-gray-500 block mb-1">
                          {newSecType === 'momo' ? 'Network Provider' : 'Bank'}
                        </label>
                        <select 
                          value={newSecProvider} 
                          onChange={(e) => setNewSecProvider(e.target.value)}
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 outline-none"
                        >
                          {newSecType === 'momo' ? (
                            <>
                              <option value="MTN Mobile Money">MTN Mobile Money</option>
                              <option value="Telecel Cash">Telecel Cash</option>
                              <option value="AirtelTigo Money">AirtelTigo Money</option>
                            </>
                          ) : (
                            <>
                              <option value="GCB Bank">GCB Bank</option>
                              <option value="Ecobank Ghana">Ecobank Ghana</option>
                              <option value="Stanbic Bank">Stanbic Bank</option>
                              <option value="Standard Chartered">Standard Chartered</option>
                              <option value="Fidelity Bank">Fidelity Bank</option>
                              <option value="CalBank">CalBank</option>
                              <option value="Absa Bank Ghana">Absa Bank Ghana</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold uppercase text-gray-500 block mb-1">
                          {newSecType === 'momo' ? 'Mobile Money Number' : 'Bank Account Number'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={newSecAccountNumber} 
                          onChange={(e) => setNewSecAccountNumber(e.target.value)}
                          placeholder={newSecType === 'momo' ? '0244123456' : '1029384756'}
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold uppercase text-gray-500 block mb-1">Account Holder Name</label>
                        <input 
                          type="text" 
                          required
                          value={newSecAccountName} 
                          onChange={(e) => setNewSecAccountName(e.target.value)}
                          placeholder="Name as registered on account"
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-900 outline-none"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Save Secondary Channel
                      </button>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setIsAddingSecondary(true)}
                      className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 flex items-center justify-center space-x-2 mb-6"
                    >
                      <Icons.Plus size={14} />
                      <span>Add Secondary Payment Channel (MoMo or Bank)</span>
                    </button>
                  )}

                  <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                    Confirm & Close
                  </button>
                </div>
              )}

              {/* TIER MODAL */}
              {activeModal === 'tier' && (
                <div>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-2">Subscription Tier</h3>
                  <p className="text-xs text-gray-400 mb-6">Current Plan: <span className="font-bold text-brand-DEFAULT uppercase">{tierName}</span></p>
                  <div className="space-y-4 mb-6">
                    <div className={`p-5 rounded-3xl border-2 ${tierName === 'FREE' ? 'border-brand-DEFAULT bg-brand-DEFAULT/5' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-gray-900">STARTER (Free)</span>
                        <span className="font-serif font-black text-gray-900">₵0/mo</span>
                      </div>
                      <p className="text-xs text-gray-500">15% Commission, standard directory search, core gallery storage</p>
                    </div>

                    <div className={`p-5 rounded-3xl border-2 ${tierName === 'PRO' ? 'border-brand-DEFAULT bg-brand-DEFAULT/5' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-gray-900">PRO MASTER</span>
                        <span className="font-serif font-black text-gray-900">₵150/mo</span>
                      </div>
                      <p className="text-xs text-gray-500">5% Platform commission, Unlimited gallery uploads, Top ranking</p>
                    </div>

                    <div className={`p-5 rounded-3xl border-2 ${tierName === 'ENTERPRISE' ? 'border-brand-DEFAULT bg-brand-DEFAULT/5' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-gray-900">ENTERPRISE AGENCY</span>
                        <span className="font-serif font-black text-gray-900">₵450/mo</span>
                      </div>
                      <p className="text-xs text-gray-500">0% Commission, Multi-photographer team accounts, Custom contracts</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                    Done
                  </button>
                </div>
              )}

              {/* UPLOAD MODAL */}
              {activeModal === 'upload' && (
                <div className="text-center">
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-2">Upload Asset</h3>
                  <p className="text-xs text-gray-400 mb-6">Add high resolution photos to your master public showcase.</p>
                  
                  {isUploading ? (
                    <div className="py-12">
                      <Icons.Loader2 size={40} className="animate-spin text-brand-DEFAULT mx-auto mb-4" />
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Saving to Database...</p>
                    </div>
                  ) : uploadSuccess ? (
                    <div className="py-12">
                      <Icons.Check size={40} className="text-emerald-500 mx-auto mb-4" />
                      <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">Asset Published</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        value={selectedPhotoTitle}
                        onChange={(e) => setSelectedPhotoTitle(e.target.value)}
                        placeholder="Photo Title / Label (e.g. Traditional Wedding)"
                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                      />
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-8 cursor-pointer hover:bg-gray-50 transition-colors">
                        <Icons.Upload size={32} className="text-gray-400 mb-3" />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Select Photo File</span>
                        <span className="text-[9px] text-gray-400 mt-1">JPEG, PNG up to 15MB</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS MODAL */}
              {activeModal === 'settings' && (
                <div>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-6">Studio Preferences</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Instant Booking</p>
                        <p className="text-[10px] text-gray-400">Accept requests automatically when schedule is open</p>
                      </div>
                      <input type="checkbox" defaultChecked className="accent-brand-DEFAULT w-4 h-4" />
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Operating City</p>
                        <p className="text-[10px] text-gray-400">{user?.location_city || 'Accra, Ghana'}</p>
                      </div>
                      <span className="text-xs font-bold text-brand-DEFAULT">{user?.location_city || 'Accra'}</span>
                    </div>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                    Done
                  </button>
                </div>
              )}

              {/* TERMS MODAL */}
              {activeModal === 'terms' && (
                <div>
                  <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-2">Terms of Artistry</h3>
                  <div className="h-64 overflow-y-auto no-scrollbar bg-gray-50 p-4 rounded-2xl text-[11px] leading-relaxed text-gray-600 space-y-3 mb-6">
                    <p className="font-bold text-gray-900">1. Escrow Release</p>
                    <p>Payments are held in secure escrow until watermarked or final high-resolution assets are uploaded to the platform vault.</p>
                    <p className="font-bold text-gray-900">2. Cancellation Policy</p>
                    <p>Photographers who cancel accepted sessions within 48 hours without verifiable emergencies may incur platform penalties.</p>
                    <p className="font-bold text-gray-900">3. Asset Copyright</p>
                    <p>Unless custom commercial licenses are purchased, photographers retain master authorship of all original raw captures.</p>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                    Acknowledge
                  </button>
                </div>
              )}

              {/* SUPPORT MODAL */}
              {activeModal === 'support' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-1">Contact Platform Support</h3>
                    <p className="text-xs text-gray-400">Direct channel to ClickFlicks administrator for payouts, disputes, or account help.</p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmitSupport} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Category</label>
                      <select
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none"
                      >
                        <option value="Payout Support">Payout & Momo Support</option>
                        <option value="Client Booking Dispute">Client Booking Dispute</option>
                        <option value="KYC & Verification">KYC & Verification Issue</option>
                        <option value="Technical Issue">Technical / Upload Bug</option>
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
                        placeholder="Brief summary of your inquiry"
                        className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Message</label>
                      <textarea
                        required
                        rows={3}
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Describe your inquiry with necessary details..."
                        className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-medium text-gray-900 outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingSupport}
                      className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-98 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Icons.Send size={14} />
                      <span>{isSubmittingSupport ? 'Submitting...' : 'Send Message to Admin'}</span>
                    </button>
                  </form>

                  {/* Previous Inquiries */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Previous Inquiries & Replies</span>
                      <button
                        type="button"
                        onClick={loadSupportTickets}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-DEFAULT"
                      >
                        Refresh
                      </button>
                    </div>

                    {isLoadingSupportTickets ? (
                      <div className="text-center py-6 text-xs text-gray-400">Loading support inquiries...</div>
                    ) : supportTickets.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl text-xs text-gray-400">
                        No previous support messages found.
                      </div>
                    ) : (
                      supportTickets.map((ticket) => (
                        <div key={ticket.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-gray-700 uppercase">
                              {ticket.category}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              ticket.hasReply ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ticket.hasReply ? 'Replied' : 'Pending'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-900">{ticket.title}</h4>
                          <p className="text-xs text-gray-600">{ticket.message}</p>
                          <p className="text-[10px] text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</p>

                          {ticket.replies && ticket.replies.length > 0 && (
                            <div className="pt-2 border-t border-gray-200/60 space-y-2">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Admin Reply:</span>
                              {ticket.replies.map((reply: any, rIdx: number) => (
                                <div key={reply.id || rIdx} className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-gray-800">
                                  <div className="flex justify-between text-[10px] text-emerald-900 font-bold mb-0.5">
                                    <span>{reply.repliedBy || 'Administrator'}</span>
                                    <span className="font-normal text-emerald-700">{new Date(reply.repliedAt).toLocaleString()}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap">{reply.message}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Permanently Delete Account Modal */}
              {activeModal === 'delete-account' && (
                <div className="space-y-5">
                  <div className="flex items-center space-x-3 text-red-600">
                    <div className="p-3 bg-red-100 rounded-2xl">
                      <Icons.Trash2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-gray-950">Delete Account</h3>
                      <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Irreversible Action</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 leading-relaxed">
                    <p className="font-bold mb-1">⚠️ Warning: Complete Data Purge</p>
                    <p>
                      Deleting your account permanently deletes your profile, portfolio masterpieces, schedule, payout credentials, KYC documents, and booking records. This cannot be undone.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Why are you deleting your account? <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {[
                        'Taking a temporary break from photography',
                        'Switching to another platform / portfolio service',
                        'Platform fees / commission rates are too high',
                        'Not receiving enough client bookings',
                        'Privacy concerns or verification issues',
                        'Experienced technical bugs or app issues',
                        'Other reason'
                      ].map((reason) => (
                        <label
                          key={reason}
                          onClick={() => setDeleteReason(reason)}
                          className={`flex items-center space-x-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            deleteReason === reason
                              ? 'bg-red-50/70 border-red-400 text-gray-900 font-bold shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            deleteReason === reason ? 'border-red-600 bg-red-600' : 'border-gray-300'
                          }`}>
                            {deleteReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{reason}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Tell us more (Optional feedback)
                    </label>
                    <textarea
                      value={deleteReasonDetails}
                      onChange={(e) => setDeleteReasonDetails(e.target.value)}
                      placeholder="Help us improve: what could we have done better?"
                      rows={3}
                      className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-medium text-gray-900 outline-none resize-none focus:border-red-400"
                    />
                  </div>

                  <label className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteConfirmChecked}
                      onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-[11px] text-gray-700 leading-snug">
                      I understand that this action is permanent and completely erases my account, portfolio, and all associated data.
                    </span>
                  </label>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={!deleteReason || !deleteConfirmChecked || isDeletingAccount}
                      onClick={handleDeleteAccount}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-98 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20"
                    >
                      <Icons.Trash2 size={16} />
                      <span>{isDeletingAccount ? 'Purging Account Data...' : 'Permanently Delete My Account'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingAccount}
                      onClick={() => setActiveModal(null)}
                      className="w-full py-3.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      Cancel & Keep Account
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

export default PhotographerStudio;
