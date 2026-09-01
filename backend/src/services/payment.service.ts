/**
 * Payment Service
 * Business logic for payment processing and escrow management
 * 
 * OPTIMIZED FOR YOUR PRISMA SCHEMA
 */

import prisma from '../config/database';
import { initializePayment, verifyPayment, initiateTransfer, simulateTransfer } from './paystack.service';
import * as NotificationTrigger from '../services/notification-trigger.service';
import * as AvailabilityService from './availability.service';


/**
 * TEACHING MOMENT: Your Schema Structure
 * 
 * Booking → photographer (User) → photographer (Photographer) → paystackSubaccount
 * 
 * This means we need nested includes to access photographer's bank details!
 */

/**
 * Initialize deposit payment
 * Client pays 40% to confirm booking
 * 
 * @param bookingId - Booking ID
 * @param clientEmail - Client's email
 * @returns Payment authorization URL
 */
export async function initializeDepositPayment(
  bookingId: string,
  clientEmail: string
) {
  // Get booking with full photographer details
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      users_bookings_client_idTousers: true,
      users_bookings_photographer_idTousers: {
        include: {
          photographers: true  // ← Photographer model from User
        }
      }
    }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  if (booking.status !== 'ACCEPTED') {
    throw new Error('Can only pay deposit for accepted bookings');
  }
  
  // Check if deposit already paid
  const existingPayment = await prisma.payments.findFirst({
    where: {
      booking_id: bookingId,
      payment_stage: 'DEPOSIT',
      status: 'SUCCESSFUL'
    }
  });
  
  if (existingPayment) {
    throw new Error('Deposit already paid');
  }
  
  /**
   * Generate unique payment reference
   * Format: DEP-BOOKINGNUM-TIMESTAMP
   */
  const reference = `DEP-${booking.booking_number}-${Date.now()}`;

  /**
   * Initialize payment with Paystack
   */
  const paymentData = await initializePayment({
    email: clientEmail,
    amount: Number(booking.deposit_amount),
    reference: reference,
    metadata: {
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      paymentStage: 'DEPOSIT',
      photographerId: booking.photographer_id,
      clientId: booking.client_id
    },
    callback_url: `${process.env.CLIENT_APP_URL}/bookings/${booking.id}/payment-success`
  });
  
  /**
   * Create payment record in database
   * Status: PENDING (will be updated via webhook)
   */
  await prisma.payments.create({
    data: {
      booking_id: booking.id,
      paystack_reference: reference,
      payment_stage: 'DEPOSIT',
      amount: booking.deposit_amount,
      status: 'PENDING',
      hold_status: 'HELD',
      paystack_metadata: paymentData as any
    }
  });

  return {
    authorizationUrl: paymentData.authorizationUrl,
    reference: reference,
    amount: Number(booking.deposit_amount)
  };
}

/**
 * Initialize balance payment
 * Client pays remaining 60% after shoot
 * 
 * @param bookingId - Booking ID
 * @param clientEmail - Client's email
 * @returns Payment authorization URL
 */
export async function initializeBalancePayment(
  bookingId: string,
  clientEmail: string
) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      payments: true  // ← Include payments array
    }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  if (booking.status !== 'IN_PROGRESS') {
    throw new Error('Can only pay balance for in-progress bookings');
  }
  
  if (!booking.shoot_completed_at) {
    throw new Error('Shoot must be completed before paying balance');
  }

  // Check if deposit was paid (using payments array)
  const depositPayment = booking.payments.find(
    (p) => p.payment_stage === 'DEPOSIT' && p.status === 'SUCCESSFUL'
  );

  if (!depositPayment) {
    throw new Error('Deposit must be paid first');
  }

  // Check if balance already paid
  const existingBalance = booking.payments.find(
    (p) => p.payment_stage === 'BALANCE' && p.status === 'SUCCESSFUL'
  );

  if (existingBalance) {
    throw new Error('Balance already paid');
  }

  const reference = `BAL-${booking.booking_number}-${Date.now()}`;

  const paymentData = await initializePayment({
    email: clientEmail,
    amount: Number(booking.balance_amount),
    reference: reference,
    metadata: {
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      paymentStage: 'BALANCE',
      photographerId: booking.photographer_id,
      clientId: booking.client_id
    },
    callback_url: `${process.env.CLIENT_APP_URL}/bookings/${booking.id}/payment-success`
  });

  await prisma.payments.create({
    data: {
      booking_id: booking.id,
      paystack_reference: reference,
      payment_stage: 'BALANCE',
      amount: booking.balance_amount,
      status: 'PENDING',
      hold_status: 'HELD',
      paystack_metadata: paymentData as any
    }
  });

  return {
    authorizationUrl: paymentData.authorizationUrl,
    reference: reference,
    amount: Number(booking.balance_amount)
  };
}

