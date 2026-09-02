"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Save,
  Globe,
  DollarSign,
  Bell,
  Mail,
  Shield,
  AlertTriangle,
  FileText,
  Upload,
  CheckCircle,
  Info,
  Zap,
  Loader2,
  Smartphone,
  Key,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useTwoFactorStatus, useTwoFactorSetupFlow, useDisableTwoFactor, useRegenerateBackupCodes } from "@/hooks/use-two-factor";

// Settings sections
type SettingsSection = "general" | "commission" | "pricing" | "payment" | "notifications" | "security" | "policies" | "ipwhitelist";

interface SystemSettings {
  // General Settings
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  maintenanceMode: boolean;

  // Commission Rates (percentage)
  freeCommissionRate: number;
  proCommissionRate: number;
  enterpriseCommissionRate: number;

  // Subscription Prices
  proMonthlyPrice: number;
  proYearlyPrice: number;
  enterpriseMonthlyPrice: number;
  enterpriseYearlyPrice: number;

  // Payment Settings
  paystackPublicKey: string;
  paystackSecretKey: string;
  minimumWithdrawal: number;
  withdrawalProcessingDays: number;

  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  bookingAlerts: boolean;
  paymentAlerts: boolean;
  disputeAlerts: boolean;

  // Security Settings
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;

  // File Upload Settings
  maxFileSize: number;
  allowedFileTypes: string[];
  maxImagesPerBooking: number;
  ipWhitelist: string[];
}

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: "ClickFlicks",
  siteUrl: "https://clickflicks.gh",
  supportEmail: "support@clickflicks.gh",
  supportPhone: "+233 50 123 4567",
  currency: "GHS",
  timezone: "Africa/Accra",
  maintenanceMode: false,

  freeCommissionRate: 15,
  proCommissionRate: 10,
  enterpriseCommissionRate: 5,

  proMonthlyPrice: 50,
  proYearlyPrice: 500,
  enterpriseMonthlyPrice: 200,
  enterpriseYearlyPrice: 2000,

  paystackPublicKey: "pk_test_28b6530177a30570a89ce19287697208bdb8b66a",
  paystackSecretKey: "",
  minimumWithdrawal: 100,
  withdrawalProcessingDays: 1,

  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  bookingAlerts: true,
  paymentAlerts: true,
  disputeAlerts: true,

  requireEmailVerification: true,
  requirePhoneVerification: false,
  twoFactorAuth: false,
  sessionTimeout: 1440,

  maxFileSize: 50,
  allowedFileTypes: ["jpg", "jpeg", "png", "pdf", "raw"],
  maxImagesPerBooking: 100,
  ipWhitelist: [],
};

const CURRENCY_OPTIONS = [
  { label: "Ghanaian Cedi (GHS)", value: "GHS" },
  { label: "US Dollar (USD)", value: "USD" },
  { label: "Euro (EUR)", value: "EUR" },
  { label: "British Pound (GBP)", value: "GBP" },
];

