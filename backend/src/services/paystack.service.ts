/**
 * Paystack Service
 * Handles all Paystack API interactions
 */

import { PAYSTACK_CONFIG } from '../config/paystack';
import crypto from 'crypto';

/**
 * TEACHING MOMENT: External API Integration
 * 
 * When integrating external APIs:
 * 1. Read API documentation carefully
 * 2. Use proper headers (Authorization, Content-Type)
 * 3. Handle errors gracefully
 * 4. Log requests for debugging
 * 5. Never expose API keys to client
 */

/**
 * TypeScript interfaces for Paystack API responses
 */
interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

/**
 * Base function to make Paystack API requests
 * 
 * @param endpoint - API endpoint (e.g., '/transaction/initialize')
 * @param method - HTTP method
 * @param data - Request body (optional)
 * @returns API response
 */
async function paystackRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  data?: any
) : Promise<PaystackResponse> {
  const url = `${PAYSTACK_CONFIG.baseUrl}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json() as PaystackResponse;
    
    if (!response.ok) {
      throw new Error(result.message || 'Paystack API request failed');
    }
    
    return result;
  } catch (error) {
    console.error('Paystack API Error:', error);
    throw error;
  }
}

/**
 * Initialize payment transaction
 * Creates a payment link for the client
 * 
 * @param data - Payment initialization data
 * @returns Payment authorization URL and reference
 */
export async function initializePayment(data: {
  email: string;
  amount: number;  // In kobo (multiply GHS by 100)
  reference: string;
  metadata?: any;
  callback_url?: string;
}) {
  /**
   * TEACHING MOMENT: Amount in smallest currency unit
   * 
   * Paystack expects amounts in kobo (1/100 of a cedi)
   * GHS 10.00 = 1000 kobo
   * GHS 100.50 = 10050 kobo
   * 
   * Always multiply by 100 before sending to Paystack!
   */
  
  const response = await paystackRequest('/transaction/initialize', 'POST', {
    email: data.email,
    amount: Math.round(data.amount * 100),  // Convert to kobo
    reference: data.reference,
    currency: PAYSTACK_CONFIG.currency,
    metadata: data.metadata,
    callback_url: data.callback_url
  });
  
  return {
    authorizationUrl: response.data.authorization_url,
    accessCode: response.data.access_code,
    reference: response.data.reference
  };
}

/**
 * Verify payment transaction
 * Checks if payment was successful
 * 
 * @param reference - Payment reference
 * @returns Payment details
 */
export async function verifyPayment(reference: string) {
  const response = await paystackRequest(`/transaction/verify/${reference}`);
  
  return {
    status: response.data.status,  // 'success', 'failed', 'abandoned'
    amount: response.data.amount / 100,  // Convert from kobo to cedis
    currency: response.data.currency,
    paidAt: response.data.paid_at,
    reference: response.data.reference,
    channel: response.data.channel,  // 'card', 'bank', 'mobile_money'
    metadata: response.data.metadata,
    customer: response.data.customer
  };
}

/**
 * Create subaccount for photographer
 * Allows platform to split payments
 * 
 * @param data - Subaccount creation data
 * @returns Subaccount details
 */
export async function createSubaccount(data: {
  businessName: string;
  accountNumber: string;
  bankCode: string;
  percentageCharge?: number;
}) {
  /**
   * TEACHING MOMENT: Subaccounts
   * 
   * Subaccounts let you split payments automatically
   * - Client pays full amount to platform
   * - Paystack can automatically split to photographer's account
   * - Platform keeps commission
   * 
   * We won't use auto-split - we'll manually transfer
   * This gives us more control over the 3-stage escrow
   */
  
  const response = await paystackRequest('/subaccount', 'POST', {
    business_name: data.businessName,
    settlement_bank: data.bankCode,
    account_number: data.accountNumber,
    percentage_charge: data.percentageCharge || 0,
    description: 'Photographer payout account'
  });
  
  return {
    subaccountCode: response.data.subaccount_code,
    businessName: response.data.business_name,
    bankName: response.data.bank_name,
    accountName: response.data.account_name,
    accountNumber: response.data.account_number,
    bankCode: response.data.settlement_bank
  };
}

/**
 * Transfer funds to photographer
 * Sends money from platform account to photographer's bank
 * 
 * @param data - Transfer data
 * @returns Transfer details
 */
export async function initiateTransfer(data: {
  amount: number;  // In cedis
  recipient: string;  // Subaccount code or transfer recipient code
  reason?: string;
  reference?: string;
}) {
  /**
   * TEACHING MOMENT: Transfer Process
   * 
   * Before transferring:
   * 1. Create transfer recipient (one-time setup per photographer)
   * 2. Initiate transfer
   * 3. Paystack may require OTP (for first transfer)
   * 4. Transfer status: pending → success/failed
   * 
   * We'll use subaccount codes as recipients
   */
  
  const response = await paystackRequest('/transfer', 'POST', {
    source: 'balance',
    amount: Math.round(data.amount * 100),  // Convert to kobo
    recipient: data.recipient,
    reason: data.reason || 'Payout',
    reference: data.reference || `TRF-${Date.now()}`,
    currency: PAYSTACK_CONFIG.currency
  });
  
  return {
    transferCode: response.data.transfer_code,
    reference: response.data.reference,
    status: response.data.status,
    amount: response.data.amount / 100
  };
}

/**
 * Verify webhook signature
 * Ensures webhook came from Paystack
 * 
 * @param payload - Webhook body (as string)
 * @param signature - X-Paystack-Signature header
 * @returns true if valid, false otherwise
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  /**
   * TEACHING MOMENT: Webhook Security
   * 
   * Webhooks can be spoofed (fake requests)
   * Paystack signs webhooks with HMAC-SHA512
   * 
   * We verify:
   * 1. Take webhook body (raw string)
   * 2. Hash it with our secret key
   * 3. Compare with signature from header
   * 4. If match → real webhook from Paystack ✅
   * 5. If no match → fake webhook, ignore! ❌
   */
  
  const hash = crypto
    .createHmac('sha512', PAYSTACK_CONFIG.secretKey)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

/**
 * List banks (for photographer registration)
 * Get list of banks for account number verification
 * 
 * @returns List of banks
 */
export async function listBanks() {
  const response = await paystackRequest('/bank?currency=GHS');
  
  return response.data.map((bank: any) => ({
    name: bank.name,
    code: bank.code,
    slug: bank.slug
  }));
}

/**
 * Resolve account number
 * Verify bank account details
 * 
 * @param bankName - Bank name
 * @param accountNumber - Account number
 * @param bankCode - Bank code
 * @returns Account holder name
 */
export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string
) {
  /**
   * TEACHING MOMENT: Account Verification
   * 
   * Before creating subaccount, verify:
   * - Account number is valid
   * - Bank code is correct
   * - Get account holder's name
   * 
   * This prevents typos and fraud!
   */
  
  const response = await paystackRequest(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  
  return {
    bankName: response.data.bank_name,
    accountName: response.data.account_name,
    accountNumber: response.data.account_number,
    bankCode: bankCode
  };
}


/**
 * Simulate transfer for development/testing
 * Use when Paystack account cannot send transfers
 * 
 * @param data - Transfer data
 * @returns Simulated transfer response
 */
export async function simulateTransfer(data: {
  amount: number;
  recipient: string;
  reason?: string;
  reference?: string;
}) {
  console.log('');
  console.log('🧪 ═══════════════════════════════════════════════════');
  console.log('🧪 SIMULATED TRANSFER (Development Mode)');
  console.log('🧪 ═══════════════════════════════════════════════════');
  console.log('💰 Amount:    ₵' + data.amount.toFixed(2));
  console.log('🏦 Recipient: ' + data.recipient);
  console.log('📝 Reason:    ' + (data.reason || 'Payout'));
  console.log('🔖 Reference: ' + (data.reference || 'N/A'));
  console.log('✅ Status:    SUCCESS (simulated)');
  console.log('🧪 ═══════════════════════════════════════════════════');
  console.log('ℹ️  NOTE: No actual money transferred (test mode)');
  console.log('ℹ️  Upgrade to Registered Business for real transfers');
  console.log('🧪 ═══════════════════════════════════════════════════');
  console.log('');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    transferCode: `TRF-SIMULATED-${Date.now()}`,
    reference: data.reference || `TRF-${Date.now()}`,
    status: 'success',
    amount: data.amount
  };
}
/**
 * TEACHING MOMENT: Paystack Flow Summary
 * 
 * 1. INITIALIZE PAYMENT
 *    - Client creates booking
 *    - Backend calls initializePayment()
 *    - Get authorization URL
 *    - Send URL to client
 *    - Client redirects to Paystack checkout
 * 
 * 2. CLIENT PAYS
 *    - Client enters card details on Paystack
 *    - Paystack processes payment
 *    - Money goes to platform account
 * 
 * 3. WEBHOOK NOTIFICATION
 *    - Paystack sends webhook to our server
 *    - We verify signature
 *    - We verify payment status
 *    - We update booking status
 * 
 * 4. RELEASE FUNDS
 *    - When photographer shows up: transfer deposit
 *    - When photos delivered: transfer balance
 *    - Use initiateTransfer() to send to photographer
 */