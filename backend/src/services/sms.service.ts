/**
 * Arkesel SMS Gateway Service
 * Integrates ClickFlicks with Arkesel (Ghana's premier SMS & OTP gateway)
 * Documentation: https://arkesel.com / https://sms.arkesel.com/api/v2/
 */

import prisma from '../config/database';

export interface SmsSendResult {
  success: boolean;
  message: string;
  recipientsCount: number;
  data?: any;
}

export interface ArkeselBalanceResult {
  success: boolean;
  balance?: number;
  currency?: string;
  message?: string;
}

export class ArkeselSmsService {
  private static ARKESEL_V2_URL = 'https://sms.arkesel.com/api/v2/sms/send';
  private static ARKESEL_BALANCE_URL = 'https://sms.arkesel.com/api/v2/clients/balance';

  /**
   * Resolves Arkesel API Key and Sender ID from environment or system_settings table
   */
  public static async getConfig(): Promise<{ apiKey: string; senderId: string }> {
    let apiKey = process.env.ARKESEL_API_KEY || '';
    let senderId = process.env.ARKESEL_SENDER_ID || 'ClickFlicks';

    try {
      const dbSetting = await prisma.system_settings.findUnique({
        where: { key: 'arkesel_sms_config' }
      });
      if (dbSetting && typeof dbSetting.value === 'object' && dbSetting.value !== null) {
        const val = dbSetting.value as any;
        if (val.apiKey) apiKey = val.apiKey;
        if (val.senderId) senderId = val.senderId;
      }
    } catch (_) {}

    return { apiKey, senderId };
  }

  /**
   * Normalizes phone number into international format expected by Arkesel (e.g. 233XXXXXXXXX)
   */
  public static normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    // Strip spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '').trim();

    // Remove leading '+'
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // Convert local Ghana number '0XXXXXXXXX' (10 digits) to '233XXXXXXXXX'
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '233' + cleaned.substring(1);
    }

    return cleaned;
  }

  /**
   * Sends an SMS message to one or multiple recipients using Arkesel v2 REST API
   */
  public static async sendSms(
    recipients: string | string[],
    message: string,
    customSenderId?: string
  ): Promise<SmsSendResult> {
    const { apiKey, senderId: defaultSender } = await this.getConfig();
    const sender = (customSenderId || defaultSender || 'ClickFlicks').substring(0, 11);

    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    const normalizedRecipients = recipientList
      .map(r => this.normalizePhoneNumber(r))
      .filter(r => r.length >= 9);

    if (normalizedRecipients.length === 0) {
      return {
        success: false,
        message: 'No valid recipient phone numbers provided',
        recipientsCount: 0
      };
    }

    console.log(`\n========================================`);
    console.log(`📱 [ARKESEL SMS DISPATCH]`);
    console.log(`From (Sender ID): ${sender}`);
    console.log(`Recipients (${normalizedRecipients.length}): ${normalizedRecipients.join(', ')}`);
    console.log(`Message: ${message}`);
    console.log(`========================================\n`);

    // If no API key is configured yet, log and return graceful simulated success
    if (!apiKey) {
      console.warn('⚠️ [Arkesel] ARKESEL_API_KEY is not set. SMS logged to console in simulation mode.');
      return {
        success: true,
        message: `SMS simulated (API key not configured). Logged for ${normalizedRecipients.length} recipient(s).`,
        recipientsCount: normalizedRecipients.length
      };
    }

    try {
      const payload = {
        sender,
        message,
        recipients: normalizedRecipients
      };

      const response = await fetch(this.ARKESEL_V2_URL, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && (data.status === 'success' || data.code === '1000' || data.message?.toLowerCase().includes('success'))) {
        console.log(`✅ [Arkesel] SMS delivered successfully:`, data);
        return {
          success: true,
          message: 'SMS delivered successfully via Arkesel',
          recipientsCount: normalizedRecipients.length,
          data
        };
      } else {
        console.error(`❌ [Arkesel] Delivery failed:`, data);
        return {
          success: false,
          message: data.message || 'Failed to dispatch SMS via Arkesel',
          recipientsCount: normalizedRecipients.length,
          data
        };
      }
    } catch (error: any) {
      console.error(`❌ [Arkesel] Network error during dispatch:`, error.message);
      return {
        success: false,
        message: `Network error connecting to Arkesel: ${error.message}`,
        recipientsCount: normalizedRecipients.length
      };
    }
  }

  /**
   * Convenience helper to send 6-digit phone verification OTP
   */
  public static async sendOtpSms(phone: string, otpCode: string): Promise<SmsSendResult> {
    const message = `Your ClickFlicks verification code is ${otpCode}. Valid for 10 minutes. Do not share this code with anyone.`;
    return this.sendSms(phone, message);
  }

  /**
   * Convenience helper to send booking security release PIN to client
   */
  public static async sendBookingPinSms(
    phone: string,
    bookingNumber: string,
    accessPin: string
  ): Promise<SmsSendResult> {
    const message = `ClickFlicks Security PIN: Your release code for booking #${bookingNumber} is ${accessPin}. Only provide this PIN to your photographer once your shoot is completed.`;
    return this.sendSms(phone, message);
  }

  /**
   * Checks Arkesel SMS balance / remaining units
   */
  public static async checkBalance(): Promise<ArkeselBalanceResult> {
    const { apiKey } = await this.getConfig();
    if (!apiKey) {
      return {
        success: false,
        message: 'ARKESEL_API_KEY is not configured in backend/.env or system_settings.'
      };
    }

    try {
      const response = await fetch(this.ARKESEL_BALANCE_URL, {
        method: 'GET',
        headers: {
          'api-key': apiKey,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        return {
          success: true,
          balance: data.data?.balance || data.data?.sms_balance || 0,
          currency: data.data?.currency || 'GHS',
          message: 'Balance retrieved successfully'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Unable to retrieve Arkesel balance'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Network error retrieving Arkesel balance: ${error.message}`
      };
    }
  }
}

export default ArkeselSmsService;
