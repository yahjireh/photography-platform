import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clickflicks.photographer',
  appName: 'ClickFlicksPhotographer',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    CapacitorUpdater: {
      autoUpdate: true
    }
  }
};

export default config;