/**
 * Process payment webhook
 * Called when Paystack sends payment confirmation
 * 
 * @param reference - Payment reference
 * @returns Updated payment
 */
export async function processPaymentWebhook(reference: string) {
  /**
   * TEACHING MOMENT: Webhook Processing
   * 
   * Webhooks are async notifications from Paystack
   * They tell us: "Hey, payment was successful!"
   * 
   * We must:
   * 1. Verify payment with Paystack API (don't trust webhook alone!)
   * 2. Update payment record
   * 3. Update booking status
   * 4. Send notifications
   */
  
  // Find payment record
  const payment = await prisma.payments.findUnique({
    where: { paystack_reference: reference },
    include: {
      bookings: true
    }
  });
  
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  // Verify payment with Paystack
  const verification = await verifyPayment(reference);
  
  if (verification.status !== 'success') {
    // Payment failed
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED'
      }
    });
    
    throw new Error('Payment verification failed');
  }
  
  // Update payment record
  const updatedPayment = await prisma.payments.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCESSFUL',
      held_at: new Date()
    }
  });

  /**
   * Update booking status based on payment stage
   */
  if (payment.payment_stage === 'DEPOSIT') {
    // Deposit paid → Booking confirmed
    await prisma.bookings.update({
      where: { id: payment.booking_id },
      data: {
        status: 'CONFIRMED',
        confirmed_at: new Date()
      }
    });

      const booking = await prisma.bookings.findUnique({
        where: { id: payment.booking_id }
      });

      if (booking) {
        await AvailabilityService.markAsBooked(
          booking.photographer_id,
          booking.event_date,
          booking.id
        );
      }
  }
  
  /**
   * TODO: Send notifications
   * - Email to client: "Payment successful"
   * - Email to photographer: "Booking confirmed" (for deposit)
   * - Push notifications
   */

  /**
 * Send notifications based on payment stage
 */
if (payment.payment_stage === 'DEPOSIT') {
  // Notify photographer about deposit payment
  const booking = await prisma.bookings.findUnique({
    where: { id: payment.booking_id },
    include: {
      users_bookings_client_idTousers: true,
      users_bookings_photographer_idTousers: true
    }
  });

  if (booking) {
    // Notify photographer
    NotificationTrigger.onPaymentReceived({
      photographerId: booking.photographer_id,
      photographerEmail: booking.users_bookings_photographer_idTousers.email,
      photographerName: `${booking.users_bookings_photographer_idTousers.first_name} ${booking.users_bookings_photographer_idTousers.last_name}`,
      bookingNumber: booking.booking_number,
      amount: Number(payment.amount),
      paymentStage: 'DEPOSIT'
    }).catch(err => console.error('Notification error:', err));

    // Notify both about booking confirmation
    NotificationTrigger.onBookingConfirmed({
      clientId: booking.client_id,
      clientEmail: booking.users_bookings_client_idTousers.email,
      clientName: `${booking.users_bookings_client_idTousers.first_name} ${booking.users_bookings_client_idTousers.last_name}`,
      photographerId: booking.photographer_id,
      photographerEmail: booking.users_bookings_photographer_idTousers.email,
      photographerName: `${booking.users_bookings_photographer_idTousers.first_name} ${booking.users_bookings_photographer_idTousers.last_name}`,
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      eventDate: booking.event_date.toISOString().split('T')[0],
      eventLocation: booking.event_location
    }).catch(err => console.error('Notification error:', err));
  }
} else if (payment.payment_stage === 'BALANCE') {
  // Notify photographer about balance payment
  const booking = await prisma.bookings.findUnique({
    where: { id: payment.booking_id },
    include: {
      users_bookings_photographer_idTousers: true
    }
  });

  if (booking) {
    NotificationTrigger.onPaymentReceived({
      photographerId: booking.photographer_id,
      photographerEmail: booking.users_bookings_photographer_idTousers.email,
      photographerName: `${booking.users_bookings_photographer_idTousers.first_name} ${booking.users_bookings_photographer_idTousers.last_name}`,
      bookingNumber: booking.booking_number,
      amount: Number(payment.amount),
      paymentStage: 'BALANCE'
    }).catch(err => console.error('Notification error:', err));
  }
}
  
  return updatedPayment;
}

