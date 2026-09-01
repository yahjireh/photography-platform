/**
 * Paystack Configuration
 * API keys and base URLs for Paystack integration
 */

/**
 * TEACHING MOMENT: Environment Variables
 * 
 * NEVER hardcode API keys in your code!
 * Always use environment variables (.env file)
 * 
 * Why?
 * - Security: Keys not exposed in code
 * - Flexibility: Easy to switch between test/live
 * - Git safety: .env is in .gitignore
 */

export const PAYSTACK_CONFIG = {
  /**
   * Secret key for server-side API calls
   * Format: sk_test_... (test mode) or sk_live_... (production)
   */
  secretKey: process.env.PAYSTACK_SECRET_KEY || '',
  
  /**
   * Public key for client-side (will be sent to frontend)
   * Format: pk_test_... (test mode) or pk_live_... (production)
   */
  publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  
  /**
   * Paystack API base URL
   * All API requests go to this base URL
   */
  baseUrl: 'https://api.paystack.co',
  
  /**
   * Webhook URL (where Paystack sends payment notifications)
   * This will be your server URL + webhook endpoint
   * Example: https://yourdomain.com/api/payments/webhook
   */
  webhookUrl: process.env.PAYSTACK_WEBHOOK_URL || '',
  
  /**
   * Currency (Paystack supports multiple)
   * GHS - Ghana Cedis
   * NGN - Nigerian Naira
   * ZAR - South African Rand
   * USD - US Dollars
   */
  currency: 'GHS',  // Change to your currency
  
  /**
   * Service charge percentage
   * This is what Paystack charges (not your platform commission)
   * Paystack charges ~1.95% + GHS 0.50 per transaction
   */
  paystackFee: 0.0195  // 1.95%
};

/**
 * Validate Paystack configuration
 * Call this on server startup to ensure keys are set
 */
export function validatePaystackConfig(): void {
  if (!PAYSTACK_CONFIG.secretKey) {
    console.warn('⚠️  WARNING: PAYSTACK_SECRET_KEY not set in environment variables');
  }
  
  if (!PAYSTACK_CONFIG.publicKey) {
    console.warn('⚠️  WARNING: PAYSTACK_PUBLIC_KEY not set in environment variables');
  }
  
  if (PAYSTACK_CONFIG.secretKey.startsWith('sk_test_')) {
    console.log('🧪 Paystack running in TEST MODE');
  } else if (PAYSTACK_CONFIG.secretKey.startsWith('sk_live_')) {
    console.log('🔴 Paystack running in LIVE MODE - Real money!');
  }
}

/**
 * TEACHING MOMENT: Paystack Test Cards
 * 
 * In test mode, use these cards to simulate payments:
 * 
 * SUCCESS:
 * Card: 4084 0840 8408 4081
 * CVV: 408
 * Expiry: Any future date
 * PIN: 0000
 * 
 * INSUFFICIENT FUNDS:
 * Card: 5060 6666 6666 6666 6666
 * 
 * DECLINED:
 * Card: 5060 0000 0000 0000 0000
 * 
 * These cards let you test without real money!
 */