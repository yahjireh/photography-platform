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
      autoUpdate: 'atBackground',
      defaultChannel: 'production',
      allowSetDefaultChannel: true
    }
  }
};

export default config;
