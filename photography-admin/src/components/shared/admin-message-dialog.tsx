'use client';

import React, { useState } from 'react';
import { Send, X, User, Mail, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AdminMessageDialogProps {
  open: boolean;
  onClose: () => void;
  recipientName?: string;
  recipientEmail?: string;
  recipientType?: 'user' | 'photographer';
  recipientId?: string;
}

export function AdminMessageDialog({
  open,
  onClose,
  recipientName,
  recipientEmail,
  recipientType = 'user',
  recipientId,
}: AdminMessageDialogProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms' | 'push'>('email');
  const [isSending, setIsSending] = useState(false);

  if (!open) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setIsSending(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(`Message sent to ${recipientName || 'recipient'}`);
    setIsSending(false);
    setSubject('');
    setMessage('');
    onClose();
  };

  const TEMPLATES = [
    { label: 'Welcome Message', body: `Hi ${recipientName},\n\nWelcome to PhotoBook Ghana! We're excited to have you on our platform.` },
    { label: 'Account Warning', body: `Hi ${recipientName},\n\nWe noticed some activity on your account that requires your attention. Please review our terms of service.` },
    { label: 'Verification Reminder', body: `Hi ${recipientName},\n\nYour account verification is still pending. Please complete the verification process to unlock full platform features.` },
    { label: 'Payment Issue', body: `Hi ${recipientName},\n\nThere was an issue with a recent payment on your account. Please check your payment details.` },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send Message</h2>
                {recipientName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    To: {recipientName} {recipientEmail ? `(${recipientEmail})` : ''}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {/* Channel selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Channel</label>
              <div className="flex gap-2">
                {(['email', 'sms', 'push'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={cn(
                      'px-4 py-2 text-sm rounded-lg font-medium transition-colors',
                      channel === ch
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {ch === 'email' && <Mail className="w-4 h-4 inline mr-1" />}
                    {ch === 'sms' && <MessageSquare className="w-4 h-4 inline mr-1" />}
                    {ch === 'push' && <Send className="w-4 h-4 inline mr-1" />}
                    {ch.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject (email only) */}
            {channel === 'email' && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Message subject..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            )}

            {/* Quick Templates */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Quick Templates</label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setMessage(t.body)}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{message.length} characters</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className={cn(
                'px-6 py-2 text-sm rounded-lg font-medium flex items-center gap-2 transition-colors',
                isSending || !message.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
