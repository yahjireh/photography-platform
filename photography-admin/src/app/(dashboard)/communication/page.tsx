'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mail, Bell, Send, Megaphone, Users,
  FileText, Plus, Edit, Trash2, Eye, Clock, CheckCircle,
  Search, Filter, Smartphone, MessageCircle, X, Loader2,
  CornerDownLeft, Shield, User, HelpCircle, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type CommTab = 'messaging' | 'bulk' | 'announcements' | 'templates' | 'push' | 'sms';

import {
  useCommunicationMessages,
  useCommunicationTemplates,
  useSendCommunication,
  useUpdateCommunicationTemplate,
  useReplySupportMessage,
  CommunicationMessage
} from '@/hooks/use-communication';

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<CommTab>('messaging');
  const [messageFilter, setMessageFilter] = useState<'all' | 'support' | 'broadcast'>('all');
  const [showCompose, setShowCompose] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<'all' | 'photographers' | 'clients'>('all');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['In-App']);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Support Ticket Reply State
  const [selectedTicket, setSelectedTicket] = useState<CommunicationMessage | null>(null);
  const [replyText, setReplyText] = useState('');

  // Live queries & mutations
  const { data: messages = [], isLoading: isLoadingMessages } = useCommunicationMessages();
  const { data: templates = [], isLoading: isLoadingTemplates } = useCommunicationTemplates();
  const { mutate: sendCommunication, isPending: isSending } = useSendCommunication();
  const { mutate: updateTemplate } = useUpdateCommunicationTemplate();
  const { mutate: replyToTicket, isPending: isReplying } = useReplySupportMessage();

  const handleSend = (targetAudience: 'all' | 'photographers' | 'clients' = bulkTarget) => {
    if (!subject.trim() || !messageText.trim()) {
      toast.error('Please enter both subject and message body');
      return;
    }

    sendCommunication({
      target: targetAudience,
      channels: selectedChannels.length > 0 ? selectedChannels : ['In-App'],
      subject,
      message: messageText
    }, {
      onSuccess: () => {
        setSubject('');
        setMessageText('');
        setShowCompose(false);
      }
    });
  };

  const handleReply = () => {
    if (!selectedTicket || !replyText.trim()) {
      toast.error('Please enter your reply');
      return;
    }

    replyToTicket({
      ticketId: selectedTicket.id,
      replyMessage: replyText.trim()
    }, {
      onSuccess: () => {
        setReplyText('');
        setSelectedTicket(null);
      }
    });
  };

  const filteredMessages = messages.filter(m => {
    // Tab category filter
    if (messageFilter === 'support' && !m.isSupportTicket) return false;
    if (messageFilter === 'broadcast' && m.isSupportTicket) return false;

    // Search query filter
    const query = searchFilter.toLowerCase();
    return (
      m.subject.toLowerCase().includes(query) ||
      m.to.toLowerCase().includes(query) ||
      (m.from && m.from.toLowerCase().includes(query)) ||
      m.message.toLowerCase().includes(query)
    );
  });

  const tabs = [
    { id: 'messaging' as const, label: 'Messages & Support', icon: MessageSquare },
    { id: 'bulk' as const, label: 'Bulk Notifications', icon: Users },
    { id: 'announcements' as const, label: 'Announcements', icon: Megaphone },
    { id: 'templates' as const, label: 'Email Templates', icon: FileText },
    { id: 'push' as const, label: 'Push Notifications', icon: Bell },
    { id: 'sms' as const, label: 'SMS Campaigns', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              Communication Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage in-app client & photographer support inquiries, announcements, and broadcasts
            </p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Announcement / Broadcast
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeTab === tab.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages & Support Tab */}
        {activeTab === 'messaging' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search messages, users, or support tickets..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={() => setMessageFilter('all')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                      messageFilter === 'all' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    All Messages
                  </button>
                  <button
                    onClick={() => setMessageFilter('support')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5',
                      messageFilter === 'support' ? 'bg-teal-600 text-white' : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                    )}
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Support Inquiries
                  </button>
                  <button
                    onClick={() => setMessageFilter('broadcast')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                      messageFilter === 'broadcast' ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    )}
                  >
                    Broadcasts
                  </button>
                </div>
              </div>

              {isLoadingMessages ? (
                <div className="p-12 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                  Loading communications...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Inbox is Clear</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                    There are no test or pending broadcast messages. Messages and support inquiries submitted by clients or photographers in the mobile apps will appear here in real time.
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg, i) => {
                  const isSupport = msg.isSupportTicket;
                  const hasReplies = msg.replies && msg.replies.length > 0;

                  return (
                    <div
                      key={msg.id || i}
                      className={cn(
                        'flex items-start gap-4 p-5 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors',
                        i < filteredMessages.length - 1 && 'border-b border-gray-100 dark:border-gray-700/60'
                      )}
                    >
                      <div className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm',
                        isSupport
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                          : msg.channel === 'email'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                      )}>
                        {isSupport ? <HelpCircle className="w-5 h-5" /> : msg.channel === 'email' ? <Mail className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {msg.subject}
                          </h4>
                          {isSupport && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                              SUPPORT INQUIRY
                            </span>
                          )}
                          {msg.userType && (
                            <span className={cn(
                              'px-2 py-0.5 text-[10px] font-semibold rounded-full',
                              msg.userType === 'PHOTOGRAPHER' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            )}>
                              {msg.userType}
                            </span>
                          )}
                          {hasReplies && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              ✓ {msg.replies?.length} {msg.replies?.length === 1 ? 'Reply' : 'Replies'} Sent
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {msg.message}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          {isSupport ? (
                            <span>From: <strong>{msg.from || msg.to}</strong> ({msg.email})</span>
                          ) : (
                            <span>To: <strong>{msg.to}</strong> ({msg.email}) via {msg.channel}</span>
                          )}
                          <span>•</span>
                          <span>{new Date(msg.date).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="shrink-0 self-center flex items-center gap-2">
                        {isSupport && (
                          <button
                            onClick={() => setSelectedTicket(msg)}
                            className="px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <CornerDownLeft className="w-3.5 h-3.5" />
                            {hasReplies ? 'View & Reply Again' : 'Reply to User'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* Bulk Notifications */}
        {activeTab === 'bulk' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Bulk Notification</h3>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Target Audience</label>
                <div className="flex gap-2">
                  {(['all', 'photographers', 'clients'] as const).map((target) => (
                    <button
                      key={target}
                      onClick={() => setBulkTarget(target)}
                      className={cn('px-4 py-2 text-sm rounded-lg font-medium transition-colors capitalize',
                        bulkTarget === target ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      )}
                    >
                      {target === 'all' ? 'All Users' : target}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Channels</label>
                <div className="flex gap-4">
                  {['In-App', 'Email', 'SMS', 'Push'].map((ch) => (
                    <label key={ch} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(ch)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedChannels(prev => [...prev, ch]);
                          else setSelectedChannels(prev => prev.filter(c => c !== ch));
                        }}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Notification subject..."
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Message</label>
                <textarea
                  rows={5}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write your broadcast message..."
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <button
                  disabled={isSending}
                  onClick={() => handleSend(bulkTarget)}
                  className="px-6 py-2.5 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> {isSending ? 'Sending Broadcast...' : 'Send Broadcast Now'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Announcements */}
        {activeTab === 'announcements' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Announcement Banner</h3>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Announcement Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Platform Scheduled Maintenance Notice"
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Message</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Detailed announcement description..."
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                disabled={isSending}
                onClick={() => handleSend('all')}
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Megaphone className="w-4 h-4" /> {isSending ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Email Templates */}
        {activeTab === 'templates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{template.name}</h4>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          template.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        )}>
                          {template.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize font-medium">{template.category}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-mono truncate">{template.subject}</p>
                    {template.body && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded mb-3 line-clamp-2">
                        {template.body}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400">Edited: {template.lastEdited}</span>
                    <button
                      onClick={() => updateTemplate({ id: template.id, updates: { active: !template.active } })}
                      className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {template.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Push Notifications */}
        {activeTab === 'push' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Push Notification Campaign</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Title</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Notification title..."
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Body</label>
                  <textarea
                    rows={3}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Notification body..."
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
                <button
                  disabled={isSending}
                  onClick={() => handleSend('all')}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> {isSending ? 'Sending...' : 'Send Push Notification'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SMS Campaigns */}
        {activeTab === 'sms' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SMS Campaign</h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  SMS Gateway: <strong>Connected (Hubtel / Arkesel Ghana)</strong> | Status: Active
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Sender ID</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="ClickFlicks"
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Message (160 chars max)</label>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="SMS broadcast message..."
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
              <button
                disabled={isSending}
                onClick={() => handleSend('all')}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {isSending ? 'Sending...' : 'Send SMS Campaign'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Support Reply Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b pb-4 dark:border-gray-700">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      SUPPORT INQUIRY
                    </span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                      {selectedTicket.userType || 'USER'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    From: <strong>{selectedTicket.from || selectedTicket.to}</strong> ({selectedTicket.email})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Original User Message */}
              <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">User's Message:</span>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </p>
                <p className="text-[11px] text-gray-400 pt-1">
                  Received: {new Date(selectedTicket.date).toLocaleString()}
                </p>
              </div>

              {/* Conversation History / Replies */}
              {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Previous Replies:</span>
                  <div className="space-y-2">
                    {selectedTicket.replies.map((reply, index) => (
                      <div
                        key={reply.id || index}
                        className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl p-3 text-sm"
                      >
                        <div className="flex items-center justify-between text-xs text-teal-800 dark:text-teal-300 font-semibold mb-1">
                          <span>{reply.repliedBy || 'Platform Administrator'}</span>
                          <span>{new Date(reply.repliedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Reply Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Write Reply (Will be delivered directly to the user's mobile app):
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isReplying}
                  onClick={handleReply}
                  className="px-5 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isReplying ? 'Sending Reply...' : 'Send Reply to User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Compose Broadcast Message</h3>
                <button onClick={() => setShowCompose(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Target Audience</label>
                <select
                  value={bulkTarget}
                  onChange={(e: any) => setBulkTarget(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 text-sm"
                >
                  <option value="all">All Platform Users</option>
                  <option value="photographers">All Verified Photographers</option>
                  <option value="clients">All Registered Clients</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Message</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Message content..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isSending}
                  onClick={() => handleSend(bulkTarget)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-sm disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
