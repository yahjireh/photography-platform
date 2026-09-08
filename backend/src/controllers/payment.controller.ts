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
        if (event.data.reference && event.data.reference.startsWith('TOPUP_')) {
          await handleWalletTopupWebhook(event.data);
        } else {
          await PaymentService.processPaymentWebhook(event.data.reference);
        }
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
    
    // If wallet top-up, credit database balance if verified
    if (reference.startsWith('TOPUP_') && verification.status === 'success') {
      await handleWalletTopupWebhook(verification);
    }
    
    const frontendUrl = process.env.CLIENT_APP_URL || '';
    const isSuccess = verification.status === 'success';
    const deepLinkUrl = isSuccess
      ? `clickflicks://payment/success?reference=${reference}`
      : `clickflicks://payment/failed?reference=${reference}`;

    // If CLIENT_APP_URL is explicitly set to a live public domain (not localhost), redirect there
    if (frontendUrl && !frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
      return res.redirect(
        isSuccess
          ? `${frontendUrl}/payment/success?reference=${reference}`
          : `${frontendUrl}/payment/failed?reference=${reference}`
      );
    }

    // Default for Mobile Testing: Return responsive HTML with auto-redirect to ClickFlicks APK
    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? 'Payment Confirmed' : 'Payment Failed'} - ClickFlicks</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 36px 28px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.5); }
    .badge-icon { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 34px; font-weight: bold; background: ${isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isSuccess ? '#10b981' : '#ef4444'}; border: 2px solid ${isSuccess ? '#10b981' : '#ef4444'}; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 10px; color: #ffffff; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 28px; }
    .btn { display: block; width: 100%; padding: 14px 20px; background: linear-gradient(135deg, #9333ea, #7928ca); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4); }
    .ref-code { margin-top: 20px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #64748b; word-break: break-all; }
  </style>
  <script>
    // Auto-redirect into the ClickFlicks APK on the phone
    setTimeout(function() {
      window.location.href = "${deepLinkUrl}";
    }, 600);
  </script>
</head>
<body>
  <div class="card">
    <div class="badge-icon">${isSuccess ? '✓' : '✕'}</div>
    <h1>${isSuccess ? 'Payment Confirmed!' : 'Payment Incomplete'}</h1>
    <p>${isSuccess ? 'Your escrow transaction was verified. Returning you to the ClickFlicks app...' : 'The transaction could not be completed. Please return to the app and try again.'}</p>
    <a href="${deepLinkUrl}" class="btn">Return to ClickFlicks App</a>
    <div class="ref-code">Ref: ${reference}</div>
  </div>
</body>
</html>
    `.trim());
  } catch (error: any) {
    console.error('❌ Payment callback error:', error);
    return res.status(500).send('Payment verification failed');
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
 * Handle successful Paystack charge for wallet top-up
 */
export async function handleWalletTopupWebhook(paystackData: any): Promise<void> {
  const reference = paystackData.reference;
  const amountCedis = paystackData.amount ? paystackData.amount / 100 : 0;
  
  console.log(`🏦 [WEBHOOK] Processing wallet top-up success for ref: ${reference} (₵${amountCedis})`);
  
  const tx = await prisma.wallet_transactions.findUnique({
    where: { reference }
  });

  if (!tx) {
    console.warn(`⚠️ [WEBHOOK] Wallet transaction not found for reference: ${reference}`);
    return;
  }

  if (tx.status === 'SUCCESS') {
    console.log(`ℹ️ [WEBHOOK] Wallet transaction already marked SUCCESS: ${reference}`);
    return;
  }

  const creditAmount = amountCedis > 0 ? amountCedis : Number(tx.amount);

  await prisma.$transaction([
    prisma.wallet_transactions.update({
      where: { reference },
      data: {
        status: 'SUCCESS',
        metadata: {
          ...(typeof tx.metadata === 'object' && tx.metadata !== null ? tx.metadata : {}),
          paid_at: paystackData.paid_at || paystackData.paidAt || new Date().toISOString(),
          channel: paystackData.channel || 'momo'
        }
      }
    }),
    prisma.users.update({
      where: { id: tx.user_id },
      data: {
        wallet_balance: {
          increment: creditAmount
        }
      }
    })
  ]);

  console.log(`✅ [WEBHOOK] User ${tx.user_id} wallet balance incremented by ₵${creditAmount}`);
}

/**
 * Top up user wallet
 * POST /api/payments/wallet/topup
 * 
 * Supports test simulation mode and live Paystack mode.
 */
export async function topupWallet(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { amount, paymentMethod, provider, phone } = req.body;
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, error: 'Valid positive amount is required' });
      return;
    }

    // Determine simulation mode: default to true unless explicitly disabled in .env
    const isSimulation = process.env.SIMULATE_WALLET_TOPUP !== 'false';
    const reference = `TOPUP_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    if (isSimulation) {
      console.log(`🏦 [TEST SIMULATION] Processing wallet top-up for user ${userId}: ₵${numericAmount} via ${paymentMethod || 'MOMO'}`);

      // 1. Record transaction in public.wallet_transactions
      const transaction = await prisma.wallet_transactions.create({
        data: {
          user_id: userId,
          amount: numericAmount,
          type: 'TOPUP',
          payment_method: (paymentMethod || 'MOMO').toUpperCase(),
          reference,
          status: 'SUCCESS',
          metadata: {
            simulated: true,
            provider: provider || 'Mobile Money',
            phone: phone || null,
            timestamp: new Date().toISOString()
          }
        }
      });

      // 2. Increment wallet balance in public.users
      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          wallet_balance: {
            increment: numericAmount
          }
        },
        select: {
          id: true,
          wallet_balance: true
        }
      });

      res.status(200).json({
        success: true,
        message: 'Wallet top-up processed successfully (simulated)',
        wallet_balance: Number(updatedUser.wallet_balance),
        reference,
        transactionId: transaction.id,
        simulated: true
      });
      return;
    }

    // LIVE MODE: Real Paystack API Integration
    console.log(`💳 [LIVE MODE] Initializing Paystack wallet top-up for user ${userId}: ₵${numericAmount}`);
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const paymentResult = await PaystackService.initializePayment({
      email: user.email,
      amount: numericAmount,
      reference,
      metadata: {
        type: 'WALLET_TOPUP',
        user_id: userId,
        payment_method: paymentMethod || 'momo',
        provider,
        phone
      }
    });

    await prisma.wallet_transactions.create({
      data: {
        user_id: userId,
        amount: numericAmount,
        type: 'TOPUP',
        payment_method: (paymentMethod || 'MOMO').toUpperCase(),
        reference,
        status: 'PENDING',
        metadata: {
          simulated: false,
          provider: provider || null,
          phone: phone || null,
          accessCode: paymentResult.accessCode
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Payment initialized',
      authorizationUrl: paymentResult.authorizationUrl,
      accessCode: paymentResult.accessCode,
      reference,
      simulated: false
    });
  } catch (error: any) {
    console.error('❌ Wallet top-up error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process wallet top-up'
    });
  }
}