/**
 * Release deposit to photographer
 * Called when photographer checks in (starts shoot)
 * 
 * @param bookingId - Booking ID
 * @returns Transfer details
 */
export async function releaseDeposit(bookingId: string) {
  // Get booking with FULL photographer details including subaccount
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      payments: true,
      users_bookings_photographer_idTousers: {
        include: {
          photographers: {
            include: {
              paystack_subaccounts: true,
              subscriptions: true
            }
          }
        }
      }
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (!booking.users_bookings_photographer_idTousers.photographers) {
    throw new Error('Photographer profile not found');
  }

  // Find deposit payment
  const depositPayment = booking.payments.find(
    (p) => p.payment_stage === 'DEPOSIT' && p.status === 'SUCCESSFUL'
  );

  if (!depositPayment) {
    throw new Error('Deposit payment not found');
  }

  if (depositPayment.hold_status !== 'HELD') {
    throw new Error('Deposit already released');
  }

  // Get photographer's Paystack subaccount
  const paystackSubaccount = booking.users_bookings_photographer_idTousers.photographers.paystack_subaccounts;
  
  if (!paystackSubaccount) {
    throw new Error('Photographer has not set up payout account');
  }
  
  // Calculate photographer payout
  const depositAmount = Number(depositPayment.amount);
  const commissionRate = Number(booking.platform_commission) / Number(booking.total_amount);
  const commission = depositAmount * commissionRate;
  const photographerPayout = depositAmount - commission;

  console.log('💰 Releasing deposit to photographer:');
  console.log('   Deposit amount: ₵' + depositAmount.toFixed(2));
  console.log('   Commission: ₵' + commission.toFixed(2));
  console.log('   Photographer payout: ₵' + photographerPayout.toFixed(2));

  // Initiate transfer (simulated or real based on env)
  let transfer;
  try {
    // Check if we should simulate
    if (process.env.SIMULATE_TRANSFERS === 'true') {
      console.log('🧪 Using simulated transfer...');
      transfer = await simulateTransfer({
        amount: photographerPayout,
        recipient: paystackSubaccount.subaccount_code,
        reason: `Deposit payout for booking ${booking.booking_number}`,
        reference: `DEP-RELEASE-${booking.booking_number}-${Date.now()}`
      });
    } else {
      console.log('💳 Using real Paystack transfer...');
      transfer = await initiateTransfer({
        amount: photographerPayout,
        recipient: paystackSubaccount.subaccount_code,
        reason: `Deposit payout for booking ${booking.booking_number}`,
        reference: `DEP-RELEASE-${booking.booking_number}-${Date.now()}`
      });
    }
    
    console.log('✅ Transfer successful:', transfer.transferCode);
    
  } catch (error: any) {
    console.error('❌ Transfer failed:', error.message);
    throw new Error(`Failed to transfer funds: ${error.message}`);
  }
  
  // Update payment record (THIS IS CRITICAL!)
  console.log('💾 Updating payment record in database...');
  const updatedPayment = await prisma.payments.update({
    where: { id: depositPayment.id },
    data: {
      hold_status: 'RELEASED_TO_PHOTOGRAPHER',
      released_at: new Date(),
      release_notes: `Released: ₵${photographerPayout.toFixed(2)} (Commission: ₵${commission.toFixed(2)})`
    }
  });

  console.log('✅ Payment record updated!');
  console.log('   Payment ID:', updatedPayment.id);
  console.log('   Hold Status:', updatedPayment.hold_status);
  console.log('   Released At:', updatedPayment.released_at);
  
  return {
    success: true,
    transferCode: transfer.transferCode,
    amount: photographerPayout,
    commission: commission
  };
}


