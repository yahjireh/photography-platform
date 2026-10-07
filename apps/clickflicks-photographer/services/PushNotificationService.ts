import { Capacitor } from '@capacitor/core';
import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema, 
  ActionPerformed, 
  RegistrationError 
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import apiClient from '../lib/api-client';

export class PushNotificationService {
  private static fcmToken: string | null = null;
  private static isInitialized = false;

  /**
   * Initializes native push notifications, requests permissions, sets up Android channels,
   * and registers listeners.
   */
  public static async init(): Promise<void> {
    if (this.isInitialized) return;

    if (!Capacitor.isNativePlatform()) {
      console.info('ℹ️ [PushNotifications] Push notifications are only supported on native iOS/Android devices.');
      return;
    }

    try {
      // 1. Request Local Notification Permissions
      try {
        const localStatus = await LocalNotifications.checkPermissions();
        if (localStatus.display === 'prompt' || localStatus.display === 'prompt-with-rationale') {
          await LocalNotifications.requestPermissions();
        }
      } catch (err) {
        console.warn('⚠️ [LocalNotifications] Permission check note:', err);
      }

      // 2. Request Push Notification Permissions
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('⚠️ [PushNotifications] Permission not granted for push notifications.');
      } else {
        // Register Device with FCM / APNs
        await PushNotifications.register();
      }

      // 3. Create High-Priority Notification Channel for Android
      try {
        await PushNotifications.createChannel({
          id: 'clickflicks_alerts',
          name: 'ClickFlicks Alerts',
          description: 'Instant messages, booking alerts, and escrow notifications',
          importance: 5,
          visibility: 1,
          vibration: true,
          sound: 'default'
        });

        await LocalNotifications.createChannel({
          id: 'clickflicks_alerts',
          name: 'ClickFlicks Alerts',
          description: 'Instant messages, booking alerts, and escrow notifications',
          importance: 5,
          visibility: 1,
          vibration: true,
          sound: 'default'
        });
      } catch (err) {
        console.warn('Channel creation warning (non-fatal):', err);
      }

      this.isInitialized = true;

      // 4. Register Event Listeners
      this.setupListeners();
    } catch (error) {
      console.error('❌ [PushNotifications] Failed to initialize push notifications:', error);
    }
  }

  /**
   * Sets up token registration and notification event listeners.
   */
  private static setupListeners(): void {
    // Successfully registered with FCM / APNS
    PushNotifications.addListener('registration', async (token: Token) => {
      this.fcmToken = token.value;
      localStorage.setItem('clickflicks_photographer_fcm_token', token.value);
      
      console.log('====================================================');
      console.log('🔥 [ClickFlicks Photographer Push] FCM Registration Token:');
      console.log(token.value);
      console.log('====================================================');

      // Dispatch token to backend
      try {
        await apiClient.post('/mobile/push-token', {
          token: token.value,
          platform: Capacitor.getPlatform()
        });
        console.log('✅ [ClickFlicks Push] Token synced to backend server');
      } catch (err: any) {
        console.warn('Could not sync push token to backend yet:', err.message);
      }
    });

    // Registration Error
    PushNotifications.addListener('registrationError', (error: RegistrationError) => {
      console.error('❌ [ClickFlicks Photographer Push] Error on registration:', JSON.stringify(error));
    });

    // Received Notification (Show visual native banner on physical hardware!)
    PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
        console.log('📬 [ClickFlicks Photographer Push] Push Received:', notification);
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Math.floor(Math.random() * 1000000),
                title: notification.title || 'Studio Alert',
                body: notification.body || 'You have an update in your Creator Studio',
                channelId: 'clickflicks_alerts',
                extra: notification.data || {}
              }
            ]
          });
        } catch (err) {
          console.warn('Could not display local notification banner:', err);
        }
      }
    );

    // User tapped / performed action on Push Notification
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('👆 [ClickFlicks Photographer Push] Push Action Performed:', action);
        const data = action.notification.data;
        if (data?.requestId) {
          window.dispatchEvent(new CustomEvent('clickflicks:open-requests', { detail: data.requestId }));
        } else if (data?.conversationId) {
          window.dispatchEvent(new CustomEvent('clickflicks:open-chat', { detail: data.conversationId }));
        }
      }
    );

    // User tapped Local Notification
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const data = action.notification.extra;
      if (data?.requestId) {
        window.dispatchEvent(new CustomEvent('clickflicks:open-requests', { detail: data.requestId }));
      } else if (data?.conversationId) {
        window.dispatchEvent(new CustomEvent('clickflicks:open-chat', { detail: data.conversationId }));
      }
    });
  }

  /**
   * Explicitly triggers a physical device native notification banner with sound and vibration.
   */
  public static async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1000000),
            title,
            body,
            channelId: 'clickflicks_alerts',
            extra: data || {}
          }
        ]
      });
    } catch (err) {
      console.warn('Failed to schedule local notification:', err);
    }
  }

  /**
   * Returns current FCM token if registered.
   */
  public static getToken(): string | null {
    return this.fcmToken || localStorage.getItem('clickflicks_photographer_fcm_token');
  }

  /**
   * Removes all active push notification listeners.
   */
  public static async removeAllListeners(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await PushNotifications.removeAllListeners();
      await LocalNotifications.removeAllListeners();
      this.isInitialized = false;
    }
  }
}

export const initPushNotifications = () => PushNotificationService.init();
export const getFCMToken = () => PushNotificationService.getToken();
export const showDeviceNotification = (title: string, body: string, data?: any) => 
  PushNotificationService.showLocalNotification(title, body, data);
export default PushNotificationService;
