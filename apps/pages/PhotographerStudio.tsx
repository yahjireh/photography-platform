import React, { useState } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_REVIEWS } from '../constants';

type StudioView = 'main' | 'services' | 'reviews' | 'portfolio' | 'settings' | 'pricing' | 'availability' | 'language' | 'help';

interface PhotographerStudioProps {
  onLogout: () => void;
  kycStatus?: 'pending' | 'submitted' | 'verified';
}

const PhotographerStudio: React.FC<PhotographerStudioProps> = ({ onLogout, kycStatus }) => {
  const [currentView, setCurrentView] = useState<StudioView>('main');
  const [portfolio, setPortfolio] = useState([
    'https://picsum.photos/seed/p1/400/400',
    'https://picsum.photos/seed/p2/400/400',
    'https://picsum.photos/seed/p3/400/400',
    'https://picsum.photos/seed/p4/400/400',
    'https://picsum.photos/seed/p5/400/400',
  ]);
  const [services, setServices] = useState([
    { id: 1, name: 'Wedding Full Day', price: 8000, duration: '12 Hours' },
    { id: 2, name: 'Engagement Session', price: 1500, duration: '2 Hours' },
    { id: 3, name: 'Corporate Headshots', price: 800, duration: '1 Hour' },
  ]);
  const [hourlyRate, setHourlyRate] = useState(350);
  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  
  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacyModeEnabled, setPrivacyModeEnabled] = useState(false);
  const [language, setLanguage] = useState('English');
  
  // Service Editing State
  const [editingService, setEditingService] = useState<any | null>(null); // For modal
  const [isAddingService, setIsAddingService] = useState(false);

  const handleBack = () => setCurrentView('main');
  const handleSettingsBack = () => setCurrentView('settings');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setPortfolio(prev => [reader.result as string, ...prev]);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const saveService = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingService.id) {
          setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
      } else {
          setServices(prev => [...prev, { ...editingService, id: Date.now() }]);
      }
      setEditingService(null);
      setIsAddingService(false);
  };

  const toggleDay = (day: string) => {
      if (workingDays.includes(day)) {
          setWorkingDays(prev => prev.filter(d => d !== day));
      } else {
          setWorkingDays(prev => [...prev, day]);
      }
  };

  const renderHeader = (title: string, subtitle?: string, customBack?: () => void) => (
    <div className="flex items-center space-x-4 mb-6">
      <button 
        onClick={customBack || handleBack}
        className="p-3 bg-gray-50 rounded-2xl text-gray-900 active:scale-95 transition-transform"
      >
        <Icons.ArrowLeft size={20} />
      </button>
      <div>
        <h2 className="text-2xl font-serif font-black italic text-gray-900">{title}</h2>
        {subtitle && <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen pb-32">
      <AnimatePresence mode="wait">
        {currentView === 'main' ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="relative h-64 bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                <button onClick={() => setCurrentView('settings')} className="absolute top-6 right-6 p-2 bg-white/10 backdrop-blur-md rounded-xl text-white active:scale-90 transition-transform">
                    <Icons.Settings size={20} />
                </button>
            </div>

            <div className="px-6 -mt-20 relative z-10">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-28 h-28 rounded-[32px] bg-white p-1 shadow-2xl mb-4">
                        <img src="https://picsum.photos/seed/photographer/200/200" className="w-full h-full rounded-[28px] object-cover" alt="" />
                    </div>
                    <h1 className="text-3xl font-serif font-black text-gray-900 italic">Kojo Antwi</h1>
                    <div className="flex items-center space-x-2 mt-2">
                        {kycStatus === 'verified' ? (
                            <>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-DEFAULT">Enterprise Tier</span>
                                <Icons.ShieldCheck size={12} className="text-brand-DEFAULT" />
                            </>
                        ) : (
                             <>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Pending Verification</span>
                                <Icons.Clock size={12} className="text-amber-500" />
                            </>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <button onClick={() => setCurrentView('services')} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors active:scale-95">
                        <Icons.Briefcase size={20} className="text-gray-900 mb-2" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Services</span>
                    </button>
                    <button onClick={() => setCurrentView('reviews')} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors active:scale-95">
                        <Icons.Sparkles size={20} className="text-gray-900 mb-2" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Reviews</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors active:scale-95">
                        <Icons.ShieldCheck size={20} className="text-gray-900 mb-2" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                             {kycStatus === 'verified' ? 'Verified' : 'Status'}
                        </span>
                    </button>
                </div>

                {/* Portfolio Preview */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Portfolio Grid</h2>
                        <button onClick={() => setCurrentView('portfolio')} className="text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-black/10">Edit</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {portfolio.slice(0, 5).map((img, i) => (
                            <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                                <img src={img} className="w-full h-full object-cover" alt="" />
                            </div>
                        ))}
                        <button onClick={() => setCurrentView('portfolio')} className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 hover:text-brand-DEFAULT hover:border-brand-DEFAULT transition-colors">
                            <Icons.Plus size={24} />
                        </button>
                    </div>
                </div>

                {/* Settings List */}
                <div className="space-y-3">
                    <button onClick={() => setCurrentView('pricing')} className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-900"><Icons.DollarSign size={18} /></div>
                            <div className="text-left">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-900">Pricing & Rates</p>
                                <p className="text-[10px] text-gray-400">Base Rate: ₵{hourlyRate}/hr</p>
                            </div>
                        </div>
                        <Icons.ChevronRight size={16} className="text-gray-300" />
                    </button>
                    <button onClick={() => setCurrentView('availability')} className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-900"><Icons.Clock size={18} /></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Availability</span>
                        </div>
                        <Icons.ChevronRight size={16} className="text-gray-300" />
                    </button>
                </div>
                
                <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-12">Studio ID: 8842-XJ</p>
            </div>
          </motion.div>
        ) : (
            <motion.div 
                key={currentView}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="pt-16 px-6"
            >
                {/* Subpage Content */}
                {currentView === 'services' && (
                    <>
                        {renderHeader('Service Menu', 'Manage Offerings')}
                        <div className="space-y-4">
                            {services.map(service => (
                                <div 
                                    key={service.id} 
                                    onClick={() => setEditingService(service)}
                                    className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm flex justify-between items-center active:scale-95 transition-transform"
                                >
                                    <div>
                                        <h3 className="font-bold text-gray-900">{service.name}</h3>
                                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{service.duration}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="font-serif font-black italic text-lg text-gray-900">₵{service.price}</span>
                                        <Icons.Edit size={16} className="text-gray-300" />
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => {
                                    setEditingService({ name: '', price: 0, duration: '' });
                                    setIsAddingService(true);
                                }}
                                className="w-full py-5 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 hover:border-brand-DEFAULT hover:text-brand-DEFAULT transition-colors"
                            >
                                <Icons.Plus size={16} />
                                <span>Add New Service</span>
                            </button>
                        </div>
                    </>
                )}

                {currentView === 'reviews' && (
                    <>
                        {renderHeader('Reputation', 'Client Testimonials')}
                        <div className="space-y-6">
                            {MOCK_REVIEWS.filter(r => r.photographerId === '1').map(review => (
                                <div key={review.id} className="bg-gray-50 p-6 rounded-[32px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <img src={review.userImage} className="w-10 h-10 rounded-xl" alt="" />
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{review.userName}</p>
                                                <div className="flex text-yellow-500">
                                                    {[...Array(5)].map((_, i) => <Icons.Star key={i} size={10} className={i < review.rating ? "fill-current" : "text-gray-300"} />)}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{review.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 font-medium leading-relaxed">"{review.comment}"</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {currentView === 'portfolio' && (
                    <>
                        {renderHeader('Visual Assets', 'Manage Portfolio')}
                        <div className="grid grid-cols-2 gap-4">
                            {portfolio.map((img, i) => (
                                <div key={i} className="aspect-square rounded-3xl overflow-hidden relative group">
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                        <button onClick={() => setPortfolio(p => p.filter((_, idx) => idx !== i))} className="p-2 bg-white rounded-xl text-red-500 hover:bg-red-50"><Icons.Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                            <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-brand-DEFAULT hover:border-brand-DEFAULT transition-colors relative cursor-pointer">
                                <Icons.Camera size={32} strokeWidth={1.5} className="mb-2" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Upload</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                    </>
                )}

                {currentView === 'pricing' && (
                    <>
                        {renderHeader('Rates', 'Base Configuration')}
                        <div className="space-y-6">
                            <div className="bg-gray-900 p-8 rounded-[40px] text-center text-white mb-8">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Current Hourly Rate</p>
                                <div className="text-5xl font-serif font-black italic flex items-center justify-center">
                                    <span className="text-2xl mr-1">₵</span>
                                    {hourlyRate}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Update Base Rate</label>
                                <div className="relative">
                                    <Icons.DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900" size={18} />
                                    <input 
                                        type="number" 
                                        value={hourlyRate} 
                                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-100 p-5 pl-12 rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10"
                                    />
                                </div>
                                <button onClick={handleBack} className="w-full py-4 bg-brand-DEFAULT text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {currentView === 'availability' && (
                    <>
                        {renderHeader('Availability', 'Working Hours')}
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 ml-1">Active Days</p>
                                <div className="flex justify-between">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                        <button 
                                            key={day}
                                            onClick={() => toggleDay(day)}
                                            className={`w-10 h-14 rounded-2xl flex flex-col items-center justify-center text-[10px] font-bold uppercase transition-all ${workingDays.includes(day) ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Start Time</label>
                                    <input type="time" defaultValue="09:00" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-gray-900 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">End Time</label>
                                    <input type="time" defaultValue="17:00" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-gray-900 outline-none" />
                                </div>
                            </div>
                            <button onClick={handleBack} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs mt-8">
                                Update Schedule
                            </button>
                        </div>
                    </>
                )}
                
                {currentView === 'settings' && (
                    <>
                        {renderHeader('System', 'App Configuration')}
                        <div className="space-y-3">
                             {/* Notifications Toggle */}
                             <div 
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className="p-5 bg-white border border-gray-100 rounded-2xl flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all"
                             >
                                 <span className="font-bold text-sm text-gray-900">Notifications</span>
                                 <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${notificationsEnabled ? 'bg-gray-900' : 'bg-gray-200'}`}>
                                    <motion.div 
                                        initial={false}
                                        animate={{ x: notificationsEnabled ? 22 : 2 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-sm" 
                                    />
                                 </div>
                             </div>

                             {/* Privacy Mode Toggle */}
                             <div 
                                onClick={() => setPrivacyModeEnabled(!privacyModeEnabled)}
                                className="p-5 bg-white border border-gray-100 rounded-2xl flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all"
                             >
                                 <span className="font-bold text-sm text-gray-900">Privacy Mode</span>
                                 <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${privacyModeEnabled ? 'bg-gray-900' : 'bg-gray-200'}`}>
                                    <motion.div 
                                        initial={false}
                                        animate={{ x: privacyModeEnabled ? 22 : 2 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-sm" 
                                    />
                                 </div>
                             </div>

                             {/* Language Selector */}
                             <button 
                                onClick={() => setCurrentView('language')}
                                className="w-full p-5 bg-white border border-gray-100 rounded-2xl flex justify-between items-center text-left active:bg-gray-50 transition-colors"
                             >
                                 <span className="font-bold text-sm text-gray-900">Language</span>
                                 <div className="flex items-center space-x-2 text-gray-400">
                                    <span className="text-xs uppercase font-bold text-gray-500">{language}</span>
                                    <Icons.ChevronRight size={16} />
                                 </div>
                             </button>

                             {/* Help & Support */}
                             <button 
                                onClick={() => setCurrentView('help')}
                                className="w-full p-5 bg-white border border-gray-100 rounded-2xl flex justify-between items-center text-left active:bg-gray-50 transition-colors"
                             >
                                 <span className="font-bold text-sm text-gray-900">Help & Support</span>
                                 <Icons.ChevronRight size={16} className="text-gray-300" />
                             </button>

                             {/* Sign Out */}
                             <button 
                                onClick={onLogout} 
                                className="w-full p-5 mt-8 bg-red-50 text-red-500 rounded-2xl font-bold text-xs uppercase tracking-widest text-center active:bg-red-100 transition-colors shadow-sm"
                             >
                                 Sign Out
                             </button>
                        </div>
                    </>
                )}

                {currentView === 'language' && (
                    <>
                        {renderHeader('Language', 'Region Settings', handleSettingsBack)}
                        <div className="space-y-3">
                            {['English', 'French', 'Twi', 'Ga', 'Ewe'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => { setLanguage(lang); handleSettingsBack(); }}
                                    className={`w-full p-5 rounded-2xl flex justify-between items-center text-left transition-all active:scale-[0.98] ${language === lang ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-900'}`}
                                >
                                    <span className="font-bold text-sm">{lang}</span>
                                    {language === lang && <Icons.Check size={18} className="text-brand-light" />}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {currentView === 'help' && (
                    <>
                        {renderHeader('Support', 'Studio Assistance', handleSettingsBack)}
                        <div className="space-y-4">
                            <div className="bg-brand-DEFAULT p-6 rounded-3xl text-white shadow-lg mb-6">
                                <Icons.HelpCircle size={32} className="mb-4 text-brand-light" />
                                <h3 className="font-serif font-bold text-xl italic mb-2">Need Immediate Help?</h3>
                                <p className="text-xs opacity-90 leading-relaxed mb-6">Our studio support team is available 24/7 to assist with technical issues or booking disputes.</p>
                                <button className="bg-white text-brand-dark px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Contact Support</button>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-2 mb-2">Knowledge Base</p>
                                {['Managing Bookings', 'Payment Issues', 'Profile Verification', 'Cancellation Policy'].map((topic) => (
                                    <button key={topic} className="w-full p-5 bg-white border border-gray-100 rounded-2xl flex justify-between items-center text-left active:bg-gray-50 transition-colors">
                                        <span className="font-bold text-sm text-gray-600">{topic}</span>
                                        <Icons.ChevronRight size={16} className="text-gray-300" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Service Editing Modal */}
      <AnimatePresence>
        {editingService && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                    onClick={() => setEditingService(null)} 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                />
                <motion.div 
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
                    className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl"
                >
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                    <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-6">{isAddingService ? 'New Service' : 'Edit Service'}</h3>
                    <form onSubmit={saveService} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Service Name</label>
                            <input 
                                type="text" 
                                required
                                value={editingService.name} 
                                onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Price (GHS)</label>
                                <input 
                                    type="number" 
                                    required
                                    value={editingService.price} 
                                    onChange={(e) => setEditingService({...editingService, price: Number(e.target.value)})}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-gray-900 outline-none" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Duration</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. 2 Hours"
                                    value={editingService.duration} 
                                    onChange={(e) => setEditingService({...editingService, duration: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-gray-900 outline-none" 
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3 pt-4">
                            {!isAddingService && (
                                <button type="button" onClick={() => {
                                    setServices(prev => prev.filter(s => s.id !== editingService.id));
                                    setEditingService(null);
                                }} className="p-4 bg-red-50 text-red-500 rounded-2xl"><Icons.Trash2 size={20} /></button>
                            )}
                            <button type="submit" className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                                Save Service
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

export default PhotographerStudio;