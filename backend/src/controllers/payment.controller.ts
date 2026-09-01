/**
 * Payment Controller
 * Handles HTTP requests for payment operations
 * Updated to work with YOUR auth middleware!
 */

import prisma from '../config/database';
import { Request, Response } from 'express';
import * as PaymentService from '../services/payment.service';
import * as PaystackService from '../services/paystack.service';

/**
 * TEACHING MOMENT: TypeScript Request Extension
 * 
 * Your authenticate middleware adds req.user
 * TypeScript needs to know about this!
 * 
 * Your req.user contains:
 * - userId: string
 * - email: string
 * - userType: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN'
 */

/**
 * Initialize deposit payment (40%)
 * POST /api/payments/deposit/initialize
 * 
 * Request body:
 * {
 *   "bookingId": "uuid",
 *   "clientEmail": "client@example.com"
 * }
 */
export async function initializeDeposit(req: Request, res: Response) {
  try {
    const { bookingId, clientEmail } = req.body;
    
    // Validate input
    if (!bookingId || !clientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID and client email are required'
      });
    }
    
    // Log who initiated this payment (for audit trail)
    console.log(`💳 Deposit payment initiated by user: ${req.user?.user_id} (${req.user?.user_type})`);
    
    // Call service
    const result = await PaymentService.initializeDepositPayment(
      bookingId,
      clientEmail
    );
    
    return res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error: any) {
    console.error('❌ Initialize deposit error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize deposit payment'
    });
  }
}

/**
 * Initialize balance payment (60%)
 * POST /api/payments/balance/initialize
 * 
 * Request body:
 * {
 *   "bookingId": "uuid",
 *   "clientEmail": "client@example.com"
 * }
 */
export async function initializeBalance(req: Request, res: Response) {
  try {
    const { bookingId, clientEmail } = req.body;
    
    if (!bookingId || !clientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID and client email are required'
      });
    }
    
    console.log(`💳 Balance payment initiated by user: ${req.user?.user_id}`);
    
    const result = await PaymentService.initializeBalancePayment(
      bookingId,
      clientEmail
    );
    
    return res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error: any) {
    console.error('❌ Initialize balance error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize balance payment'
    });
  }
}

/**
 * Paystack webhook handler
 * POST /api/webhooks/paystack
 * 
 * CRITICAL: This endpoint must NOT require authentication!
 * Paystack calls it directly.
 */
export async function paystackWebhook(req: Request, res: Response) {
  /**
   * TEACHING MOMENT: Webhook Security
   * 
   * Webhooks are PUBLIC - anyone can call them!
   * We MUST verify the signature to ensure it's from Paystack.
   * 
   * Steps:
   * 1. Get signature from header
   * 2. Verify signature matches
   * 3. If valid → process payment
   * 4. If invalid → reject
   */
  
  try {
    // Get signature from headers
    const signature = req.headers['x-paystack-signature'] as string;
    
    if (!signature) {
      console.error('❌ No Paystack signature in webhook');
      return res.status(400).send('No signature');
    }
    
    // Verify signature
    const rawBody = JSON.stringify(req.body);
    const isValid = PaystackService.verifyWebhookSignature(rawBody, signature);
    
    if (!isValid) {
      console.error('❌ Invalid Paystack webhook signature - possible fake webhook!');
      return res.status(400).send('Invalid signature');
    }
    
    // Signature is valid - process webhook
    console.log('✅ Valid Paystack webhook received');
    
    const event = req.body;
    
    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        // Payment successful!
        console.log('💰 Payment successful:', event.data.reference);
        await PaymentService.processPaymentWebhook(event.data.reference);
        break;
        
      case 'charge.failed':
        // Payment failed
        console.log('❌ Payment failed:', event.data.reference);
        // TODO: Update payment status to FAILED
        break;
        
      case 'transfer.success':
        // Transfer to photographer successful
        console.log('💸 Transfer successful:', event.data.reference);
        // TODO: Update transfer record if needed
        break;
        
      case 'transfer.failed':
        // Transfer failed
        console.log('❌ Transfer failed:', event.data.reference);
        // TODO: Handle transfer failure
        break;
        
      default:
        console.log('ℹ️ Unhandled webhook event:', event.event);
    }
    
    // ALWAYS return 200 to Paystack
    return res.status(200).send('Webhook received');
    
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    // Still return 200 to avoid retries
    return res.status(200).send('Error processed');
  }
}

/**
 * Payment callback from Paystack
 * GET /api/payments/callback
 * 
 * Paystack redirects client here after payment
 */
