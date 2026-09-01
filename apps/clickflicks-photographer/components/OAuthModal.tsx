import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/icons';

interface OAuthModalProps {
  isOpen: boolean;
  provider: 'google' | 'apple' | null;
  onClose: () => void;
  onAuthenticate: (details: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }) => Promise<void>;
  userRole?: 'PHOTOGRAPHER' | 'CLIENT';
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  provider,
  onClose,
  onAuthenticate,
  userRole = 'PHOTOGRAPHER'
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !provider) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const parts = email.split('@')[0].split('.');
      const fName = firstName.trim() || parts[0] || (provider === 'google' ? 'Google' : 'Apple');
      const lName = lastName.trim() || parts[1] || 'User';

      await onAuthenticate({
        email: email.trim().toLowerCase(),
        firstName: fName.charAt(0).toUpperCase() + fName.slice(1),
        lastName: lName.charAt(0).toUpperCase() + lName.slice(1)
      });
    } catch (err: any) {
      setError(err.message || `Failed to connect with ${provider}`);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-[420px] bg-white rounded-[32px] p-7 z-10 shadow-2xl overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              {provider === 'google' ? (
                <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-black text-white shadow-sm flex items-center justify-center p-2.5">
                  <svg className="w-full h-full fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.85-11.96-14.41-5.99-9.13-10.74-19.46-14.24-30.98-3.51-11.53-5.26-22.61-5.26-33.24 0-14.13 3.69-25.76 11.07-34.9 7.38-9.14 16.59-13.82 27.63-14.05 4.58 0 9.87 1.25 15.88 3.76 6 2.51 10.23 3.82 12.69 3.94 2.01-.12 6.39-1.48 13.13-4.08 6.74-2.6 12.18-3.8 16.32-3.6 12.19.67 21.94 5.34 29.27 14.01-10.68 6.47-15.91 15.35-15.69 26.63.22 8.87 3.57 16.27 10.05 22.21 6.47 5.94 14.01 9.4 22.61 10.38-2.35 6.97-5.06 13.79-8.15 20.47zM119.22 33.11c0-6.93 2.51-13.51 7.54-19.74 5.03-6.23 11.23-10.45 18.6-12.66.45 1.12.67 2.35.67 3.69 0 6.93-2.57 13.62-7.71 20.08-5.14 6.46-11.39 10.74-18.75 12.84-.23-1.34-.35-2.74-.35-4.21z"/>
                  </svg>
                </div>
              )}
              <div>
                <h3 className="font-serif font-black italic text-lg text-gray-900 leading-tight">
                  {provider === 'google' ? 'Google Account' : 'Apple ID Sign In'}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ClickFlicks Secure OAuth</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center active:scale-95"
            >
              <Icons.X size={16} />
            </button>
          </div>

          {error && (
            <div className="p-3.5 mb-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-gray-600">
              Enter your {provider === 'google' ? 'Google' : 'Apple'} account email to sign in or register:
            </p>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                {provider === 'google' ? 'Google Email Address' : 'Apple ID Email Address'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={provider === 'google' ? 'name@gmail.com' : 'name@icloud.com'}
                className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">First Name (Optional)</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Last Name (Optional)</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-xs font-bold text-gray-900 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 hover:bg-brand-DEFAULT hover:text-black transition-colors disabled:opacity-40 mt-2"
            >
              {isSubmitting ? (
                <Icons.Loader2 size={16} className="animate-spin" />
              ) : (
                <span>Continue with {provider === 'google' ? 'Google' : 'Apple'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-[9px] text-gray-400 leading-tight">
              If an account already exists with this {provider === 'google' ? 'Google' : 'Apple'} email, you will be logged in immediately. If new, an account will be created.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OAuthModal;
