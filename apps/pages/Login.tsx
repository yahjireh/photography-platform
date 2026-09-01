import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../components/ui/icons';

interface LoginProps {
  onBack: () => void;
  onSuccess: () => void;
  onRegister?: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onSuccess, onRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1500);
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
        className="self-start p-3 -ml-3 rounded-full hover:bg-white/10 text-gray-200 mb-8 transition-colors"
      >
        <Icons.ArrowLeft size={24} />
      </button>

      <div className="mb-10">
        <h1 className="text-5xl font-serif font-black text-gray-100 mb-3 tracking-tighter italic">Welcome</h1>
        <p className="text-gray-300 font-medium tracking-wide">Enter your credentials to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Email Access</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
              <Icons.Mail size={20} strokeWidth={2.5} />
            </div>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 focus:bg-white/25 transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Secure Key</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
              <Icons.Lock size={20} strokeWidth={2.5} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-light/50 focus:bg-white/25 transition-all font-medium"
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

        <div className="flex justify-end">
          <button type="button" className="text-[10px] font-bold text-brand-light uppercase tracking-widest hover:text-gray-200 transition-colors">
            Forgot Credentials?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-brand-dark via-brand-DEFAULT to-brand-light text-gray-900 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-brand-DEFAULT/40 animate-gradient-flow hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center space-x-3 transition-all active:scale-95"
        >
          {isLoading ? (
            <Icons.Loader2 className="animate-spin" />
          ) : (
            <>
              <span className="uppercase tracking-[0.2em] text-xs">Authorize</span>
              <Icons.ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.3em] mb-6">
          <span className="px-4 text-gray-500 relative z-10 bg-black/0">Biometric Access</span>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="gradient-border-mask group active:scale-95 transition-transform">
            <div className="gradient-border-content flex items-center justify-center py-4 text-gray-200 hover:bg-white/5 transition-colors">
              <span className="font-bold text-[10px] tracking-[0.2em] uppercase opacity-70 group-hover:opacity-100">Google</span>
            </div>
          </button>
          <button className="gradient-border-mask group active:scale-95 transition-transform">
            <div className="gradient-border-content flex items-center justify-center py-4 text-gray-200 hover:bg-white/5 transition-colors">
              <span className="font-bold text-[10px] tracking-[0.2em] uppercase opacity-70 group-hover:opacity-100">Apple</span>
            </div>
          </button>
        </div>
      </div>
      
      <p className="mt-10 text-center text-gray-500 text-[10px] font-medium uppercase tracking-[0.2em]">
        New to the studio? <button onClick={onRegister || onBack} className="font-black text-brand-light hover:text-gray-100 transition-colors">Register Account</button>
      </p>
    </motion.div>
  );
};

export default Login;