/**
 * COMPLETE FIX: Release balance to photographer
 */
export async function releaseBalance(bookingId: string) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      payments: true,
      users_bookings_photographer_idTousers: {
        include: {
          photographers: {
            include: {
              paystack_subaccounts: true,
              subscriptions: true
            }
          }
        }
      }
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (!booking.users_bookings_photographer_idTousers.photographers) {
    throw new Error('Photographer profile not found');
  }

  // Find balance payment
  const balancePayment = booking.payments.find(
    (p) => p.payment_stage === 'BALANCE' && p.status === 'SUCCESSFUL'
  );

  if (!balancePayment) {
    throw new Error('Balance payment not found');
  }

  if (balancePayment.hold_status !== 'HELD') {
    throw new Error('Balance already released');
  }

  const paystackSubaccount = booking.users_bookings_photographer_idTousers.photographers.paystack_subaccounts;

  if (!paystackSubaccount) {
    throw new Error('Photographer has not set up payout account');
  }

  const balanceAmount = Number(balancePayment.amount);
  const commissionRate = Number(booking.platform_commission) / Number(booking.total_amount);
  const commission = balanceAmount * commissionRate;
  const photographerPayout = balanceAmount - commission;

  console.log('💰 Releasing balance to photographer:');
  console.log('   Balance amount: ₵' + balanceAmount.toFixed(2));
  console.log('   Commission: ₵' + commission.toFixed(2));
  console.log('   Photographer payout: ₵' + photographerPayout.toFixed(2));

  // Initiate transfer (simulated or real)
  let transfer;
  try {
    if (process.env.SIMULATE_TRANSFERS === 'true') {
      console.log('🧪 Using simulated transfer...');
      transfer = await simulateTransfer({
        amount: photographerPayout,
        recipient: paystackSubaccount.subaccount_code,
        reason: `Balance payout for booking ${booking.booking_number}`,
        reference: `BAL-RELEASE-${booking.booking_number}-${Date.now()}`
      });
    } else {
      console.log('💳 Using real Paystack transfer...');
      transfer = await initiateTransfer({
        amount: photographerPayout,
        recipient: paystackSubaccount.subaccount_code,
        reason: `Balance payout for booking ${booking.booking_number}`,
        reference: `BAL-RELEASE-${booking.booking_number}-${Date.now()}`
      });
    }

    console.log('✅ Transfer successful:', transfer.transferCode);

  } catch (error: any) {
    console.error('❌ Transfer failed:', error.message);
    throw new Error(`Failed to transfer funds: ${error.message}`);
  }

  // Update payment record
  console.log('💾 Updating payment record in database...');
  const updatedPayment = await prisma.payments.update({
    where: { id: balancePayment.id },
    data: {
      hold_status: 'RELEASED_TO_PHOTOGRAPHER',
      released_at: new Date(),
      release_notes: `Released: ₵${photographerPayout.toFixed(2)} (Commission: ₵${commission.toFixed(2)})`
    }
  });

  console.log('✅ Payment record updated!');
  console.log('   Payment ID:', updatedPayment.id);
  console.log('   Hold Status:', updatedPayment.hold_status);
  console.log('   Released At:', updatedPayment.released_at);

  return {
    success: true,
    transferCode: transfer.transferCode,
    amount: photographerPayout,
    commission: commission
  };
}


/**
 * TEACHING MOMENT: Your Schema Structure Visualized
 * 
 * Booking
 * ├── photographerId (String)
 * ├── photographer (User model)
 * │   └── photographer (Photographer model)
 * │       ├── paystackSubaccount (PaystackSubaccount model)
 * │       │   └── subaccountCode (String) ← What we need!
 * │       └── subscription (Subscription model)
 * │           └── commissionRate (Decimal)
 * └── payments (Payment[] array)
 *     └── Payment
 *         ├── paymentStage (DEPOSIT | BALANCE)
 *         ├── status (PENDING | SUCCESSFUL | FAILED)
 *         └── holdStatus (HELD | RELEASED_TO_PHOTOGRAPHER)
 * 
 * That's why we need nested includes!
 */