/**
 * Payment Routes
 * Defines all payment-related API endpoints
 * Updated to match YOUR auth middleware!
 */

import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * TEACHING MOMENT: Route Protection Levels
 * 
 * Level 1: Public (no middleware)
 *   - Anyone can access
 *   - Example: Payment callback
 * 
 * Level 2: Authenticated (authenticate only)
 *   - Must be logged in
 *   - Any user type (CLIENT or PHOTOGRAPHER)
 *   - Example: View banks
 * 
 * Level 3: Role-based (authenticate + authorize)
 *   - Must be logged in AND have specific role
 *   - Example: Admin-only routes
 */

// ==============================================
// PAYMENT INITIALIZATION ROUTES
// ==============================================

/**
 * Initialize deposit payment (40%)
 * POST /api/payments/deposit/initialize
 * 
 * Authentication: Required (CLIENT or PHOTOGRAPHER)
 * 
 * Request body:
 * {
 *   "booking_id": "uuid",
 *   "client_email": "client@example.com"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "authorizationUrl": "https://checkout.paystack.com/...",
 *   "reference": "DEP-BOOK123-1234567890",
 *   "amount": 400.00
 * }
 */
router.post(
  '/deposit/initialize',
  authenticate,  // ← Your auth middleware!
  PaymentController.initializeDeposit
);


// TEMPORARY: Manual payment processing (for local dev)
router.post('/process-manual', authenticate, PaymentController.manuallyProcessPayment);
/**
 * Initialize balance payment (60%)
 * POST /api/payments/balance/initialize
 * 
 * Authentication: Required (CLIENT or PHOTOGRAPHER)
 */
router.post(
  '/balance/initialize',
  authenticate,
  PaymentController.initializeBalance
);

// ==============================================
// WALLET MANAGEMENT ROUTES
// ==============================================

/**
 * Top-up user wallet (Test simulation or Live Paystack)
 * POST /api/payments/wallet/topup
 */
router.post(
  '/wallet/topup',
  authenticate,
  PaymentController.topupWallet
);

/**
 * Get user wallet balance from PostgreSQL
 * GET /api/payments/wallet/balance
 */
router.get(
  '/wallet/balance',
  authenticate,
  PaymentController.getWalletBalance
);

/**
 * Get user wallet transaction history
 * GET /api/payments/wallet/transactions
 */
router.get(
  '/wallet/transactions',
  authenticate,
  PaymentController.getWalletTransactions
);


// ==============================================
// ESCROW RELEASE ROUTES (ADMIN ONLY!)
// ==============================================

/**
 * Release deposit to photographer
 * POST /api/payments/deposit/release
 * 
 * Authentication: Required (ADMIN ONLY)
 * 
 * TEACHING MOMENT: Why admin-only?
 * 
 * Releasing funds is a CRITICAL operation:
 * - Transfers real money
 * - Can't be undone
 * - Must verify photographer actually showed up
 * 
 * Only admins or system should trigger this!
 * 
 * Request body:
 * {
 *   "booking_id": "uuid"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Deposit released to photographer",
 *   "transferCode": "TRF_xxx",
 *   "amount": 340.00,
 *   "commission": 60.00
 * }
 */
router.post(
  '/deposit/release',
  authenticate,           // Must be logged in
  authorize('ADMIN'),     // Must be ADMIN role ← Your role middleware!
  PaymentController.releaseDepositFunds
);

/**
 * Release balance to photographer
 * POST /api/payments/balance/release
 * 
 * Authentication: Required (ADMIN ONLY)
 * 
 * Called after photos are delivered and verified
 */
router.post(
  '/balance/release',
  authenticate,
  authorize('ADMIN'),     // Admin only for security
  PaymentController.releaseBalanceFunds
);

// ==============================================
// PAYMENT CALLBACK ROUTE (PUBLIC)
// ==============================================

/**
 * Payment callback (redirect from Paystack)
 * GET /api/payments/callback
 * 
 * Authentication: None (public endpoint)
 * 
 * Paystack redirects client here after payment
 * Query params: ?reference=xxx&trxref=xxx
 */
router.get(
  '/callback',
  // No authentication! Paystack redirects the client directly
  PaymentController.paymentCallback
);

// ==============================================
// BANK OPERATIONS ROUTES
// ==============================================

/**
 * List available banks
 * GET /api/payments/banks
 * 
 * Authentication: Required (any logged-in user)
 * 
 * Used when photographer sets up bank account
 * 
 * Response:
 * {
 *   "success": true,
 *   "banks": [
 *     {
 *       "name": "Access Bank",
 *       "code": "000014",
 *       "slug": "access-bank"
 *     },
 *     {
 *       "name": "GTBank",
 *       "code": "000013",
 *       "slug": "gtbank"
 *     }
 *   ]
 * }
 */
