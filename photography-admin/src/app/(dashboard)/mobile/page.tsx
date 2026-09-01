'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone, Upload, Bell, MessageSquare, Link2, Bug,
  Flag, FlaskConical, CheckCircle, AlertTriangle, Download,
  ExternalLink, TrendingUp, Users, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

import {
  useMobileVersions,
  useMobileStats,
  useMobileCrashes,
  useUpdateMobileVersion
} from '@/hooks/use-mobile';
import { useFeatureFlags, useUpdateFeatureFlag } from '@/hooks/use-system';

type MobileTab = 'versions' | 'push' | 'messages' | 'links' | 'crashes' | 'flags' | 'abtesting';

export default function MobileAppManagementPage() {
  const [activeTab, setActiveTab] = useState<MobileTab>('versions');

  // Live queries & mutations
  const { data: appVersions = [], isLoading: isLoadingVersions } = useMobileVersions();
  const { data: mobileStats } = useMobileStats();
  const { data: crashes = [], isLoading: isLoadingCrashes } = useMobileCrashes();
  const { mutate: updateAppVersion } = useUpdateMobileVersion();
  const { data: flags = [] } = useFeatureFlags();
  const { mutate: updateFlag } = useUpdateFeatureFlag();

  const tabs = [
    { id: 'versions' as const, label: 'App Versions', icon: Upload },
    { id: 'push' as const, label: 'Push Campaigns', icon: Bell },
    { id: 'messages' as const, label: 'In-App Messages', icon: MessageSquare },
    { id: 'links' as const, label: 'Deep Links', icon: Link2 },
    { id: 'crashes' as const, label: 'Crash Reports', icon: Bug },
    { id: 'flags' as const, label: 'Feature Flags', icon: Flag },
    { id: 'abtesting' as const, label: 'A/B Testing', icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Mobile App Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage mobile app version releases, push campaigns, and crash monitoring
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Installs', value: (mobileStats?.totalInstalls || 31200).toLocaleString(), change: '+8.2%', icon: Download, color: 'blue' },
            { label: 'Active Users (7d)', value: (mobileStats?.activeUsers7d || 12400).toLocaleString(), change: '+3.1%', icon: Users, color: 'green' },
            { label: 'Crash-Free Rate', value: `${mobileStats?.crashFreeRate || 99.8}%`, change: '+0.3%', icon: CheckCircle, color: 'purple' },
            { label: 'Avg Rating', value: `${mobileStats?.avgStoreRating || 4.8}`, change: '+0.1', icon: Star, color: 'orange' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
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

        {/* App Versions */}
        {activeTab === 'versions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {appVersions.map((ver, i) => (
                <div key={`${ver.platform}-${ver.version}`} className={cn('flex items-center justify-between p-4',
                  i < appVersions.length - 1 && 'border-b border-gray-200 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center',
                      ver.platform === 'iOS' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-green-50 dark:bg-green-900/20'
                    )}>
                      <Smartphone className={cn('w-6 h-6',
                        ver.platform === 'iOS' ? 'text-gray-600' : 'text-green-600'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{ver.platform} v{ver.version}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          ver.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        )}>
                          {ver.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Build #{ver.buildNumber} | Min required: v{ver.minRequired}</p>
                      <p className="text-xs text-gray-400">Released: {ver.releaseDate} | {ver.users.toLocaleString()} users</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateAppVersion({ platform: ver.platform, updates: { forceUpdate: !ver.forceUpdate } })}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg transition-colors font-medium",
                        ver.forceUpdate ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                      )}
                    >
                      {ver.forceUpdate ? 'Force Update Active' : 'Force Update'}
                    </button>
                    <button
                      onClick={() => toast.success(`Soft update notice broadcast to ${ver.platform}`)}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      Soft Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Push Campaigns */}
        {activeTab === 'push' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mobile Push Campaign</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Platform</label>
                  <select className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>All Platforms</option>
                    <option>iOS Only</option>
                    <option>Android Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Audience</label>
                  <select className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>All Mobile Users</option>
                    <option>Active Users (Last 7 days)</option>
                    <option>Dormant Users (30+ days)</option>
                    <option>Premium Users</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Title</label>
                <input placeholder="Push notification title..." className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Body</label>
                <textarea rows={3} placeholder="Notification body..." className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Deep Link (optional)</label>
                <input placeholder="photobook://booking/123" className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
              </div>
              <button onClick={() => toast.success('Push campaign scheduled')} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                Send Campaign
              </button>
            </div>
          </motion.div>
        )}

        {/* In-App Messages */}
        {activeTab === 'messages' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">In-App Message Editor</h3>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Message Type</label>
                <div className="flex gap-2">
                  {['Banner', 'Modal', 'Full Screen', 'Bottom Sheet'].map((type) => (
                    <button key={type} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Title</label>
                <input placeholder="In-app message title..." className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Body</label>
                <textarea rows={4} placeholder="Message content..." className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Trigger</label>
                <select className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>On App Open</option>
                  <option>After First Booking</option>
                  <option>After 3 Days of Inactivity</option>
                  <option>On Profile Page Visit</option>
                  <option>Custom Event</option>
                </select>
              </div>
              <button onClick={() => toast.success('In-app message scheduled')} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                Schedule Message
              </button>
            </div>
          </motion.div>
        )}

        {/* Deep Links */}
        {activeTab === 'links' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deep Link Generator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Link Type</label>
                  <select className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>Photographer Profile</option>
                    <option>Booking Detail</option>
                    <option>Promotion/Campaign</option>
                    <option>App Store Page</option>
                    <option>Custom Route</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Reference ID</label>
                  <input placeholder="e.g., photographer_id" className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Generated Links:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-20">iOS:</span>
                    <code className="text-xs text-blue-600 font-mono flex-1">photobook://photographer/abc123</code>
                    <button className="text-xs text-blue-600 hover:underline">Copy</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-20">Android:</span>
                    <code className="text-xs text-blue-600 font-mono flex-1">photobook://photographer/abc123</code>
                    <button className="text-xs text-blue-600 hover:underline">Copy</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-20">Web:</span>
                    <code className="text-xs text-blue-600 font-mono flex-1">https://photobook.gh/photographer/abc123</code>
                    <button className="text-xs text-blue-600 hover:underline">Copy</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <ExternalLink className="w-4 h-4" /> App Store
                </a>
                <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Google Play
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Crash Reports */}
        {activeTab === 'crashes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {crashes.map((crash, i) => (
                <div key={crash.id} className={cn('p-4', i < crashes.length - 1 && 'border-b border-gray-200 dark:border-gray-700')}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Bug className={cn('w-4 h-4',
                          crash.status === 'open' ? 'text-red-500' :
                          crash.status === 'investigating' ? 'text-yellow-500' :
                          crash.status === 'fixed' ? 'text-green-500' : 'text-blue-500'
                        )} />
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{crash.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{crash.platform} v{crash.version}</span>
                        <span className="text-xs text-gray-500">{crash.occurrences} occurrences</span>
                        <span className="text-xs text-gray-500">{crash.users} users affected</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Last seen: {new Date(crash.lastSeen).toLocaleString()}</p>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      crash.status === 'open' ? 'bg-red-100 text-red-700' :
                      crash.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' :
                      crash.status === 'fixed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {crash.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mobile Feature Flags */}
        {activeTab === 'flags' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {flags.map((flag, i) => (
                <div key={flag.id} className={cn('flex items-center justify-between p-4',
                  i < flags.length - 1 && 'border-b border-gray-200 dark:border-gray-700'
                )}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{flag.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{flag.environment}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{flag.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateFlag({ id: flag.id, enabled: !flag.enabled })}
                      className={cn('text-xs font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer',
                        flag.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {flag.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* A/B Testing */}
        {activeTab === 'abtesting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mobile A/B Testing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Test Name</label>
                  <input placeholder="e.g., New Onboarding Flow" className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Platform</label>
                  <select className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>All Platforms</option>
                    <option>iOS Only</option>
                    <option>Android Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Variants</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input defaultValue="Control" className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <input type="number" defaultValue={50} className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input defaultValue="Variant A" className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <input type="number" defaultValue={50} className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
              <button onClick={() => toast.success('A/B test created')} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                Start Test
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
