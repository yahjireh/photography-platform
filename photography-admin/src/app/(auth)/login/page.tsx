/**
 * Login Page
 * ClickFlicks Admin Authentication & Password Recovery
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Camera, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLogin } from '@/hooks/use-auth';
import { api, tokenManager } from '@/lib/api-client';
import { toast } from 'sonner';

type AuthView = 'login' | 'forgot' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>('login');
  
  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot / Reset Password Form
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingRecovery, setIsSubmittingRecovery] = useState(false);

  const { mutate: login, isPending: isLoading } = useLogin();

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenManager.getToken();
      if (token) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your administrator email address');
      return;
    }
    setIsSubmittingRecovery(true);
    try {
      const res = await api.post<any>('/auth/forgot-password', { email: forgotEmail.trim() });
      if (res.data?.success) {
        toast.success(res.data?.message || 'Password reset code generated and sent to email');
        if (res.data?.data?.resetToken) {
          setResetToken(res.data.data.resetToken);
        }
        setView('reset');
      } else {
        toast.error(res.data?.message || 'Failed to generate reset link');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'No administrator account found with this email');
    } finally {
      setIsSubmittingRecovery(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      toast.error('Please enter the reset token or code');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmittingRecovery(true);
    try {
      const res = await api.post<any>('/auth/reset-password', {
        email: forgotEmail.trim(),
        resetToken: resetToken.trim(),
        newPassword
      });

      if (res.data?.success) {
        toast.success('Password reset successfully! You can now sign in with your new password.');
        setView('login');
        setEmail(forgotEmail);
        setPassword('');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.data?.message || 'Password reset failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Invalid or expired reset token');
    } finally {
      setIsSubmittingRecovery(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-sidebar-hover to-sidebar p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-sidebar p-8 text-center relative">
            {view !== 'login' && (
              <button
                type="button"
                onClick={() => setView('login')}
                className="absolute left-6 top-7 text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Back to Sign In"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-gold/20 mb-4"
            >
              <Camera className="h-8 w-8 text-accent-gold" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white tracking-tight">ClickFlicks</h1>
            <p className="text-gray-400 mt-2 text-sm">
              {view === 'login' && 'Sign in to ClickFlicks Administration'}
              {view === 'forgot' && 'Reset Administrator Password'}
              {view === 'reset' && 'Set New Password'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* VIEW 1: SIGN IN */}
            {view === 'login' && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmitLogin}
                className="p-8 space-y-6"
              >
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@clickflicks.gh"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setView('forgot');
                      }}
                      className="text-xs text-sidebar hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full h-12 bg-sidebar hover:bg-sidebar-hover text-white cursor-pointer',
                    'transition-all duration-200 shadow-md hover:shadow-lg font-semibold'
                  )}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </motion.form>
            )}

            {/* VIEW 2: FORGOT PASSWORD */}
            {view === 'forgot' && (
              <motion.form
                key="forgot-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleForgotPasswordSubmit}
                className="p-8 space-y-6"
              >
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter your registered administrator email address and we will generate a secure password reset link and code.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="forgotEmail" className="text-gray-700">
                    Administrator Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="admin@clickflicks.gh"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingRecovery}
                  className="w-full h-12 bg-sidebar hover:bg-sidebar-hover text-white font-semibold shadow-md"
                >
                  {isSubmittingRecovery ? 'Sending Reset Instructions...' : 'Send Reset Code'}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                  >
                    Remember your password? Sign in
                  </button>
                </div>
              </motion.form>
            )}

            {/* VIEW 3: RESET PASSWORD */}
            {view === 'reset' && (
              <motion.form
                key="reset-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleResetPasswordSubmit}
                className="p-8 space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="resetToken" className="text-gray-700 text-xs">
                    Reset Token / Code
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="resetToken"
                      type="text"
                      placeholder="Paste reset token or code"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="pl-10 h-11 text-sm font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-700 text-xs">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 text-xs">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11 text-sm"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingRecovery}
                  className="w-full h-12 bg-sidebar hover:bg-sidebar-hover text-white font-semibold shadow-md mt-2"
                >
                  {isSubmittingRecovery ? 'Updating Password...' : 'Reset & Save Password'}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                  >
                    Cancel and return to Sign In
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          © 2026 ClickFlicks. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
