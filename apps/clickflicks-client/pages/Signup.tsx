import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../components/ui/icons';
import { UserType } from '../types';
import { useAuth } from '../hooks/useAuth';
import apiClient, { tokenManager } from '../lib/api-client';
import { PasswordStrengthMeter, analyzePassword } from '../components/PasswordStrengthMeter';
import { OAuthModal } from '../components/OAuthModal';

interface SignupProps {
  onBack: () => void;
  onSuccess: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBack, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedOAuthProvider, setSelectedOAuthProvider] = useState<'google' | 'apple' | null>(null);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    userType: UserType.CLIENT,
    locationCity: 'Accra',
    locationCountry: 'Ghana'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signup, login } = useAuth();

  const passwordAnalysis = analyzePassword(userData.password);
  const passwordsMatch = userData.password && userData.confirmPassword 
    ? userData.password === userData.confirmPassword 
    : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword } = userData;
    if (!firstName || !lastName || !email || !password) return;
    
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signup({
        email,
        password,
        firstName,
        lastName,
        phoneNumber: userData.phoneNumber,
        locationCity: userData.locationCity
      });
      onSuccess();
    } catch (err: any) {
      console.error('Signup API error:', err.message);
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthAuthenticate = async (details: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.post('/auth/oauth', {
        provider: selectedOAuthProvider,
        email: details.email,
        firstName: details.firstName,
        lastName: details.lastName,
        userType: 'CLIENT',
        avatarUrl: details.avatarUrl
      });

      if (res.data?.success && res.data?.data?.token) {
        tokenManager.setToken(res.data.data.token);
        tokenManager.setUser(res.data.data.user);
        login(res.data.data.user, res.data.data.token);
        setSelectedOAuthProvider(null);
        onSuccess();
      } else {
        throw new Error(res.data?.message || `${selectedOAuthProvider} authorization failed`);
      }
    } catch (err: any) {
      console.error('OAuth failed:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
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

      <div className="mb-6">
        <h1 className="text-4xl font-serif font-black text-gray-100 mb-2 tracking-tighter italic">Join Us</h1>
        <p className="text-gray-300 font-medium text-xs tracking-wide leading-relaxed">Create your client identity.</p>
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold">
            {errorMessage}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">First Name</label>
            <input 
              type="text" 
              name="firstName"
              required
              value={userData.firstName}
              onChange={handleChange}
              placeholder="Kwadwo"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Last Name</label>
            <input 
              type="text" 
              name="lastName"
              required
              value={userData.lastName}
              onChange={handleChange}
              placeholder="Asamoah"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Email Access</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
              <Icons.Mail size={18} strokeWidth={2.5} />
            </div>
            <input 
              type="email" 
              name="email"
              required
              value={userData.email}
              onChange={handleChange}
              placeholder="kwadwo@example.com"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number</label>
          <input 
            type="tel" 
            name="phoneNumber"
            value={userData.phoneNumber}
            onChange={handleChange}
            placeholder="+233 XX XXX XXXX"
            className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Create Password</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
              <Icons.Lock size={18} strokeWidth={2.5} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              required
              value={userData.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium text-xs"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 hover:text-brand-light transition-colors z-20"
            >
              {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
            </button>
          </div>
          <PasswordStrengthMeter password={userData.password} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Confirm Password</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
              <Icons.Lock size={18} strokeWidth={2.5} />
            </div>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              name="confirmPassword"
              required
              value={userData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              className={`w-full bg-white/20 backdrop-blur-3xl border ${!passwordsMatch ? 'border-red-400 focus:ring-red-400/50' : 'border-white/30 focus:ring-brand-light/50'} text-gray-100 placeholder-white/50 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-2 transition-all font-medium text-xs`}
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 hover:text-brand-light transition-colors z-20"
            >
              {showConfirmPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
            </button>
          </div>
          {!passwordsMatch && (
            <p className="text-[10px] text-red-400 font-bold ml-1">Passwords do not match</p>
          )}
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading || !passwordsMatch || !userData.password || userData.password.length < 8}
            className="w-full bg-gradient-to-r from-brand-dark via-brand-DEFAULT to-brand-light text-gray-900 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-brand-DEFAULT/40 animate-gradient-flow hover:scale-[1.02] disabled:opacity-40 flex items-center justify-center space-x-3 transition-all active:scale-95"
          >
            {isLoading ? (
              <Icons.Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <span className="uppercase tracking-[0.2em] text-xs">Create Identity</span>
                <Icons.Check size={18} />
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* OAuth Buttons */}
      <div className="pt-2">
        <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.3em] mb-3">
          <span className="px-3 text-gray-400 relative z-10 bg-transparent">Or Register With</span>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={() => setSelectedOAuthProvider('google')}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl py-3 text-gray-100 flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
          >
            <span className="font-bold text-[10px] tracking-widest uppercase">Google</span>
          </button>
          <button 
            type="button"
            onClick={() => setSelectedOAuthProvider('apple')}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl py-3 text-gray-100 flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
          >
            <span className="font-bold text-[10px] tracking-widest uppercase">Apple</span>
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-gray-400 text-[10px] font-medium uppercase tracking-[0.2em]">
        Already verified? <button onClick={onBack} className="font-black text-brand-light hover:text-gray-100 transition-colors">Sign In</button>
      </p>

      {/* Interactive Google / Apple Account Picker Modal */}
      <OAuthModal
        isOpen={!!selectedOAuthProvider}
        provider={selectedOAuthProvider}
        onClose={() => setSelectedOAuthProvider(null)}
        onAuthenticate={handleOAuthAuthenticate}
        userRole="CLIENT"
      />
    </motion.div>
  );
};

export default Signup;
