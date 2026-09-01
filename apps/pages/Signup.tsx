import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../components/ui/icons';
import { UserType } from '../types';

interface SignupProps {
  onBack: () => void;
  onSuccess: () => void;
  initialUserType?: UserType;
}

const Signup: React.FC<SignupProps> = ({ onBack, onSuccess, initialUserType }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    userType: initialUserType || UserType.CLIENT,
    locationCity: '',
    locationCountry: 'Ghana'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialUserType) {
        setUserData(prev => ({ ...prev, userType: initialUserType }));
    }
  }, [initialUserType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, password } = userData;
    if (!firstName || !lastName || !email || !password) return;
    
    setIsLoading(true);
    
    // Save user type preference
    localStorage.setItem('lenscreate_user_type', userData.userType);

    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="h-full w-full flex flex-col px-8 pt-12 pb-8 relative z-20"
    >
      <button 
        onClick={onBack}
        className="self-start p-3 -ml-3 rounded-full hover:bg-white/10 text-gray-200 mb-6 transition-colors"
      >
        <Icons.ArrowLeft size={24} />
      </button>

      <div className="mb-8">
        <h1 className="text-5xl font-serif font-black text-gray-100 mb-3 tracking-tighter italic">Join Us</h1>
        <p className="text-gray-300 font-medium tracking-wide leading-relaxed">Create your digital studio identity.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">First Name</label>
            <input 
              type="text" 
              name="firstName"
              required
              value={userData.firstName}
              onChange={handleChange}
              placeholder="Kwadwo"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Last Name</label>
            <input 
              type="text" 
              name="lastName"
              required
              value={userData.lastName}
              onChange={handleChange}
              placeholder="Asamoah"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Email Access</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
              <Icons.Mail size={20} strokeWidth={2.5} />
            </div>
            <input 
              type="email" 
              name="email"
              required
              value={userData.email}
              onChange={handleChange}
              placeholder="kwadwo@example.com"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number</label>
          <input 
            type="tel" 
            name="phoneNumber"
            value={userData.phoneNumber}
            onChange={handleChange}
            placeholder="+233 XX XXX XXXX"
            className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Secure Key</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
              <Icons.Lock size={20} strokeWidth={2.5} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              required
              value={userData.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 hover:text-brand-light transition-colors z-20"
            >
              {showPassword ? <Icons.EyeOff size={20} /> : <Icons.Eye size={20} />}
            </button>
          </div>
        </div>

        {!initialUserType && (
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">User Type</label>
                <select 
                name="userType"
                value={userData.userType}
                onChange={handleChange}
                className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium appearance-none"
                >
                <option value={UserType.CLIENT} className="text-gray-900">Client</option>
                <option value={UserType.PHOTOGRAPHER} className="text-gray-900">Photographer</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">City</label>
                <input 
                type="text" 
                name="locationCity"
                value={userData.locationCity}
                onChange={handleChange}
                placeholder="Accra"
                className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium"
                />
            </div>
            </div>
        )}

        <div className="pt-4">
            <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-brand-dark via-brand-DEFAULT to-brand-light text-gray-900 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-brand-DEFAULT/40 animate-gradient-flow hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center space-x-3 transition-all active:scale-95"
            >
            {isLoading ? (
                <Icons.Loader2 className="animate-spin" />
            ) : (
                <>
                    <span className="uppercase tracking-[0.2em] text-xs">Create Identity</span>
                    <Icons.Check size={20} />
                </>
            )}
            </button>
        </div>
      </form>
      
      <p className="mt-8 text-center text-gray-500 text-[10px] font-medium uppercase tracking-[0.2em]">
        Already verified? <button onClick={onBack} className="font-black text-brand-light hover:text-gray-100 transition-colors">Sign In</button>
      </p>
    </motion.div>
  );
};

export default Signup;