/**
 * Get current user's wallet balance
 * GET /api/payments/wallet/balance
 */
export async function getWalletBalance(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { wallet_balance: true }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      wallet_balance: Number(user.wallet_balance || 0)
    });
  } catch (error: any) {
    console.error('❌ Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch wallet balance'
    });
  }
}

/**
 * Get user's wallet transaction history
 * GET /api/payments/wallet/transactions
 */
export async function getWalletTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const transactions = await prisma.wallet_transactions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    res.status(200).json({
      success: true,
      transactions: transactions.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        payment_method: t.payment_method,
        reference: t.reference,
        status: t.status,
        metadata: t.metadata,
        created_at: t.created_at
      }))
    });
  } catch (error: any) {
    console.error('❌ Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch wallet transactions'
    });
  }
}

/**
 * Get user's saved payment methods
 * GET /api/payments/methods
 */
export async function getPaymentMethods(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const methods = await prisma.user_payment_methods.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      methods: methods.map(m => ({
        id: m.id,
        type: m.type,
        provider: m.provider,
        accountName: m.account_name,
        accountNumber: m.account_number,
        last4: m.last4,
        expiryDate: m.expiry_date,
        isDefault: m.is_default,
        createdAt: m.created_at
      }))
    });
  } catch (error: any) {
    console.error('❌ Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch payment methods'
    });
  }
}

/**
 * Add a new saved payment method for user
 * POST /api/payments/methods
 */
export async function addPaymentMethod(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { type, provider, accountNumber, accountName, expiryDate } = req.body;

    if (!type || !provider || !accountNumber) {
      res.status(400).json({
        success: false,
        error: 'Payment type, provider, and account number are required'
      });
      return;
    }

    const cleanedNumber = String(accountNumber).trim();
    const lastDigits = cleanedNumber.replace(/\D/g, '').slice(-4) || '0000';

    let maskedNumber = cleanedNumber;
    if (type === 'card') {
      maskedNumber = `•••• •••• •••• ${lastDigits}`;
    } else {
      const cleanPhone = cleanedNumber.replace(/\s+/g, '');
      maskedNumber = cleanPhone.length > 6
        ? `${cleanPhone.slice(0, 3)} ••• ${lastDigits}`
        : `•••• ${lastDigits}`;
    }

    const savedMethod = await prisma.user_payment_methods.create({
      data: {
        user_id: userId,
        type: type.toLowerCase(),
        provider: provider.trim(),
        account_name: accountName?.trim() || null,
        account_number: maskedNumber,
        last4: lastDigits,
        expiry_date: expiryDate?.trim() || null
      }
    });

    console.log(`💳 Saved payment method for user ${userId}: ${provider} (${type})`);

    res.status(201).json({
      success: true,
      message: 'Payment method registered successfully',
      method: {
        id: savedMethod.id,
        type: savedMethod.type,
        provider: savedMethod.provider,
        accountName: savedMethod.account_name,
        accountNumber: savedMethod.account_number,
        last4: savedMethod.last4,
        expiryDate: savedMethod.expiry_date,
        isDefault: savedMethod.is_default,
        createdAt: savedMethod.created_at
      }
    });
  } catch (error: any) {
    console.error('❌ Add payment method error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save payment method'
    });
  }
}

/**
 * Delete a user's saved payment method
 * DELETE /api/payments/methods/:id
 */
export async function deletePaymentMethod(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const deleteResult = await prisma.user_payment_methods.deleteMany({
      where: {
        id,
        user_id: userId
      }
    });

    if (deleteResult.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Payment method not found or not authorized'
      });
      return;
    }

    console.log(`🗑️ Deleted payment method ${id} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error: any) {
    console.error('❌ Delete payment method error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete payment method'
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