export async function paymentCallback(req: Request, res: Response) {
  try {
    const { reference } = req.query;
    
    if (!reference || typeof reference !== 'string') {
      return res.status(400).send('Invalid payment reference');
    }
    
    // Verify payment
    const verification = await PaystackService.verifyPayment(reference);
    
    const frontendUrl = process.env.CLIENT_APP_URL || 'http://localhost:3000';
    
    if (verification.status === 'success') {
      // Redirect to success page
      return res.redirect(`${frontendUrl}/payment/success?reference=${reference}`);
    } else {
      // Redirect to failure page
      return res.redirect(`${frontendUrl}/payment/failed?reference=${reference}`);
    }
    
  } catch (error: any) {
    console.error('❌ Payment callback error:', error);
    const frontendUrl = process.env.CLIENT_APP_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/payment/error`);
  }
}

/**
 * TEMPORARY: Manually process payment (for local testing)
 * REMOVE IN PRODUCTION!
 */
export async function manuallyProcessPayment(req: Request, res: Response) {
  try {
    const { reference } = req.body;
    
    console.log(`📝 Manually processing payment: ${reference}`);
    
    // This calls the same function the webhook calls
    const result = await PaymentService.processPaymentWebhook(reference);
    
    return res.status(200).json({
      success: true,
      message: 'Payment processed manually',
      payment: result
    });
  } catch (error: any) {
    console.error('Manual payment processing error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Release deposit to photographer
 * POST /api/payments/deposit/release
 * 
 * ADMIN ONLY - Called when photographer checks in
 * 
 * Request body:
 * {
 *   "bookingId": "uuid"
 * }
 */
export async function releaseDepositFunds(req: Request, res: Response) {
  /**
   * TEACHING MOMENT: Critical Operations Require Admin
   * 
   * This endpoint transfers REAL MONEY!
   * - Must verify photographer showed up
   * - Must verify booking is legitimate
   * - Must have human oversight
   * 
   * That's why it's admin-only (protected by authorize('ADMIN'))
   */
  
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }
    
    // Log admin action for audit trail
    console.log(`💸 ADMIN ACTION: Releasing deposit for booking ${bookingId}`);
    console.log(`   Approved by: ${req.user?.email} (User ID: ${req.user?.user_id})`);
    
    const result = await PaymentService.releaseDeposit(bookingId);
    
    // Log successful release
    console.log(`✅ Deposit released successfully!`);
    console.log(`   Amount transferred: ₵${result.amount}`);
    console.log(`   Commission deducted: ₵${result.commission}`);
    
    return res.status(200).json({
      ...result,  // Contains: success, transferCode, amount, commission
      message: 'Deposit released to photographer',
      // Include admin info in response for audit
      releasedBy: {
        userId: req.user?.user_id,
        email: req.user?.email,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Release deposit error:', error);
    console.error(`   Failed for booking: ${req.body.bookingId}`);
    console.error(`   Attempted by: ${req.user?.email}`);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to release deposit'
    });
  }
}

/**
 * Release balance to photographer
 * POST /api/payments/balance/release
 * 
 * ADMIN ONLY - Called when photos are delivered
 * 
 * Request body:
 * {
 *   "bookingId": "uuid"
 * }
 */
export async function releaseBalanceFunds(req: Request, res: Response) {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required'
      });
    }
    
    // Log admin action
    console.log(`💸 ADMIN ACTION: Releasing balance for booking ${bookingId}`);
    console.log(`   Approved by: ${req.user?.email} (User ID: ${req.user?.user_id})`);
    
    const result = await PaymentService.releaseBalance(bookingId);
    
    console.log(`✅ Balance released successfully!`);
    console.log(`   Amount transferred: ₵${result.amount}`);
    console.log(`   Commission deducted: ₵${result.commission}`);
    
    return res.status(200).json({
      ...result,  // Contains: success, transferCode, amount, commission
      message: 'Balance released to photographer',
      releasedBy: {
        userId: req.user?.user_id,
        email: req.user?.email,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Release balance error:', error);
    console.error(`   Failed for booking: ${req.body.bookingId}`);
    console.error(`   Attempted by: ${req.user?.email}`);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to release balance'
    });
  }
}

/**
 * List available banks
 * GET /api/payments/banks
 * 
 * Used when photographer sets up bank account
 */
export async function listBanks(_req: Request, res: Response) {
  try {
    const banks = await PaystackService.listBanks();
    
    return res.status(200).json({
      success: true,
      banks
    });
    
  } catch (error: any) {
    console.error('❌ List banks error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get bank list'
    });
  }
}

/**
 * Verify bank account
 * POST /api/payments/resolve-account
 * 
 * Request body:
 * {
 *  "bankName": "Access Bank",
 *  "accountName": "JOHN DOE",
 *   "accountNumber": "0123456789",
 *   "bankCode": "000014"
 * }
 */
export async function resolveAccount(req: Request, res: Response) {
  try {
    const {accountNumber, bankCode} = req.body;
    
    if ( !accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        error: 'Account number and Bank code are required'
      });
    }
    
    const result = await PaystackService.resolveAccountNumber(
      accountNumber,
      bankCode
    );
    
    return res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error: any) {
    console.error('❌ Resolve account error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify bank account'
    });
  }
}

/**
 * Create photographer Paystack subaccount
 * POST /api/payments/subaccount
 * 
 * Request body:
 * {
 *   "businessName": "John's Photography",
 *   "accountNumber": "0123456789",
 *   "bankCode": "000014"
 * }
 */
export async function createSubaccount(req: Request, res: Response) {
  try {
    const {businessName, accountNumber, bankCode} = req.body;
    
    if (!businessName || !accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        error: 'All fields required: businessName, accountNumber, bankCode'
      });
    }

    // Get photographer ID from authenticated user
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    // Log who created the subaccount
    console.log(`🏦 Creating subaccount for: ${businessName}`);
    console.log(`   Requested by: ${req.user?.email} (${req.user?.user_type})`);
    
        // STEP 1: Get photographer record
    const photographer = await prisma.photographers.findUnique({
      where: { user_id: userId },
      include: {
        paystack_subaccounts: true
      }
    });
    
    if (!photographer) {
      return res.status(404).json({
        success: false,
        error: 'Photographer profile not found'
      });
    }
    
    // Check if subaccount already exists
    if (photographer.paystack_subaccounts) {
      return res.status(400).json({
        success: false,
        error: 'Subaccount already exists for this photographer',
        existingSubaccount: {
          subaccountCode: photographer.paystack_subaccounts.subaccount_code,
          bankName: photographer.paystack_subaccounts.bank_name,
          accountNumber: photographer.paystack_subaccounts.account_number
        }
      });
    }

    // First, verify the account
    const accountVerification = await PaystackService.resolveAccountNumber(
      accountNumber,
      bankCode
    );
    
    console.log('✅ Bank account verified:', accountVerification.accountName);
    
    // Create subaccount
    console.log('🏦 Creating subaccount in Paystack...');
    const subaccount = await PaystackService.createSubaccount({
      businessName,
      accountNumber,
      bankCode
    });
    
    console.log('✅ Subaccount created:', subaccount.subaccountCode);

        console.log('💾 Saving subaccount to database...');
    const savedSubaccount = await prisma.paystack_subaccounts.create({
      data: {
        photographer_id: photographer.id,
        subaccount_code: subaccount.subaccountCode,
        bank_name: accountVerification.bankName || 'Unknown Bank',
        account_number: accountNumber,
        bank_code: bankCode,
        account_name: accountVerification.accountName,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Subaccount saved to database!');
    console.log('   Database ID:', savedSubaccount.id);
    console.log('   Photographer ID:', savedSubaccount.photographer_id);
    console.log('   Subaccount Code:', savedSubaccount.subaccount_code);
    
    return res.status(201).json({
      success: true,
      accountName: accountVerification.accountName,
      message: 'Subaccount created successfully',
            subaccount: {
        id: savedSubaccount.id,
        subaccountCode: savedSubaccount.subaccount_code,
        businessName: businessName,
        accountNumber: savedSubaccount.account_number,
        accountName: savedSubaccount.account_name,
        bankCode: savedSubaccount.bank_code,
        bankName: savedSubaccount.bank_name
      }
    });
    
  } catch (error: any) {
    console.error('❌ Create subaccount error:', error);
    
    // More detailed error logging
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.meta) {
      console.error('   Error meta:', error.meta);
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subaccount'
    });
  }
}

/**
 * TEACHING MOMENT: Audit Trail
 * 
 * Notice how we log admin actions for:
 * - Release deposit
 * - Release balance
 * - Create subaccount
 * 
 * We include:
 * - Who performed the action (req.user.email)
 * - What action was performed
 * - When it happened
 * - What the result was
 * 
 * This creates an audit trail for:
 * - Security monitoring
 * - Debugging issues
 * - Compliance requirements
 * - Dispute resolution
 * 
 * In production, you'd save these to a database or log service!
 */

/**
 * TEACHING MOMENT: Complete Request Flow
 * 
 * Example: Admin releases deposit
 * 
 * 1. Admin app sends:
 *    POST /api/payments/deposit/release
 *    Headers: Authorization: Bearer eyJhbGci...
 *    Body: { "bookingId": "abc123" }
 * 
 * 2. Request hits authenticate middleware:
 *    - Verifies JWT token
 *    - Sets req.user = { userId: "admin123", userType: "ADMIN", ... }
 * 
 * 3. Request hits authorize('ADMIN') middleware:
 *    - Checks req.user.userType === 'ADMIN' ✓
 *    - Allows request to continue
 * 
 * 4. Request reaches releaseDepositFunds controller:
 *    - Logs: "ADMIN ACTION by admin@example.com"
 *    - Calls PaymentService.releaseDeposit()
 *    - Service transfers money to photographer
 *    - Returns success response with admin info
 * 
 * 5. Complete! Money transferred with full audit trail 💰✅
 */