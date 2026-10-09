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
      appId: process.env.OTAKIT_CLIENT_APP_ID || '5e735704-6a85-4f05-b0b4-6ac3bb86a0d9',
      channel: 'production',
      launchPolicy: 'apply-staged',
      resumePolicy: 'shadow'
    }
  }
};

export default config;
