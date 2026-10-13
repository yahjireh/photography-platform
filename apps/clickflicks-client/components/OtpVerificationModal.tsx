import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/icons';
import apiClient from '../lib/api-client';

interface OtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  phoneNumber?: string;
  initialTab?: 'email' | 'phone';
  autoSendOnOpen?: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  email,
  phoneNumber,
  initialTab = 'email',
  autoSendOnOpen = false,
  onSuccess,
  onClose,
  onSkip,
  skipLabel
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>(initialTab);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync initial tab when changed
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Auto-send fresh OTP on open if requested
  useEffect(() => {
    if (isOpen && autoSendOnOpen) {
      const targetTab = initialTab || activeTab;
      if (targetTab === 'email' && email) {
        apiClient.post('/auth/otp/send-email', { email })
          .then((res) => {
            if (res.data?.code) {
              setInfoMessage(`Code dispatched. (Test code: ${res.data.code})`);
            } else {
              setInfoMessage(`A fresh verification code has been dispatched to ${email}`);
            }
          })
          .catch(() => {});
      } else if (targetTab === 'phone' && phoneNumber) {
        apiClient.post('/auth/otp/send-phone', { phone: phoneNumber })
          .then((res) => {
            if (res.data?.code) {
              setInfoMessage(`SMS dispatched. (Test code: ${res.data.code})`);
            } else {
              setInfoMessage(`A fresh SMS code has been sent to ${phoneNumber}`);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, autoSendOnOpen]);

  // Resend countdown timer
  useEffect(() => {
    if (!isOpen) return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [isOpen, activeTab]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      return;
    }

    const newCode = [...code];
    // If pasted multiple digits
    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      pastedDigits.forEach((digit, i) => {
        if (index + i < 6) newCode[index + i] = digit;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newCode[index] = cleanVal[0];
    setCode(newCode);

    // Auto-advance to next input
    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'email') {
        const res = await apiClient.post('/auth/otp/verify-email', {
          email,
          code: fullCode
        });

        if (res.data?.success) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 1200);
        } else {
          setErrorMessage(res.data?.message || 'Verification failed. Please try again.');
        }
      } else {
        const res = await apiClient.post('/auth/otp/verify-phone', {
          phone: phoneNumber,
          code: fullCode
        });

        if (res.data?.success) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 1200);
        } else {
          setErrorMessage(res.data?.message || 'Verification failed. Please try again.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'email') {
        const res = await apiClient.post('/auth/otp/send-email', { email });
        if (res.data?.code) {
          setInfoMessage(`Code sent. (Test code: ${res.data.code})`);
        } else {
          setInfoMessage(`Code sent to ${email}`);
        }
      } else if (phoneNumber) {
        const res = await apiClient.post('/auth/otp/send-phone', { phone: phoneNumber });
        if (res.data?.code) {
          setInfoMessage(`SMS sent. (Test code: ${res.data.code})`);
        } else {
          setInfoMessage(`SMS sent to ${phoneNumber}`);
        }
      }
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-center"
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          )}

          {/* Success Screen */}
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8 space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <Icons.CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Account Verified!</h3>
              <p className="text-sm text-gray-500">Welcome to ClickFlicks. Setting up your profile...</p>
            </motion.div>
          ) : (
            <>
              {/* Header Icon */}
              <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {activeTab === 'email' ? (
                  <Icons.Mail className="w-7 h-7" />
                ) : (
                  <Icons.Smartphone className="w-7 h-7" />
                )}
              </div>

              {/* Title & Description */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Verify Your {activeTab === 'email' ? 'Email Address' : 'Phone Number'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                {activeTab === 'email' ? (
                  <>Enter the 6-digit code sent to <span className="font-semibold text-gray-800 dark:text-gray-200">{email}</span> or tap the 1-click verification link in your email.</>
                ) : (
                  <>Enter the 6-digit SMS code sent to <span className="font-semibold text-gray-800 dark:text-gray-200">{phoneNumber}</span>.</>
                )}
              </p>

              {/* Tabs (if phone number was provided) */}
              {phoneNumber && (
                <div className="flex justify-center gap-2 mt-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('email');
                      setCode(['', '', '', '', '', '']);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'email'
                        ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('phone');
                      setCode(['', '', '', '', '', '']);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'phone'
                        ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    SMS / Phone
                  </button>
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-2 mt-6">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-12 text-center text-lg font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-gray-900 dark:text-white transition-all"
                  />
                ))}
              </div>

              {/* Info Message */}
              {infoMessage && !errorMessage && (
                <div 
                  onClick={() => {
                    const match = infoMessage.match(/\b\d{6}\b/);
                    if (match) {
                      setCode(match[0].split(''));
                    }
                  }}
                  className="mt-3 p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-600 dark:text-teal-400 text-xs font-medium cursor-pointer hover:bg-teal-500/15 transition-colors"
                  title="Tap to auto-fill"
                >
                  {infoMessage}
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <p className="text-xs text-red-500 mt-3 font-medium">{errorMessage}</p>
              )}

              {/* Verify Button */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || code.join('').length !== 6}
                className="w-full mt-6 py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-teal-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              {/* Skip Option */}
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="w-full mt-2.5 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{skipLabel || 'Skip for now • Verify later in Profile'}</span>
                  <Icons.ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Resend Code */}
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Didn't receive code?{' '}
                {countdown > 0 ? (
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Resend in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-semibold text-teal-600 hover:underline cursor-pointer"
                  >
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
