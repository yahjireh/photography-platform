import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/icons';
import { useAuth } from '../hooks/useAuth';
import apiClient, { tokenManager } from '../lib/api-client';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';

import { OAuthModal } from '../components/OAuthModal';

interface LoginProps {
  onBack: () => void;
  onSuccess: () => void;
  onRegister?: () => void;
}

type AuthSubView = 'login' | 'forgot-email' | 'reset-password' | 'reset-success';

const Login: React.FC<LoginProps> = ({ onBack, onSuccess, onRegister }) => {
  const [authView, setAuthView] = useState<AuthSubView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [selectedOAuthProvider, setSelectedOAuthProvider] = useState<'google' | 'apple' | null>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot / Reset password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login({ email, password });
      onSuccess();
    } catch (err: any) {
      console.error('API login failed:', err.message);
      setErrorMessage(err.message || 'Invalid email or password');
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
        userType: 'PHOTOGRAPHER',
        avatarUrl: details.avatarUrl
      });

      if (res.data?.success && res.data?.data?.token) {
        tokenManager.setToken(res.data.data.token);
        tokenManager.setUser(res.data.data.user);
        login(res.data.data.user, res.data.data.token, res.data.data.photographerProfile);
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post('/auth/forgot-password', { email: forgotEmail });
      if (res.data?.success) {
        setResetToken(res.data.data?.resetToken || '');
        setAuthView('reset-password');
      } else {
        throw new Error(res.data?.message || 'No account registered with this email address');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'No account registered with this email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) return;

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post('/auth/reset-password', {
        email: forgotEmail,
        resetToken,
        newPassword
      });

      if (res.data?.success) {
        setSuccessMessage('Your master password has been successfully updated.');
        setAuthView('reset-success');
      } else {
        throw new Error(res.data?.message || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Password reset token expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordsMatch = newPassword && confirmNewPassword ? newPassword === confirmNewPassword : true;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="h-full w-full flex flex-col px-8 pt-12 pb-8 relative z-20 overflow-y-auto no-scrollbar"
    >
      <button 
        onClick={() => {
          if (authView !== 'login') {
            setAuthView('login');
            setErrorMessage(null);
          } else {
            onBack();
          }
        }}
        className="self-start p-3 -ml-3 rounded-full hover:bg-white/10 text-gray-200 mb-6 transition-colors"
      >
        <Icons.ArrowLeft size={24} />
      </button>

      <AnimatePresence mode="wait">
        {/* LOGIN VIEW */}
        {authView === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <div className="mb-4">
                <img src="./logo-white.png" alt="ClickFlicks Studio" className="h-10 object-contain drop-shadow" />
              </div>
              <h1 className="text-4xl font-serif font-black text-gray-100 mb-2 tracking-tighter italic">Studio Portal</h1>
              <p className="text-gray-300 font-medium text-xs tracking-wide">Enter photographer credentials.</p>
              {errorMessage && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
                  {successMessage}
                </div>
              )}
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5 flex-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Email Access</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
                    <Icons.Mail size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="studio@example.com"
                    className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 focus:bg-white/25 transition-all font-medium text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Master Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
                    <Icons.Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-light/50 focus:bg-white/25 transition-all font-medium text-xs"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 hover:text-brand-light transition-colors z-20"
                  >
                    {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => {
                    setAuthView('forgot-email');
                    setErrorMessage(null);
                    setForgotEmail(email);
                  }}
                  className="text-[10px] font-bold text-brand-light uppercase tracking-widest hover:text-gray-200 transition-colors"
                >
                  Forgot Credentials?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-brand-dark via-brand-DEFAULT to-brand-light text-gray-900 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-brand-DEFAULT/40 animate-gradient-flow hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center space-x-3 transition-all active:scale-95"
              >
                {isLoading ? (
                  <Icons.Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <span className="uppercase tracking-[0.2em] text-xs">Enter Command Center</span>
                    <Icons.ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.3em] mb-4">
                <span className="px-4 text-gray-400 relative z-10 bg-transparent">Or Authenticate With</span>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedOAuthProvider('google')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl py-3.5 text-gray-100 flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
                >
                  <span className="font-bold text-[10px] tracking-widest uppercase">Google</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedOAuthProvider('apple')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl py-3.5 text-gray-100 flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
                >
                  <span className="font-bold text-[10px] tracking-widest uppercase">Apple</span>
                </button>
              </div>
            </div>
            
            <p className="mt-6 text-center text-gray-400 text-[10px] font-medium uppercase tracking-[0.2em]">
              New studio? <button onClick={onRegister || onBack} className="font-black text-brand-light hover:text-gray-100 transition-colors">Register as Creator</button>
            </p>
          </motion.div>
        )}

        {/* FORGOT EMAIL VIEW */}
        {authView === 'forgot-email' && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-serif font-black text-gray-100 mb-2 tracking-tighter italic">Reset Studio Key</h1>
              <p className="text-gray-300 font-medium text-xs tracking-wide">Enter your registered studio email to verify identity and dispatch reset link.</p>
              {errorMessage && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6 flex-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Registered Studio Email</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
                    <Icons.Mail size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="studio@example.com"
                    className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !forgotEmail}
                className="w-full bg-gradient-to-r from-brand-dark via-brand-DEFAULT to-brand-light text-gray-900 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-brand-DEFAULT/40 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center space-x-3 transition-all active:scale-95"
              >
                {isLoading ? (
                  <Icons.Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <span className="uppercase tracking-[0.2em] text-xs">Verify Studio</span>
                    <Icons.Check size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="w-full py-3 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-gray-200 transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          </motion.div>
        )}

        {/* RESET PASSWORD VIEW */}
        {authView === 'reset-password' && (
          <motion.div
            key="reset-pw"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-serif font-black text-gray-100 mb-2 tracking-tighter italic">Create Master Key</h1>
              <p className="text-gray-300 font-medium text-xs tracking-wide">Enter a strong, secure password for {forgotEmail}.</p>
              {errorMessage && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">New Master Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
                    <Icons.Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type={showResetPassword ? "text" : "password"} 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-100 placeholder-white/50 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-all font-medium text-xs"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 hover:text-brand-light transition-colors z-20"
                  >
                    {showResetPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </button>
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Confirm Master Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 z-20 group-focus-within:text-brand-light transition-colors pointer-events-none opacity-90 group-focus-within:opacity-100">
                    <Icons.Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type={showConfirmResetPassword ? "text" : "password"} 
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full bg-white/20 backdrop-blur-3xl border ${!resetPasswordsMatch ? 'border-red-400' : 'border-white/30 focus:ring-brand-light/50'} text-gray-100 placeholder-white/50 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-2 transition-all font-medium text-xs`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 hover:text-brand-light transition-colors z-20"
                  >
                    {showConfirmResetPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </button>
                </div>
                {!resetPasswordsMatch && (
                  <p className="text-[10px] text-red-400 font-bold ml-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !resetPasswordsMatch || !newPassword || newPassword.length < 8}
                className="w-full bg-gradient-to-r from-brand-dark via-brand-DEFAULT to-brand-light text-gray-900 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-brand-DEFAULT/40 hover:scale-[1.02] disabled:opacity-40 flex items-center justify-center space-x-3 transition-all active:scale-95"
              >
                {isLoading ? (
                  <Icons.Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <span className="uppercase tracking-[0.2em] text-xs">Update Credentials</span>
                    <Icons.Check size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="w-full py-2 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}

        {/* RESET SUCCESS VIEW */}
        {authView === 'reset-success' && (
          <motion.div
            key="reset-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center py-10"
          >
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-400 mb-6 shadow-xl">
              <Icons.Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-serif font-black text-gray-100 mb-2 italic">Credentials Updated</h2>
            <p className="text-gray-300 text-xs font-medium leading-relaxed mb-8 px-4">
              Your master password has been changed in the database. You may now sign in to access your photographer command center.
            </p>
            <button
              onClick={() => {
                setAuthView('login');
                setPassword('');
              }}
              className="w-full bg-gradient-to-r from-brand-dark via-brand-DEFAULT to-brand-light text-gray-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Sign In Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Google / Apple Account Picker Modal */}
      <OAuthModal
        isOpen={!!selectedOAuthProvider}
        provider={selectedOAuthProvider}
        onClose={() => setSelectedOAuthProvider(null)}
        onAuthenticate={handleOAuthAuthenticate}
        userRole="PHOTOGRAPHER"
      />
    </motion.div>
  );
};

export default Login;
