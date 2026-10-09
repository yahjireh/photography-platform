import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clickflicks.photographer',
  appName: 'ClickFlicksPhotographer',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    OtaKit: {
      appId: process.env.OTAKIT_PHOTOGRAPHER_APP_ID || process.env.OTAKIT_APP_ID || 'app_clickflicks_photographer',
      channel: 'production',
      launchPolicy: 'apply-staged',
      resumePolicy: 'shadow'
    }
  }
};

export default config;
