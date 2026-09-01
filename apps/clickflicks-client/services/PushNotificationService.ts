import { Capacitor } from '@capacitor/core';
import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema, 
  ActionPerformed, 
  RegistrationError 
} from '@capacitor/push-notifications';

export class PushNotificationService {
  private static fcmToken: string | null = null;
  private static isInitialized = false;

  /**
   * Initializes native push notifications, requests permissions, and registers listeners.
   */
  public static async init(): Promise<void> {
    if (this.isInitialized) return;

    if (!Capacitor.isNativePlatform()) {
      console.info('ℹ️ [PushNotifications] Push notifications are only supported on native iOS/Android devices.');
      return;
    }

    try {
      // 1. Check & Request Permissions
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('⚠️ [PushNotifications] Permission not granted for push notifications.');
        return;
      }

      // 2. Register Device
      await PushNotifications.register();
      this.isInitialized = true;

      // 3. Register Event Listeners
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
    PushNotifications.addListener('registration', (token: Token) => {
      this.fcmToken = token.value;
      localStorage.setItem('clickflicks_fcm_token', token.value);
      
      console.log('====================================================');
      console.log('🔥 [ClickFlicks Push] FCM Registration Token:');
      console.log(token.value);
      console.log('====================================================');
    });

    // Registration Error
    PushNotifications.addListener('registrationError', (error: RegistrationError) => {
      console.error('❌ [ClickFlicks Push] Error on registration:', JSON.stringify(error));
    });

    // Received Notification in Foreground
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('📬 [ClickFlicks Push] Push Received (Foreground):', notification);
      }
    );

    // User tapped / performed action on Notification
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('👆 [ClickFlicks Push] Push Action Performed:', action);
        const data = action.notification.data;
        if (data?.conversationId) {
          window.dispatchEvent(new CustomEvent('clickflicks:open-chat', { detail: data.conversationId }));
        }
      }
    );
  }

  /**
   * Returns current FCM token if registered.
   */
  public static getToken(): string | null {
    return this.fcmToken || localStorage.getItem('clickflicks_fcm_token');
  }

  /**
   * Removes all active push notification listeners.
   */
  public static async removeAllListeners(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await PushNotifications.removeAllListeners();
      this.isInitialized = false;
    }
  }
}

export const initPushNotifications = () => PushNotificationService.init();
export const getFCMToken = () => PushNotificationService.getToken();
export default PushNotificationService;
