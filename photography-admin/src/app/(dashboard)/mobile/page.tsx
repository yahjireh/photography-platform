'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, Upload, Bell, MessageSquare, Link2, Bug,
  Flag, FlaskConical, CheckCircle, AlertTriangle, Download,
  ExternalLink, TrendingUp, Users, Star, Copy, Check, Plus,
  Trash2, RotateCcw, Send, Play, Pause, Shield, Eye, MousePointerClick
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

import {
  useMobileVersions,
  useMobileStats,
  useMobileCrashes,
  useUpdateMobileVersion,
  useBroadcastSoftUpdate,
  useCreateMobileVersion,
  useMobileCampaigns,
  useCreateMobileCampaign,
  useMobileInAppMessages,
  useCreateMobileInAppMessage,
  useToggleMobileInAppMessage,
  useDeleteMobileInAppMessage,
  useUpdateMobileCrash,
  useClearResolvedCrashes,
  useMobileFlags,
  useUpdateMobileFlag,
  useMobileAbTests,
  useCreateMobileAbTest,
  useToggleMobileAbTest,
  useResetMobileAbTest,
} from '@/hooks/use-mobile';

type MobileTab = 'versions' | 'push' | 'messages' | 'links' | 'crashes' | 'flags' | 'abtesting';

export default function MobileAppManagementPage() {
  const [activeTab, setActiveTab] = useState<MobileTab>('versions');

  // Live queries & mutations
  const { data: appVersions = [], isLoading: isLoadingVersions } = useMobileVersions();
  const { data: mobileStats } = useMobileStats();
  const { mutate: updateAppVersion, isPending: isUpdatingVersion } = useUpdateMobileVersion();
  const { mutate: broadcastSoftUpdate, isPending: isBroadcastingUpdate } = useBroadcastSoftUpdate();
  const { mutate: createVersion, isPending: isCreatingVersion } = useCreateMobileVersion();

  // Push Campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useMobileCampaigns();
  const { mutate: createCampaign, isPending: isSendingCampaign } = useCreateMobileCampaign();
  const [pushForm, setPushForm] = useState({
    platform: 'All Platforms',
    audience: 'All Mobile Users',
    title: '',
    body: '',
    deepLink: 'clickflicks://explore',
  });

  // In-App Messages
  const { data: inAppMessages = [], isLoading: isLoadingMessages } = useMobileInAppMessages();
  const { mutate: createInAppMessage, isPending: isCreatingMessage } = useCreateMobileInAppMessage();
  const { mutate: toggleInAppMessage } = useToggleMobileInAppMessage();
  const { mutate: deleteInAppMessage } = useDeleteMobileInAppMessage();
  const [messageForm, setMessageForm] = useState({
    type: 'Banner' as 'Banner' | 'Modal' | 'Full Screen' | 'Bottom Sheet',
    title: '',
    body: '',
    trigger: 'On App Open',
    deepLink: 'clickflicks://explore',
  });

  // Deep Links
  const [linkType, setLinkType] = useState('Photographer Profile');
  const [referenceId, setReferenceId] = useState('cl7x9y1z0001');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Crash Reports
  const { data: crashes = [], isLoading: isLoadingCrashes } = useMobileCrashes();
  const { mutate: updateCrashStatus } = useUpdateMobileCrash();
  const { mutate: clearResolved, isPending: isClearingCrashes } = useClearResolvedCrashes();

  // Mobile Feature Flags
  const { data: mobileFlags = [], isLoading: isLoadingFlags } = useMobileFlags();
  const { mutate: updateFlag } = useUpdateMobileFlag();

  // Mobile A/B Tests
  const { data: abTests = [], isLoading: isLoadingAbTests } = useMobileAbTests();
  const { mutate: createAbTest, isPending: isCreatingAbTest } = useCreateMobileAbTest();
  const { mutate: toggleAbTest } = useToggleMobileAbTest();
  const { mutate: resetAbTest } = useResetMobileAbTest();
  const [newAbTest, setNewAbTest] = useState({
    name: '',
    platform: 'All Platforms',
    variantA: 'Control',
    variantB: 'Variant A',
  });

  // New Version Modal state
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVersionForm, setNewVersionForm] = useState({
    platform: 'iOS' as 'iOS' | 'Android',
    version: '2.5.0',
    buildNumber: '251',
    minRequired: '2.2.0',
    status: 'live' as 'live' | 'beta',
    releaseNotes: '',
    storeUrl: '',
  });

  const tabs = [
    { id: 'versions' as const, label: 'App Versions', icon: Upload },
    { id: 'push' as const, label: 'Push Campaigns', icon: Bell },
    { id: 'messages' as const, label: 'In-App Messages', icon: MessageSquare },
    { id: 'links' as const, label: 'Deep Links', icon: Link2 },
    { id: 'crashes' as const, label: 'Crash Reports', icon: Bug },
    { id: 'flags' as const, label: 'Feature Flags', icon: Flag },
    { id: 'abtesting' as const, label: 'A/B Testing', icon: FlaskConical },
  ];

  // Helper for deep link generation
  const resolveDeepLinks = () => {
    let slug = 'photographer';
    if (linkType === 'Booking Detail') slug = 'booking';
    else if (linkType === 'Client Gallery') slug = 'gallery';
    else if (linkType === 'Promotion/Campaign') slug = 'promo';
    else if (linkType === 'Custom Route') slug = 'route';

    const cleanRef = referenceId.trim() || 'default';
    return {
      ios: `clickflicks://${slug}/${cleanRef}`,
      android: `clickflicks://${slug}/${cleanRef}`,
      web: `https://clickflicks.com/${slug}/${cleanRef}`,
    };
  };

  const currentLinks = resolveDeepLinks();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    toast.success('Copied link to clipboard!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushForm.title.trim() || !pushForm.body.trim()) {
      toast.error('Please enter a notification title and body');
      return;
    }
    createCampaign(pushForm, {
      onSuccess: () => {
        setPushForm({
          platform: 'All Platforms',
          audience: 'All Mobile Users',
          title: '',
          body: '',
          deepLink: 'clickflicks://explore',
        });
      }
    });
  };

  const handleCreateInAppMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.title.trim() || !messageForm.body.trim()) {
      toast.error('Please enter message title and body');
      return;
    }
    createInAppMessage(messageForm, {
      onSuccess: () => {
        setMessageForm({
          type: 'Banner',
          title: '',
          body: '',
          trigger: 'On App Open',
          deepLink: 'clickflicks://explore',
        });
      }
    });
  };

  const handleCreateAbTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAbTest.name.trim()) {
      toast.error('Please enter experiment name');
      return;
    }
    createAbTest({
      name: newAbTest.name,
      platform: newAbTest.platform,
      variants: [newAbTest.variantA || 'Control', newAbTest.variantB || 'Variant A'],
    }, {
      onSuccess: () => {
        setNewAbTest({
          name: '',
          platform: 'All Platforms',
          variantA: 'Control',
          variantB: 'Variant A',
        });
      }
    });
  };

  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    createVersion(newVersionForm, {
      onSuccess: () => {
        setShowNewVersionModal(false);
        setNewVersionForm({
          platform: 'iOS',
          version: '',
          buildNumber: '',
          minRequired: '2.2.0',
          status: 'live',
          releaseNotes: '',
          storeUrl: '',
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              Mobile App Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Live version releases, push notification campaigns, in-app messaging, and telemetry
            </p>
          </div>
          <button
            onClick={() => setShowNewVersionModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold flex items-center gap-2 shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Publish New Release
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Installs', value: (mobileStats?.totalInstalls || 36170).toLocaleString(), change: '+8.2%', icon: Download, color: 'blue' },
            { label: 'Active Users (7d)', value: (mobileStats?.activeUsers7d || 14845).toLocaleString(), change: '+3.1%', icon: Users, color: 'green' },
            { label: 'Crash-Free Rate', value: `${mobileStats?.crashFreeRate || 99.8}%`, change: '+0.3%', icon: CheckCircle, color: 'purple' },
            { label: 'Avg Rating', value: `${mobileStats?.avgStoreRating || 4.85}`, change: '+0.1', icon: Star, color: 'orange' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn('w-5 h-5',
                    stat.color === 'blue' && 'text-blue-500',
                    stat.color === 'green' && 'text-green-500',
                    stat.color === 'purple' && 'text-purple-500',
                    stat.color === 'orange' && 'text-orange-500',
                  )} />
                  <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            );
          })}
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
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
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

        {/* 1. App Versions */}
        {activeTab === 'versions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {appVersions.map((ver) => (
                <div key={`${ver.platform}-${ver.version}`} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
                      ver.platform === 'iOS' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-green-50 dark:bg-green-900/20'
                    )}>
                      <Smartphone className={cn('w-6 h-6',
                        ver.platform === 'iOS' ? 'text-gray-700 dark:text-gray-200' : 'text-green-600'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-base">{ver.platform} v{ver.version}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium uppercase',
                          ver.status === 'live' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        )}>
                          {ver.status}
                        </span>
                        {ver.forceUpdate && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Force Update Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Build #{ver.buildNumber} | Min required: v{ver.minRequired}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Released: {ver.releaseDate} | {ver.users.toLocaleString()} active devices</p>
                      {ver.releaseNotes && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded max-w-xl">
                          📝 {ver.releaseNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => updateAppVersion({ platform: ver.platform, updates: { forceUpdate: !ver.forceUpdate } })}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg transition-colors font-medium cursor-pointer",
                        ver.forceUpdate
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                      )}
                    >
                      {ver.forceUpdate ? 'Disable Force Update' : 'Force Update'}
                    </button>
                    <button
                      onClick={() => broadcastSoftUpdate(ver.platform)}
                      disabled={isBroadcastingUpdate}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-medium cursor-pointer disabled:opacity-50"
                    >
                      Broadcast Soft Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 2. Push Campaigns */}
        {activeTab === 'push' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" /> Mobile Push Campaign Broadcast
              </h3>
              <form onSubmit={handleSendPush} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Platform</label>
                    <select
                      value={pushForm.platform}
                      onChange={(e) => setPushForm({ ...pushForm, platform: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option>All Platforms</option>
                      <option>iOS Only</option>
                      <option>Android Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Audience</label>
                    <select
                      value={pushForm.audience}
                      onChange={(e) => setPushForm({ ...pushForm, audience: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option>All Mobile Users</option>
                      <option>Active Users (Last 7 days)</option>
                      <option>Dormant Users (30+ days)</option>
                      <option>Photographers</option>
                      <option>Clients</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Title</label>
                  <input
                    value={pushForm.title}
                    onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })}
                    placeholder="e.g., Weekend Flash: 20% Off Wedding & Portrait Shoots"
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Body</label>
                  <textarea
                    rows={3}
                    value={pushForm.body}
                    onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })}
                    placeholder="Enter notification message..."
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Deep Link Route</label>
                  <input
                    value={pushForm.deepLink}
                    onChange={(e) => setPushForm({ ...pushForm, deepLink: e.target.value })}
                    placeholder="clickflicks://explore"
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingCampaign}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> {isSendingCampaign ? 'Broadcasting...' : 'Broadcast Campaign'}
                </button>
              </form>
            </div>

            {/* Campaign History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Broadcast History</h3>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{camp.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{camp.body}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>🎯 {camp.audience}</span>
                        <span>📱 {camp.platform}</span>
                        <span>👥 {camp.targetCount.toLocaleString()} devices</span>
                        <span>🕒 {camp.sentAt}</span>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {camp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. In-App Messages */}
        {activeTab === 'messages' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" /> In-App Message Editor
              </h3>
              <form onSubmit={handleCreateInAppMessage} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Message Format</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Banner', 'Modal', 'Full Screen', 'Bottom Sheet'] as const).map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setMessageForm({ ...messageForm, type })}
                        className={cn(
                          'px-4 py-2 text-sm rounded-lg transition-colors font-medium cursor-pointer',
                          messageForm.type === type
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Title</label>
                  <input
                    value={messageForm.title}
                    onChange={(e) => setMessageForm({ ...messageForm, title: e.target.value })}
                    placeholder="e.g., Welcome to ClickFlicks v2.5 🎉"
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Body</label>
                  <textarea
                    rows={3}
                    value={messageForm.body}
                    onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })}
                    placeholder="Enter message content displayed to users..."
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Display Trigger</label>
                    <select
                      value={messageForm.trigger}
                      onChange={(e) => setMessageForm({ ...messageForm, trigger: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option>On App Open</option>
                      <option>After First Booking</option>
                      <option>After 3 Days of Inactivity</option>
                      <option>On Profile Page Visit</option>
                      <option>Custom Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Action Deep Link</label>
                    <input
                      value={messageForm.deepLink}
                      onChange={(e) => setMessageForm({ ...messageForm, deepLink: e.target.value })}
                      placeholder="clickflicks://explore"
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingMessage}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> {isCreatingMessage ? 'Scheduling...' : 'Schedule In-App Message'}
                </button>
              </form>
            </div>

            {/* Active In-App Messages */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Active Mobile In-App Messages</h3>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {inAppMessages.map((msg) => (
                  <div key={msg.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{msg.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {msg.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          ⚡ {msg.trigger}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{msg.body}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {msg.views.toLocaleString()} views</span>
                        <span className="flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5" /> {msg.clicks.toLocaleString()} clicks</span>
                        {msg.deepLink && <code className="font-mono text-blue-500">{msg.deepLink}</code>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleInAppMessage(msg.id)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                          msg.active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        )}
                      >
                        {msg.active ? 'Active' : 'Paused'}
                      </button>
                      <button
                        onClick={() => deleteInAppMessage(msg.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. Deep Links */}
        {activeTab === 'links' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-600" /> Deep Link & Universal Route Generator
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Target Destination</label>
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option>Photographer Profile</option>
                    <option>Booking Detail</option>
                    <option>Client Gallery</option>
                    <option>Promotion/Campaign</option>
                    <option>Custom Route</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Resource / Identifier ID</label>
                  <input
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="e.g., cl7x9y1z0001 or booking_id"
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Generated System Links:</p>
                
                <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-16">iOS:</span>
                  <code className="text-xs text-purple-600 dark:text-purple-400 font-mono flex-1 truncate">{currentLinks.ios}</code>
                  <button
                    onClick={() => handleCopy(currentLinks.ios, 'ios')}
                    className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink === 'ios' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copiedLink === 'ios' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-16">Android:</span>
                  <code className="text-xs text-purple-600 dark:text-purple-400 font-mono flex-1 truncate">{currentLinks.android}</code>
                  <button
                    onClick={() => handleCopy(currentLinks.android, 'android')}
                    className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink === 'android' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copiedLink === 'android' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-16">Web URL:</span>
                  <code className="text-xs text-blue-600 dark:text-blue-400 font-mono flex-1 truncate">{currentLinks.web}</code>
                  <button
                    onClick={() => handleCopy(currentLinks.web, 'web')}
                    className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink === 'web' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copiedLink === 'web' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="https://apps.apple.com/app/clickflicks"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> App Store Listing
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.clickflicks.app"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Google Play Listing
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* 5. Crash Reports */}
        {activeTab === 'crashes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Mobile Runtime Error Telemetry</h3>
                <p className="text-xs text-gray-500">Errors and unhandled exceptions reported live by ClickFlicks mobile apps</p>
              </div>
              <button
                onClick={() => clearResolved()}
                disabled={isClearingCrashes}
                className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Resolved
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {crashes.map((crash) => (
                <div key={crash.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Bug className={cn('w-4 h-4',
                          crash.status === 'open' ? 'text-red-500' :
                          crash.status === 'investigating' ? 'text-yellow-500' : 'text-green-500'
                        )} />
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{crash.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="font-medium">{crash.platform} v{crash.version}</span>
                        <span>•</span>
                        <span>{crash.occurrences} occurrences</span>
                        <span>•</span>
                        <span>{crash.users} users affected</span>
                        <span>•</span>
                        <span>Last seen: {new Date(crash.lastSeen).toLocaleString()}</span>
                      </div>
                      {crash.stackTrace && (
                        <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/60 rounded text-xs text-gray-700 dark:text-gray-300 font-mono overflow-x-auto max-w-2xl">
                          {crash.stackTrace}
                        </pre>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={crash.status}
                        onChange={(e) => updateCrashStatus({ id: crash.id, status: e.target.value })}
                        className={cn('text-xs px-2.5 py-1 rounded font-medium border bg-white dark:bg-gray-700',
                          crash.status === 'open' ? 'border-red-300 text-red-700' :
                          crash.status === 'investigating' ? 'border-yellow-300 text-yellow-700' : 'border-green-300 text-green-700'
                        )}
                      >
                        <option value="open">Open</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 6. Feature Flags */}
        {activeTab === 'flags' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {mobileFlags.map((flag) => (
                <div key={flag.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{flag.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                        {flag.environment}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{flag.description}</p>
                  </div>
                  <button
                    onClick={() => updateFlag({ id: flag.id, enabled: !flag.enabled })}
                    className={cn(
                      'text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors cursor-pointer',
                      flag.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                    )}
                  >
                    {flag.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 7. A/B Testing */}
        {activeTab === 'abtesting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-600" /> Launch Mobile A/B Experiment
              </h3>
              <form onSubmit={handleCreateAbTest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Experiment Title</label>
                    <input
                      value={newAbTest.name}
                      onChange={(e) => setNewAbTest({ ...newAbTest, name: e.target.value })}
                      placeholder="e.g., Onboarding Reel vs Step Carousel"
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Platform</label>
                    <select
                      value={newAbTest.platform}
                      onChange={(e) => setNewAbTest({ ...newAbTest, platform: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option>All Platforms</option>
                      <option>iOS Only</option>
                      <option>Android Only</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Variant A (Control)</label>
                    <input
                      value={newAbTest.variantA}
                      onChange={(e) => setNewAbTest({ ...newAbTest, variantA: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Variant B (Test)</label>
                    <input
                      value={newAbTest.variantB}
                      onChange={(e) => setNewAbTest({ ...newAbTest, variantB: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingAbTest}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" /> {isCreatingAbTest ? 'Launching...' : 'Launch Experiment'}
                </button>
              </form>
            </div>

            {/* Active A/B Tests List */}
            <div className="space-y-4">
              {abTests.map((test) => (
                <div key={test.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-base">{test.name}</h4>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          test.status === 'running' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700'
                        )}>
                          {test.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {test.platform}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Started: {test.startDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAbTest(test.id)}
                        className={cn(
                          'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                          test.status === 'running'
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                        )}
                      >
                        {test.status === 'running' ? 'Pause Experiment' : 'Resume Experiment'}
                      </button>
                      <button
                        onClick={() => resetAbTest(test.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Reset metrics"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {test.variants.map((variant, vi) => (
                      <div key={variant} className={cn('p-3.5 rounded-lg border',
                        test.conversions[vi] === Math.max(...test.conversions)
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                          : 'border-gray-200 dark:border-gray-700'
                      )}>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{variant}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Traffic Allocation: {test.traffic[vi]}%</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">{test.conversions[vi]}%</p>
                        <p className="text-xs text-gray-400">conversion rate</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Publish Release Modal */}
      <AnimatePresence>
        {showNewVersionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Publish New App Release</h3>
              <form onSubmit={handleCreateVersion} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Platform</label>
                    <select
                      value={newVersionForm.platform}
                      onChange={(e) => setNewVersionForm({ ...newVersionForm, platform: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="iOS">iOS</option>
                      <option value="Android">Android</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Version Number</label>
                    <input
                      value={newVersionForm.version}
                      onChange={(e) => setNewVersionForm({ ...newVersionForm, version: e.target.value })}
                      placeholder="e.g. 2.5.0"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Build Number</label>
                    <input
                      value={newVersionForm.buildNumber}
                      onChange={(e) => setNewVersionForm({ ...newVersionForm, buildNumber: e.target.value })}
                      placeholder="e.g. 251"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Min Required Version</label>
                    <input
                      value={newVersionForm.minRequired}
                      onChange={(e) => setNewVersionForm({ ...newVersionForm, minRequired: e.target.value })}
                      placeholder="e.g. 2.2.0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Release Notes</label>
                  <textarea
                    rows={2}
                    value={newVersionForm.releaseNotes}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, releaseNotes: e.target.value })}
                    placeholder="Describe new features or bug fixes in this release..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Store / TestFlight URL</label>
                  <input
                    value={newVersionForm.storeUrl}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, storeUrl: e.target.value })}
                    placeholder="https://apps.apple.com/app/clickflicks..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewVersionModal(false)}
                    className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingVersion}
                    className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium disabled:opacity-50"
                  >
                    {isCreatingVersion ? 'Publishing...' : 'Publish Release'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
