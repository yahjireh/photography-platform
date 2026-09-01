'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Mail, Bell, Send, Megaphone, Users,
  FileText, Plus, Edit, Trash2, Eye, Clock, CheckCircle,
  Search, Filter, Smartphone, MessageCircle, X, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type CommTab = 'messaging' | 'bulk' | 'announcements' | 'templates' | 'push' | 'sms' | 'inapp' | 'reports';

import {
  useCommunicationMessages,
  useCommunicationTemplates,
  useSendCommunication,
  useUpdateCommunicationTemplate
} from '@/hooks/use-communication';

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<CommTab>('messaging');
  const [showCompose, setShowCompose] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<'all' | 'photographers' | 'clients'>('all');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['In-App']);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Live queries & mutations
  const { data: messages = [], isLoading: isLoadingMessages } = useCommunicationMessages();
  const { data: templates = [], isLoading: isLoadingTemplates } = useCommunicationTemplates();
  const { mutate: sendCommunication, isPending: isSending } = useSendCommunication();
  const { mutate: updateTemplate } = useUpdateCommunicationTemplate();

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

  const filteredMessages = messages.filter(m =>
    m.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.to.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.message.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const tabs = [
    { id: 'messaging' as const, label: 'Messages', icon: MessageSquare },
    { id: 'bulk' as const, label: 'Bulk Notifications', icon: Users },
    { id: 'announcements' as const, label: 'Announcements', icon: Megaphone },
    { id: 'templates' as const, label: 'Email Templates', icon: FileText },
    { id: 'push' as const, label: 'Push Notifications', icon: Bell },
    { id: 'sms' as const, label: 'SMS Campaigns', icon: Smartphone },
    { id: 'inapp' as const, label: 'In-App Templates', icon: MessageCircle },
    { id: 'reports' as const, label: 'Scheduled Reports', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Communication Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage live platform communications and targeted announcements
            </p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Message
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
                      ? 'bg-blue-600 text-white'
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

        {/* Messages Tab */}
        {activeTab === 'messaging' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search live dispatched communications..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              {isLoadingMessages ? (
                <div className="p-12 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading live communications...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  No dispatched messages found matching filter.
                </div>
              ) : (
                filteredMessages.map((msg, i) => (
                  <div key={msg.id || i} className={cn('flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                    i < filteredMessages.length - 1 && 'border-b border-gray-200 dark:border-gray-700'
                  )}>
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                      msg.channel === 'email' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      msg.channel === 'push' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      'bg-green-100 dark:bg-green-900/30'
                    )}>
                      {msg.channel === 'email' ? <Mail className="w-5 h-5 text-blue-600" /> :
                       msg.channel === 'push' ? <Bell className="w-5 h-5 text-purple-600" /> :
                       <Users className="w-5 h-5 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{msg.subject}</p>
                      <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">To: {msg.to} ({msg.email}) via {msg.channel}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        msg.status === 'read' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {msg.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{new Date(msg.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Bulk Notifications */}
        {activeTab === 'bulk' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Bulk Notification</h3>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Target Audience</label>
                <div className="flex gap-2">
                  {(['all', 'photographers', 'clients'] as const).map((target) => (
                    <button
                      key={target}
                      onClick={() => setBulkTarget(target)}
                      className={cn('px-4 py-2 text-sm rounded-lg font-medium transition-colors capitalize',
                        bulkTarget === target ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
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
                        className="w-4 h-4 text-blue-600 rounded"
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
                <div className="flex gap-3">
                  <button
                    disabled={isSending}
                    onClick={() => handleSend(bulkTarget)}
                    className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> {isSending ? 'Sending Broadcast...' : 'Send Broadcast Now'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Announcements */}
        {activeTab === 'announcements' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
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
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
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
                <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SMS Campaign</h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  SMS Gateway: <strong>Connected (Hubtel / Arkesel Ghana)</strong> | Status: Active
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Subject / Sender ID</label>
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {isSending ? 'Sending...' : 'Send SMS Campaign'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Compose Message</h3>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm disabled:opacity-50"
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
