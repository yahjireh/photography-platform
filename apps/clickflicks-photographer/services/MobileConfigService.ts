import { Capacitor } from '@capacitor/core';
import apiClient from '../lib/api-client';

export interface VersionCheckInfo {
  platform: string;
  currentVersion: string;
  latestVersion: string;
  minRequired: string;
  forceUpdate: boolean;
  softUpdate: boolean;
  releaseNotes?: string;
  storeUrl: string;
}

export interface InAppMessageItem {
  id: string;
  title: string;
  body: string;
  type: 'Banner' | 'Modal' | 'Full Screen' | 'Bottom Sheet';
  trigger: string;
  active: boolean;
  deepLink?: string;
}

export interface MobileStartupConfig {
  versionCheck: VersionCheckInfo;
  featureFlags: Record<string, boolean>;
  inAppMessages: InAppMessageItem[];
  activeAbTests: { id: string; name: string; variant: string }[];
}

export class MobileConfigService {
  private static config: MobileStartupConfig | null = null;
  private static isInitialized = false;

  /**
   * Initializes mobile startup sync with backend:
   * - Queries /api/mobile/config
   * - Checks force update / soft update status
   * - Sets up automatic crash telemetry reporting
   */
  public static async init(): Promise<MobileStartupConfig | null> {
    if (this.isInitialized) return this.config;

    const platform = Capacitor.getPlatform() === 'ios' ? 'iOS' : 'Android';
    const appVersion = '1.2.5';

    try {
      // 1. Fetch live config from backend
      const res = await apiClient.get<any>(`/mobile/config?platform=${platform.toLowerCase()}&version=${appVersion}&app=photographer&appId=com.clickflicks.photographer`);
      if (res.data?.success && res.data?.data) {
        this.config = res.data.data;
        localStorage.setItem('clickflicks_photographer_mobile_flags', JSON.stringify(this.config.featureFlags || {}));

        // Dispatch events for UI listeners
        if (this.config.versionCheck?.forceUpdate) {
          window.dispatchEvent(new CustomEvent('clickflicks:force-update', { detail: this.config.versionCheck }));
        } else if (this.config.versionCheck?.softUpdate) {
          window.dispatchEvent(new CustomEvent('clickflicks:soft-update', { detail: this.config.versionCheck }));
        }

        if (this.config.inAppMessages?.length > 0) {
          window.dispatchEvent(new CustomEvent('clickflicks:in-app-messages', { detail: this.config.inAppMessages }));
        }
      }
    } catch (err) {
      console.warn('⚠️ [MobileConfigService] Could not reach backend for mobile config sync:', err);
    }

    // 2. Set up global crash reporting telemetry
    this.setupCrashReporter(platform, appVersion);
    this.isInitialized = true;

    return this.config;
  }

  /**
   * Checks whether a feature flag is enabled
   */
  public static isFeatureEnabled(flagId: string): boolean {
    if (this.config?.featureFlags && flagId in this.config.featureFlags) {
      return this.config.featureFlags[flagId];
    }
    try {
      const stored = localStorage.getItem('clickflicks_photographer_mobile_flags');
      if (stored) {
        const parsed = JSON.parse(stored);
        return !!parsed[flagId];
      }
    } catch (_) {}
    return true; // Default fallback
  }

  /**
   * Reports an unhandled crash or exception to backend
   */
  public static async reportCrash(error: any, context?: string): Promise<void> {
    try {
      const platform = Capacitor.getPlatform() === 'ios' ? 'iOS' : 'Android';
      await apiClient.post('/mobile/crashes', {
        title: error?.message || (typeof error === 'string' ? error : 'Unhandled mobile exception'),
        platform,
        version: '1.2.5',
        stackTrace: `${context ? `[Context: ${context}]\n` : ''}${error?.stack || String(error)}`
      });
    } catch (_) {
      // Avoid infinite error loop
    }
  }

  /**
   * Sets up global window error and unhandled promise rejection listeners
   */
  private static setupCrashReporter(platform: string, version: string): void {
    window.addEventListener('error', (event) => {
      this.reportCrash(event.error || event.message, 'Global window error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportCrash(event.reason, 'Unhandled Promise Rejection');
    });
  }

  public static getConfig(): MobileStartupConfig | null {
    return this.config;
  }
}
