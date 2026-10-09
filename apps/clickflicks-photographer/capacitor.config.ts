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
      appId: process.env.OTAKIT_PHOTOGRAPHER_APP_ID || 'b327c98d-ba9e-4e78-a6f6-4b88e1f043bb',
      channel: 'production',
      launchPolicy: 'apply-staged',
      resumePolicy: 'shadow'
    }
  }
};

export default config;
