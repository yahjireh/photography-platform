import { Capacitor } from '@capacitor/core';
import { OtaKit, BundleInfo } from '@otakit/capacitor-updater';

export class OtaKitService {
  private static isInitialized = false;
  private static pendingVersion: string | null = null;
  private static onReadyCallback: ((version: string) => void) | null = null;

  /**
   * Initializes OtaKit live OTA updates and sets up lifecycle event listeners.
   */
  public static async init(onUpdateReady?: (version: string) => void): Promise<void> {
    if (onUpdateReady) {
      this.onReadyCallback = onUpdateReady;
    }

    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Critical: Always notify app ready on native platforms to prevent rollback
    if (Capacitor.isNativePlatform()) {
      try {
        await OtaKit.notifyAppReady();
        console.log('✅ [OtaKit] notifyAppReady() confirmed.');
      } catch (e) {
        console.warn('⚠️ [OtaKit] notifyAppReady error:', e);
      }

      try {
        // 2. Check if a bundle was already staged in a prior session
        const state = await OtaKit.getState().catch(() => null);
        if (state?.staged) {
          const stagedVer = state.staged.version || 'new';
          console.log(`🚀 [OtaKit] Staged bundle detected on startup: v${stagedVer}`);
          this.pendingVersion = stagedVer;
          if (this.onReadyCallback) {
            this.onReadyCallback(stagedVer);
          }
        }

        // 3. Listen for newly downloaded and staged bundles
        OtaKit.addListener('updateStaged', ({ bundle }: { bundle: BundleInfo }) => {
          const ver = bundle?.version || 'new';
          console.log(`🚀 [OtaKit] Live bundle downloaded & staged: v${ver}`);
          this.pendingVersion = ver;
          if (this.onReadyCallback) {
            this.onReadyCallback(ver);
          }
        });

        // 4. Proactive background check for newer updates
        setTimeout(() => {
          this.checkForUpdateInBackground();
        }, 2000);
      } catch (err) {
        console.warn('⚠️ [OtaKit] Initialization error:', err);
      }
    }
  }

  /**
   * Proactively checks for and downloads the latest bundle in the background.
   */
  private static async checkForUpdateInBackground(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      console.log('🔍 [OtaKit] Checking for live updates in background...');
      const check = await OtaKit.check();
      console.log('📦 [OtaKit] Remote check response:', check);

      if (check.kind === 'update_available') {
        console.log(`⬇️ [OtaKit] Update available v${check.latest.version}. Downloading...`);
        const res = await OtaKit.download();
        if (res.kind === 'staged') {
          const ver = res.bundle.version || check.latest.version;
          console.log(`✅ [OtaKit] Bundle v${ver} staged successfully.`);
          this.pendingVersion = ver;
          if (this.onReadyCallback) {
            this.onReadyCallback(ver);
          }
        }
      } else if (check.kind === 'already_staged') {
        const ver = check.latest.version;
        this.pendingVersion = ver;
        if (this.onReadyCallback) {
          this.onReadyCallback(ver);
        }
      }
    } catch (err) {
      console.info('ℹ️ [OtaKit] Background check complete or no newer bundle:', err);
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
      const check = await OtaKit.check();
      if (check.kind === 'update_available') {
        const res = await OtaKit.download();
        if (res.kind === 'staged') {
          this.pendingVersion = res.bundle.version;
          return { hasUpdate: true, version: res.bundle.version };
        }
      } else if (check.kind === 'already_staged') {
        this.pendingVersion = check.latest.version;
        return { hasUpdate: true, version: check.latest.version };
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
      console.log('🔄 [OtaKit] Reloading app to apply live update...');
      await OtaKit.apply();
    } catch (err) {
      console.error('⚠️ [OtaKit] Failed to apply update, falling back to window.location.reload:', err);
      window.location.reload();
    }
  }
}