router.get(
  '/banks',
  authenticate,  // Any logged-in user can view banks
  PaymentController.listBanks
);

/**
 * Verify bank account
 * POST /api/payments/resolve-account
 * 
 * Authentication: Required (any logged-in user)
 * 
 * Validates account number and returns account holder name
 * 
 * Request body:
 * {
 *   "account_number": "0123456789",
 *   "bank_code": "000014"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "account_number": "0123456789",
 *   "account_name": "JOHN DOE",
 *   "bank_code": "000014"
 * }
 */
router.post(
  '/resolve-account',
  authenticate,
  PaymentController.resolveAccount
);

// ==============================================
// SUBACCOUNT MANAGEMENT ROUTES
// ==============================================

/**
 * Create Paystack subaccount
 * POST /api/payments/subaccount
 * 
 * Authentication: Required (PHOTOGRAPHER only recommended)
 * 
 * TEACHING MOMENT: Should we restrict to PHOTOGRAPHER?
 * 
 * Option A: Any authenticated user (current)
 *   - Simpler
 *   - Frontend/business logic controls who calls this
 * 
 * Option B: PHOTOGRAPHER only (more secure)
 *   - Add: authorize('PHOTOGRAPHER')
 *   - Prevents clients from creating subaccounts
 * 
 * For now, using Option A. You can add authorize('PHOTOGRAPHER') if needed!
 * 
 * Request body:
 * {
 *   "business_name": "John's Photography",
 *   "bank_code": "000014",
 *   "account_number": "0123456789"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "subaccount": {
 *     "subaccount_code": "ACCT_xxx",
 *     "business_name": "John's Photography",
 *     "account_number": "0123456789"
 *   },
 *   "account_name": "JOHN DOE",
 *   "message": "Subaccount created successfully"
 * }
 */
router.post(
  '/subaccount',
  authenticate,
  // Optional: Add authorize('PHOTOGRAPHER') if you want photographer-only
  PaymentController.createSubaccount
);

/**
 * WEBHOOK ROUTE NOTE:
 * 
 * The webhook route is NOT defined here!
 * It must be defined in server.ts BEFORE any authentication middleware.
 * 
 * Why?
 * - Paystack calls the webhook directly (it's not a user request)
 * - Paystack can't authenticate with JWT tokens
 * - We verify webhooks using signature verification instead
 * 
 * Add this in server.ts:
 * app.post('/api/webhooks/paystack', PaymentController.paystackWebhook);
 */

export default router;

/**
 * TEACHING MOMENT: Security Best Practices
 * 
 * ✅ PUBLIC routes (no auth):
 *    - Payment callback (Paystack redirects client)
 *    - Webhook (in server.ts, verified by signature)
 * 
 * ✅ AUTHENTICATED routes (authenticate):
 *    - Initialize payments (clients/photographers)
 *    - View banks
 *    - Verify accounts
 *    - Create subaccounts
 * 
 * ✅ ADMIN-ONLY routes (authenticate + authorize('ADMIN')):
 *    - Release deposit ← Real money transfer!
 *    - Release balance ← Real money transfer!
 * 
 * Why admin-only for releases?
 * - Prevents unauthorized fund transfers
 * - Gives platform control over when money moves
 * - Allows verification before releasing funds
 * - Creates audit trail of who released what
 */

/**
 * COMPLETE API ENDPOINT LIST:
 * 
 * PAYMENT FLOW:
 * POST /api/payments/deposit/initialize    [AUTH]
 * POST /api/payments/deposit/release       [ADMIN] ← Real money!
 * POST /api/payments/balance/initialize    [AUTH]
 * POST /api/payments/balance/release       [ADMIN] ← Real money!
 * 
 * BANK SETUP:
 * GET  /api/payments/banks                 [AUTH]
 * POST /api/payments/resolve-account       [AUTH]
 * POST /api/payments/subaccount            [AUTH]
 * 
 * PUBLIC:
 * GET  /api/payments/callback              [PUBLIC]
 * POST /api/webhooks/paystack              [PUBLIC] (in server.ts)
 */

/**
 * OPTIONAL ENHANCEMENTS:
 * 
 * 1. Restrict subaccount creation to photographers:
 *    Add: authorize('PHOTOGRAPHER') to /subaccount route
 * 
 * 2. Allow photographers to see their own release status:
 *    Add: GET /api/payments/releases/:booking_id
 *    With: authorize('PHOTOGRAPHER', 'ADMIN')
 * 
 * 3. Add pagination for payment history:
 *    GET /api/payments/history?page=1&limit=20
 * 
 * 4. Add webhook event history for debugging:
 *    GET /api/payments/webhooks/history (admin only)
 * 
 * You can add these as you build out the platform!
 */