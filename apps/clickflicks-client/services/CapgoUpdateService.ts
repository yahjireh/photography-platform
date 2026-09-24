import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export class CapgoUpdateService {
  private static isInitialized = false;
  private static pendingVersion: string | null = null;
  private static onReadyCallback: ((version: string) => void) | null = null;

  /**
   * Initializes Capgo live OTA updates and sets up lifecycle event listeners.
   */
  public static async init(onUpdateReady?: (version: string) => void): Promise<void> {
    if (onUpdateReady) {
      this.onReadyCallback = onUpdateReady;
    }

    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Critical: Always notify app ready to prevent rollback
    try {
      await CapacitorUpdater.notifyAppReady();
      console.log('✅ [Capgo] notifyAppReady() confirmed.');
    } catch (e) {
      console.warn('⚠️ [Capgo] notifyAppReady error:', e);
    }

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // 2. Ensure device is bound to the production channel
      await CapacitorUpdater.setChannel({ channel: 'production' }).catch(() => {});

      // 3. Listen for native background download completion
      // @ts-expect-error plugin event listener
      CapacitorUpdater.addListener('downloadComplete', (info: any) => {
        const ver = info?.bundle?.version || 'new';
        console.log(`🚀 [Capgo] Live bundle downloaded: v${ver}`);
        this.pendingVersion = ver;
        if (this.onReadyCallback) {
          this.onReadyCallback(ver);
        }
      });

      // 4. Proactive OTA check on startup
      setTimeout(() => {
        this.checkForUpdateInBackground();
      }, 2000);
    } catch (err) {
      console.warn('⚠️ [Capgo] Initialization error:', err);
    }
  }

  /**
   * Proactively checks for and downloads the latest bundle in the background.
   */
  private static async checkForUpdateInBackground(): Promise<void> {
    try {
      console.log('🔍 [Capgo] Checking for live updates in background...');
      const latest = await CapacitorUpdater.getLatest();
      console.log('📦 [Capgo] Remote latest response:', latest);

      if (latest && latest.url && latest.version) {
        console.log(`⬇️ [Capgo] Downloading live update v${latest.version}...`);
        const bundle = await CapacitorUpdater.download({
          url: latest.url,
          version: latest.version
        });

        console.log(`✅ [Capgo] Bundle ${bundle.id} downloaded. Staging for next launch...`);
        await CapacitorUpdater.next({ id: bundle.id });

        this.pendingVersion = latest.version;
        if (this.onReadyCallback) {
          this.onReadyCallback(latest.version);
        }
      }
    } catch (err) {
      console.info('ℹ️ [Capgo] Background check complete or no newer bundle:', err);
    }
  }

  /**
   * Manually check for updates (e.g. from Settings or Help screen).
   */
  public static async checkForUpdateManual(): Promise<{ hasUpdate: boolean; version?: string; message?: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { hasUpdate: false, message: 'Live OTA updates are available on native Android & iOS devices.' };
    }

    try {
      // Ensure production channel
      await CapacitorUpdater.setChannel({ channel: 'production' }).catch(() => {});

      const latest = await CapacitorUpdater.getLatest();
      if (latest && latest.url && latest.version) {
        const bundle = await CapacitorUpdater.download({
          url: latest.url,
          version: latest.version
        });
        await CapacitorUpdater.next({ id: bundle.id });
        this.pendingVersion = latest.version;
        return { hasUpdate: true, version: latest.version };
      }
      return { hasUpdate: false, message: 'You are on the latest version.' };
    } catch (err: any) {
      return { hasUpdate: false, message: err?.message || 'Up to date' };
    }
  }

  /**
   * Reloads the app immediately to activate the newly staged bundle.
   */
  public static async applyUpdateNow(): Promise<void> {
    try {
      console.log('🔄 [Capgo] Reloading app to apply live update...');
      await CapacitorUpdater.reload();
    } catch (err) {
      console.error('⚠️ [Capgo] Failed to reload:', err);
      window.location.reload();
    }
  }
}