const TIMEZONE_OPTIONS = [
  { label: "Africa/Accra (GMT)", value: "Africa/Accra" },
  { label: "Africa/Lagos (WAT)", value: "Africa/Lagos" },
  { label: "UTC", value: "UTC" },
  { label: "America/New_York (EST)", value: "America/New_York" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  // Fetch settings from API
  const { data: apiSettings, isLoading, error } = useSettings();
  const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings();

  // Update local settings when API data loads
  useEffect(() => {
    if (apiSettings) {
      setSettings({
        siteName: apiSettings.general?.siteName || DEFAULT_SETTINGS.siteName,
        siteUrl: apiSettings.general?.siteUrl || DEFAULT_SETTINGS.siteUrl,
        supportEmail: apiSettings.general?.supportEmail || DEFAULT_SETTINGS.supportEmail,
        supportPhone: apiSettings.general?.supportPhone || DEFAULT_SETTINGS.supportPhone,
        currency: apiSettings.general?.currency || DEFAULT_SETTINGS.currency,
        timezone: apiSettings.general?.timezone || DEFAULT_SETTINGS.timezone,
        maintenanceMode: apiSettings.general?.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode,

        freeCommissionRate: apiSettings.commissionRates?.FREE ?? DEFAULT_SETTINGS.freeCommissionRate,
        proCommissionRate: apiSettings.commissionRates?.PRO ?? DEFAULT_SETTINGS.proCommissionRate,
        enterpriseCommissionRate: apiSettings.commissionRates?.ENTERPRISE ?? DEFAULT_SETTINGS.enterpriseCommissionRate,

        proMonthlyPrice: apiSettings.subscription?.PRO?.monthly ?? DEFAULT_SETTINGS.proMonthlyPrice,
        proYearlyPrice: apiSettings.subscription?.PRO?.yearly ?? DEFAULT_SETTINGS.proYearlyPrice,
        enterpriseMonthlyPrice: apiSettings.subscription?.ENTERPRISE?.monthly ?? DEFAULT_SETTINGS.enterpriseMonthlyPrice,
        enterpriseYearlyPrice: apiSettings.subscription?.ENTERPRISE?.yearly ?? DEFAULT_SETTINGS.enterpriseYearlyPrice,

        paystackPublicKey: apiSettings.payment?.paystackPublicKey || DEFAULT_SETTINGS.paystackPublicKey,
        paystackSecretKey: apiSettings.payment?.paystackSecretKey || "",
        minimumWithdrawal: apiSettings.payment?.minimumWithdrawal ?? DEFAULT_SETTINGS.minimumWithdrawal,
        withdrawalProcessingDays: apiSettings.payment?.processingTime ?? DEFAULT_SETTINGS.withdrawalProcessingDays,

        emailNotifications: apiSettings.notifications?.emailEnabled ?? DEFAULT_SETTINGS.emailNotifications,
        smsNotifications: apiSettings.notifications?.smsEnabled ?? DEFAULT_SETTINGS.smsNotifications,
        pushNotifications: apiSettings.notifications?.pushEnabled ?? DEFAULT_SETTINGS.pushNotifications,
        bookingAlerts: apiSettings.notifications?.bookingAlerts ?? DEFAULT_SETTINGS.bookingAlerts,
        paymentAlerts: apiSettings.notifications?.paymentAlerts ?? DEFAULT_SETTINGS.paymentAlerts,
        disputeAlerts: apiSettings.notifications?.disputeAlerts ?? DEFAULT_SETTINGS.disputeAlerts,

        requireEmailVerification: apiSettings.security?.requireEmailVerification ?? DEFAULT_SETTINGS.requireEmailVerification,
        requirePhoneVerification: apiSettings.security?.requirePhoneVerification ?? DEFAULT_SETTINGS.requirePhoneVerification,
        twoFactorAuth: apiSettings.security?.twoFactorEnabled ?? DEFAULT_SETTINGS.twoFactorAuth,
        sessionTimeout: apiSettings.security?.sessionTimeout ?? DEFAULT_SETTINGS.sessionTimeout,

        maxFileSize: apiSettings.policies?.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
        allowedFileTypes: apiSettings.policies?.allowedFileTypes || DEFAULT_SETTINGS.allowedFileTypes,
        maxImagesPerBooking: apiSettings.policies?.maxImagesPerBooking ?? DEFAULT_SETTINGS.maxImagesPerBooking,
        ipWhitelist: apiSettings.ipWhitelist || [],
      });
    }
  }, [apiSettings]);

  const handleSave = () => {
    // Transform flat settings to nested structure expected by API
    updateSettings({
      general: {
        siteName: settings.siteName,
        siteUrl: settings.siteUrl,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        currency: settings.currency,
        timezone: settings.timezone,
        maintenanceMode: settings.maintenanceMode,
      },
      commissionRates: {
        FREE: settings.freeCommissionRate,
        PRO: settings.proCommissionRate,
        ENTERPRISE: settings.enterpriseCommissionRate,
      },
      subscription: {
        PRO: {
          monthly: settings.proMonthlyPrice,
          yearly: settings.proYearlyPrice,
        },
        ENTERPRISE: {
          monthly: settings.enterpriseMonthlyPrice,
          yearly: settings.enterpriseYearlyPrice,
        },
      },
      payment: {
        paystackPublicKey: settings.paystackPublicKey,
        paystackSecretKey: settings.paystackSecretKey,
        minimumWithdrawal: settings.minimumWithdrawal,
        processingTime: settings.withdrawalProcessingDays,
      },
      notifications: {
        emailEnabled: settings.emailNotifications,
        smsEnabled: settings.smsNotifications,
        pushEnabled: settings.pushNotifications,
        bookingAlerts: settings.bookingAlerts,
        paymentAlerts: settings.paymentAlerts,
        disputeAlerts: settings.disputeAlerts,
      },
      security: {
        requireEmailVerification: settings.requireEmailVerification,
        requirePhoneVerification: settings.requirePhoneVerification,
        twoFactorEnabled: settings.twoFactorAuth,
        sessionTimeout: settings.sessionTimeout,
      },
      policies: {
        maxFileSize: settings.maxFileSize,
        maxImagesPerBooking: settings.maxImagesPerBooking,
        allowedFileTypes: settings.allowedFileTypes,
      },
      ipWhitelist: settings.ipWhitelist || [],
    });
  };

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const sections = [
    { id: "general" as const, label: "General", icon: Globe },
    { id: "commission" as const, label: "Commission Rates", icon: DollarSign },
    { id: "pricing" as const, label: "Subscription Pricing", icon: Zap },
    { id: "payment" as const, label: "Payment Settings", icon: DollarSign },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "policies" as const, label: "Policies & Limits", icon: FileText },
    { id: "ipwhitelist" as const, label: "IP Whitelist", icon: Shield },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <h3 className="text-red-900 dark:text-red-200 font-semibold mb-2">Failed to load settings</h3>
          <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              System Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure platform settings and preferences
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors",
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-6">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                        activeSection === section.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* General Settings */}
              {activeSection === "general" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">General Settings</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Basic platform configuration and contact information
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => updateSetting("siteName", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Site URL
                      </label>
                      <input
                        type="url"
                        value={settings.siteUrl}
                        onChange={(e) => updateSetting("siteUrl", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => updateSetting("supportEmail", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Support Phone
                      </label>
                      <input
                        type="tel"
                        value={settings.supportPhone}
                        onChange={(e) => updateSetting("supportPhone", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={settings.currency}
                        onChange={(e) => updateSetting("currency", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {CURRENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => updateSetting("timezone", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {TIMEZONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => updateSetting("maintenanceMode", e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Maintenance Mode
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Enable this to show a maintenance page to users
                        </p>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Commission Rates */}
              {activeSection === "commission" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Commission Rates</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Set platform commission rates for different photographer tiers
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Commission Structure
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Commission is deducted from each completed booking payment before releasing funds to photographers
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Free Tier</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Commission Rate (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={settings.freeCommissionRate}
                              onChange={(e) => updateSetting("freeCommissionRate", Number(e.target.value))}
                              min={0}
                              max={100}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="absolute right-4 top-2.5 text-gray-500 dark:text-gray-400">%</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            For photographers without subscription
                          </p>
                        </div>
                      </div>

                      <div className="p-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pro Tier</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Commission Rate (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={settings.proCommissionRate}
                              onChange={(e) => updateSetting("proCommissionRate", Number(e.target.value))}
                              min={0}
                              max={100}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="absolute right-4 top-2.5 text-gray-500 dark:text-gray-400">%</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            For Pro subscription photographers
                          </p>
                        </div>
                      </div>

                      <div className="p-4 border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enterprise Tier</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Commission Rate (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={settings.enterpriseCommissionRate}
                              onChange={(e) => updateSetting("enterpriseCommissionRate", Number(e.target.value))}
                              min={0}
                              max={100}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="absolute right-4 top-2.5 text-gray-500 dark:text-gray-400">%</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            For Enterprise subscription photographers
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Subscription Pricing */}
              {activeSection === "pricing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subscription Pricing</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Configure subscription plans and pricing for photographers
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pro Plan</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Monthly Price (₵)
                            </label>
                            <input
                              type="number"
                              value={settings.proMonthlyPrice}
                              onChange={(e) => updateSetting("proMonthlyPrice", Number(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Yearly Price (₵)
                            </label>
                            <input
                              type="number"
                              value={settings.proYearlyPrice}
                              onChange={(e) => updateSetting("proYearlyPrice", Number(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Yearly savings: {((1 - settings.proYearlyPrice / (settings.proMonthlyPrice * 12)) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border-2 border-purple-200 dark:border-purple-800 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enterprise Plan</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Monthly Price (₵)
                            </label>
                            <input
                              type="number"
                              value={settings.enterpriseMonthlyPrice}
                              onChange={(e) => updateSetting("enterpriseMonthlyPrice", Number(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Yearly Price (₵)
                            </label>
                            <input
                              type="number"
                              value={settings.enterpriseYearlyPrice}
                              onChange={(e) => updateSetting("enterpriseYearlyPrice", Number(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Yearly savings: {((1 - settings.enterpriseYearlyPrice / (settings.enterpriseMonthlyPrice * 12)) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Payment Settings */}
              {activeSection === "payment" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Settings</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Configure payment gateway and withdrawal settings
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            Sensitive Information
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            API keys should be kept secure. Never share them publicly.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Paystack Public Key
                        </label>
                        <input
                          type="text"
                          value={settings.paystackPublicKey}
                          onChange={(e) => updateSetting("paystackPublicKey", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Paystack Secret Key
                        </label>
                        <input
                          type="password"
                          value={settings.paystackSecretKey}
                          onChange={(e) => updateSetting("paystackSecretKey", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Minimum Withdrawal Amount (₵)
                          </label>
                          <input
                            type="number"
                            value={settings.minimumWithdrawal}
                            onChange={(e) => updateSetting("minimumWithdrawal", Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Withdrawal Processing Days
                          </label>
                          <input
                            type="number"
                            value={settings.withdrawalProcessingDays}
                            onChange={(e) => updateSetting("withdrawalProcessingDays", Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notification Settings */}
              {activeSection === "notifications" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notification Settings</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Configure system notifications and alerts
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Send email notifications to users
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => updateSetting("emailNotifications", e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Send SMS notifications to users (additional charges apply)
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.smsNotifications}
                          onChange={(e) => updateSetting("smsNotifications", e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Send push notifications to mobile apps
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.pushNotifications}
                          onChange={(e) => updateSetting("pushNotifications", e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                        Admin Alert Types
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.bookingAlerts}
                            onChange={(e) => updateSetting("bookingAlerts", e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Booking Alerts (new bookings, cancellations)
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.paymentAlerts}
                            onChange={(e) => updateSetting("paymentAlerts", e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Payment Alerts (successful payments, refunds)
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.disputeAlerts}
                            onChange={(e) => updateSetting("disputeAlerts", e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Dispute Alerts (new disputes, escalations)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security Settings */}
              {activeSection === "security" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Configure authentication and security requirements
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Require Email Verification</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Users must verify email before using the platform
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.requireEmailVerification}
                          onChange={(e) => updateSetting("requireEmailVerification", e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Require Phone Verification</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Photographers must verify phone number
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.requirePhoneVerification}
                          onChange={(e) => updateSetting("requirePhoneVerification", e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication (Platform Setting)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Require 2FA for all admin accounts platform-wide
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.twoFactorAuth}
                          onChange={(e) => updateSetting("twoFactorAuth", e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    {/* 2FA Setup for Current Admin */}
                    <TwoFactorSetupSection />

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <label className="block">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">
                          Session Timeout (minutes)
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Users will be logged out after this period of inactivity
                        </p>
                        <input
                          type="number"
                          value={settings.sessionTimeout}
                          onChange={(e) => updateSetting("sessionTimeout", Number(e.target.value))}
                          min={5}
                          max={1440}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* IP Whitelist */}
              {activeSection === "ipwhitelist" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">IP Whitelist</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Restrict admin dashboard access to specific IP addresses
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                          Caution
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          Enabling IP whitelist without adding your current IP will lock you out. Your current IP will be auto-added.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Enable IP Whitelist</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Only allow admin access from whitelisted IP addresses
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Whitelisted IP Addresses
                    </label>
                    <div className="space-y-2 mb-3">
                      {['192.168.1.1', '10.0.0.1', '203.0.113.50'].map((ip) => (
                        <div key={ip} className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="font-mono text-sm text-gray-900 dark:text-white">{ip}</span>
                          <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter IP address (e.g., 192.168.1.1)"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Add IP
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Policies & Limits */}
              {activeSection === "policies" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Policies & Limits</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Configure file upload limits and platform policies
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max File Size (MB)
                        </label>
                        <input
                          type="number"
                          value={settings.maxFileSize}
                          onChange={(e) => updateSetting("maxFileSize", Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Maximum size for individual file uploads
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Images Per Booking
                        </label>
                        <input
                          type="number"
                          value={settings.maxImagesPerBooking}
                          onChange={(e) => updateSetting("maxImagesPerBooking", Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Maximum number of images photographers can deliver
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Allowed File Types
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {settings.allowedFileTypes.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                          >
                            {type}
                            <button
                              onClick={() =>
                                updateSetting(
                                  "allowedFileTypes",
                                  settings.allowedFileTypes.filter((t) => t !== type)
                                )
                              }
                              className="hover:text-blue-900 dark:hover:text-blue-100"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Add file type (e.g., webp) and press Enter"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            const value = (e.target as HTMLInputElement).value.trim().toLowerCase();
                            if (value && !settings.allowedFileTypes.includes(value)) {
                              updateSetting("allowedFileTypes", [...settings.allowedFileTypes, value]);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* IP Whitelist Section */}
              {activeSection === "ipwhitelist" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Admin IP Access Whitelist</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Restrict administrator panel access to specific IP addresses or subnets. If empty, access is permitted from any network with valid administrator credentials.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      <strong>Caution:</strong> Adding an IP address here will restrict admin login strictly to the listed addresses. Make sure your current IP address is included before saving.
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Whitelisted IP Addresses ({settings.ipWhitelist?.length || 0})
                    </label>

                    {settings.ipWhitelist && settings.ipWhitelist.length > 0 ? (
                      <div className="space-y-2">
                        {settings.ipWhitelist.map((ip, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{ip}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextList = settings.ipWhitelist.filter((_, i) => i !== index);
                                updateSetting("ipWhitelist", nextList);
                              }}
                              className="text-xs text-red-600 hover:text-red-700 font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                        No IP restrictions active. Admin panel is accessible from any IP with valid credentials.
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        id="new-ip-input"
                        placeholder="e.g. 197.251.134.12 or 10.0.0.1/24"
                        className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val && !settings.ipWhitelist?.includes(val)) {
                              updateSetting("ipWhitelist", [...(settings.ipWhitelist || []), val]);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById("new-ip-input") as HTMLInputElement;
                          if (input && input.value.trim()) {
                            const val = input.value.trim();
                            if (!settings.ipWhitelist?.includes(val)) {
                              updateSetting("ipWhitelist", [...(settings.ipWhitelist || []), val]);
                              input.value = "";
                            }
                          }
                        }}
                        className="px-4 py-2 text-sm font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg"
                      >
                        Add IP
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Two-Factor Authentication Setup Section
 */
function TwoFactorSetupSection() {
  const { data: status } = useTwoFactorStatus();
  const twoFA = useTwoFactorSetupFlow();
  const disableMutation = useDisableTwoFactor();
  const regenerateMutation = useRegenerateBackupCodes();
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);
  const [regenPassword, setRegenPassword] = useState('');
  const [showBackupRegen, setShowBackupRegen] = useState(false);

  const handleDisable = async () => {
    disableMutation.mutate(
      { code: disableCode, password: disablePassword },
      {
        onSuccess: () => {
          setShowDisable(false);
          setDisableCode('');
          setDisablePassword('');
        },
      }
    );
  };

  const handleRegenerate = async () => {
    regenerateMutation.mutate(
      { password: regenPassword },
      {
        onSuccess: (codes) => {
          setNewBackupCodes(codes);
          setRegenPassword('');
        },
      }
    );
  };

  if (status?.enabled) {
    return (
      <div className="p-4 border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">2FA Enabled</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your account is protected with two-factor authentication
              </p>
            </div>
          </div>
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-green-700 dark:text-green-300">
            Backup codes remaining: {status.backupCodesRemaining}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBackupRegen(!showBackupRegen)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Key className="w-4 h-4 inline mr-1" />
              Regenerate Codes
            </button>
            <button
              onClick={() => setShowDisable(!showDisable)}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Disable 2FA
            </button>
          </div>
        </div>

        {showBackupRegen && (
          <div className="pt-3 border-t border-green-200 dark:border-green-800 space-y-3">
            {newBackupCodes ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">New backup codes (save these!):</p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg font-mono text-sm">
                  {newBackupCodes.map((code, i) => (
                    <span key={i} className="text-gray-900 dark:text-white">{code}</span>
                  ))}
                </div>
                <button
                  onClick={() => { setNewBackupCodes(null); setShowBackupRegen(false); }}
                  className="text-sm text-green-600 hover:underline"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={regenPassword}
                  onChange={(e) => setRegenPassword(e.target.value)}
                  className="flex-1 px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-gray-700 text-sm"
                />
                <button
                  onClick={handleRegenerate}
                  disabled={!regenPassword || regenerateMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {regenerateMutation.isPending ? 'Generating...' : 'Confirm'}
                </button>
              </div>
            )}
          </div>
        )}

        {showDisable && (
          <div className="pt-3 border-t border-green-200 dark:border-green-800 space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Enter your authenticator code and password to disable 2FA:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="6-digit code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-32 px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-700 text-sm text-center font-mono tracking-widest"
              />
              <input
                type="password"
                placeholder="Password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="flex-1 px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-700 text-sm"
              />
              <button
                onClick={handleDisable}
                disabled={disableCode.length !== 6 || !disablePassword || disableMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {disableMutation.isPending ? 'Disabling...' : 'Disable'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2FA not enabled — show setup flow
  return (
    <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Set Up Two-Factor Authentication</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add an extra layer of security using an authenticator app
          </p>
        </div>
      </div>

      {twoFA.step === 'idle' && (
        <button
          onClick={twoFA.startSetup}
          disabled={twoFA.isSettingUp}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {twoFA.isSettingUp ? 'Generating...' : 'Enable 2FA'}
        </button>
      )}

      {twoFA.step === 'setup' && twoFA.setupData && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Step 1: Scan this QR code with your authenticator app
            </p>
            <div className="flex justify-center py-4">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border">
                {/* QR code would be rendered from qrCodeUrl */}
                <img
                  src={twoFA.setupData.qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-44 h-44"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML =
                      '<p class="text-xs text-gray-500 text-center p-4">QR code unavailable. Use the manual key below.</p>';
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              Or enter this key manually: <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded font-mono">{twoFA.setupData.secret}</code>
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Step 2: Enter the 6-digit code from your app
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-center font-mono text-lg tracking-[0.3em]"
              />
              <button
                onClick={() => twoFA.verifyCode(verifyCode)}
                disabled={verifyCode.length !== 6 || twoFA.isVerifying}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {twoFA.isVerifying ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {twoFA.step === 'backup' && twoFA.setupData && (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Save your backup codes
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
              These codes can be used if you lose access to your authenticator app. Store them safely.
            </p>
            <div className="grid grid-cols-2 gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg font-mono text-sm">
              {twoFA.setupData.backupCodes.map((code, i) => (
                <span key={i} className="text-gray-900 dark:text-white">{code}</span>
              ))}
            </div>
          </div>
          <button
            onClick={twoFA.complete}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            I&apos;ve saved my backup codes
          </button>
        </div>
      )}

      {twoFA.step === 'complete' && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-900 dark:text-green-100 font-medium">
            2FA has been enabled. You&apos;ll need your authenticator code on next login.
          </p>
        </div>
      )}
    </div>
  );
}
