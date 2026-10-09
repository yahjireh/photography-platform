import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clickflicks.app',
  appName: 'ClickFlicks',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    OtaKit: {
      appId: process.env.OTAKIT_CLIENT_APP_ID || process.env.OTAKIT_APP_ID || 'app_clickflicks_client',
      channel: 'production',
      launchPolicy: 'apply-staged',
      resumePolicy: 'shadow'
    }
  }
};

export default config;
