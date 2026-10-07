/**
 * Notification Trigger Service
 * Central place to trigger both in-app notifications and emails
 * Call these functions from your controllers when events happen
 */

import prisma from '../config/database';
import * as NotificationService from './notification.service';
import * as EmailService from './email.service';
import * as EmailTemplates from './email.templates';
import { EMAIL_CONFIG } from '../config/email';
import { ArkeselSmsService } from './sms.service';

/**
 * TEACHING MOMENT: Centralized Notification Logic
 * 
 * Instead of scattering notification code throughout controllers:
 * âŒ In booking.controller.ts: createNotification(), sendEmail()
 * âŒ In payment.controller.ts: createNotification(), sendEmail()
 * âŒ In photo.controller.ts: createNotification(), sendEmail()
 * 
 * We centralize it here:
 * âœ… In booking.controller.ts: NotificationTrigger.onBookingCreated()
 * âœ… In payment.controller.ts: NotificationTrigger.onPaymentReceived()
 * âœ… In photo.controller.ts: NotificationTrigger.onPhotosDelivered()
 * 
 * Benefits:
 * - Single source of truth for notifications
 * - Easy to maintain
 * - Consistent notification format
 * - Can add/remove notification channels easily
 */

/**
 * Trigger when booking is created
 * Notifies photographer of new request
 */
export async function onBookingCreated(data: {
  photographerId: string;
  photographerEmail: string;
  photographerName: string;
  clientName: string;
  bookingId: string;
  bookingNumber: string;
  occasionType: string;
  eventDate: string;
  eventLocation: string;
  totalAmount: number;
}) {
  console.log(`📬 Triggering notifications: Booking created (${data.bookingNumber})`);
  
  // In-app notification
  await NotificationService.createNotification({
    userId: data.photographerId,
    type: 'BOOKING_REQUEST',
    title: 'New Booking Request',
    message: `${data.clientName} wants to book you for ${data.occasionType} on ${data.eventDate}`,
    data: {
      bookingId: data.bookingId,
      bookingNumber: data.bookingNumber
    }
  });
  
  // Email notification
  const html = EmailTemplates.bookingRequestEmail({
    photographerName: data.photographerName,
    clientName: data.clientName,
    bookingNumber: data.bookingNumber,
    occasionType: data.occasionType,
    eventDate: data.eventDate,
    eventLocation: data.eventLocation,
    totalAmount: data.totalAmount,
    bookingUrl: `${EMAIL_CONFIG.templates.baseUrl}/bookings/${data.bookingId}`
  });
  
  await EmailService.sendEmail({
    to: data.photographerEmail,
    subject: `New Booking Request - ${data.bookingNumber}`,
    html,
    text: EmailService.htmlToText(html)
  });
}

/**
 * Trigger notification when a new message is received
 * 
 * @param data - Message notification data
 */
export async function onMessageReceived(data: {
  receiverId: string;
  receiverEmail?: string;
  receiverName?: string;
  senderName: string;
  messageText: string;
  bookingNumber?: string;
  bookingId?: string;
}) {
  console.log(`📬 Triggering notifications: New message received`);
  
  try {
    // Truncate long messages for notification
    const messagePreview = data.messageText.length > 100 
      ? data.messageText.substring(0, 100) + '...' 
      : data.messageText;
    
    // Create in-app notification
    await NotificationService.createNotification({
      userId: data.receiverId,
      type: 'MESSAGE_RECEIVED' as any,
      title: `New message from ${data.senderName}`,
      message: messagePreview,
      data: {
        bookingId: data.bookingId,
        bookingNumber: data.bookingNumber,
        senderName: data.senderName
      }
    });
    
    // Send email notification if receiver email is available
    if (data.receiverEmail) {
      await EmailService.sendEmail({
        to: data.receiverEmail,
        subject: `New message from ${data.senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">💬 New Message</h1>
          </div>
          
          <div style="padding: 40px; background: white;">
            <h2>Hi ${data.receiverName},</h2>
            
            <p>You have a new message from <strong>${data.senderName}</strong> regarding booking <strong>${data.bookingNumber}</strong>:</p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
                "${messagePreview}"
              </p>
            </div>
            
            <p>Reply to this message in the app to continue the conversation.</p>
            
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/messages/${data.bookingId}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0;">
              View Message
            </a>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 14px; margin: 0;">Photography Platform</p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">This is an automated notification.</p>
          </div>
        </div>
      `,
      text: `
      New Message from ${data.senderName}

      Hi ${data.receiverName},

      You have a new message regarding booking ${data.bookingNumber}:

      "${messagePreview}"

      Reply to this message in the app to continue the conversation.

      View message: ${process.env.APP_URL || 'http://localhost:3000'}/messages/${data.bookingId}

      ---
      Photography Platform
      This is an automated notification.
      `
      });
    }
    
    console.log('✅ Message notification sent');
  } catch (error) {
    console.error('❌ Failed to send message notification:', error);
  }
}

/**
 * Trigger when photographer accepts booking
 * Notifies client to pay deposit
 */
export async function onBookingAccepted(data: {
  clientId: string;
  clientEmail: string;
  clientName: string;
  photographerName: string;
  bookingId: string;
  bookingNumber: string;
  eventDate: string;
  depositAmount: number;
}) {
  console.log(`📬 Triggering notifications: Booking accepted (${data.bookingNumber})`);
  
  // In-app notification
  await NotificationService.createNotification({
    userId: data.clientId,
    type: 'BOOKING_ACCEPTED',
    title: 'Booking Accepted!',
    message: `${data.photographerName} accepted your booking. Pay deposit to confirm.`,
    data: {
      bookingId: data.bookingId,
      bookingNumber: data.bookingNumber
    }
  });
  
  // Email notification
  const html = EmailTemplates.bookingAcceptedEmail({
    clientName: data.clientName,
    photographerName: data.photographerName,
    bookingNumber: data.bookingNumber,
    eventDate: data.eventDate,
    depositAmount: data.depositAmount,
    paymentUrl: `${EMAIL_CONFIG.templates.baseUrl}/bookings/${data.bookingId}/pay`
  });
  
  await EmailService.sendEmail({
    to: data.clientEmail,
    subject: `Booking Accepted - ${data.bookingNumber}`,
    html,
    text: EmailService.htmlToText(html)
  });
}

/**
 * Trigger when photographer rejects booking
 * Notifies client
 */
export async function onBookingRejected(data: {
  clientId: string;
  clientEmail: string;
  clientName: string;
  photographerName: string;
  bookingId: string;
  bookingNumber: string;
  reason?: string;
}) {
  console.log(`📬 Triggering notifications: Booking rejected (${data.bookingNumber})`);
  
  // In-app notification
  await NotificationService.createNotification({
    userId: data.clientId,
    type: 'BOOKING_REJECTED',
    title: 'Booking Unavailable',
    message: `${data.photographerName} is unable to accept your booking`,
    data: {
      bookingId: data.bookingId,
      bookingNumber: data.bookingNumber
    }
  });
  
  // Email notification
  const html = EmailTemplates.bookingRejectedEmail({
    clientName: data.clientName,
    photographerName: data.photographerName,
    bookingNumber: data.bookingNumber,
    reason: data.reason
  });
  
  await EmailService.sendEmail({
    to: data.clientEmail,
    subject: `Booking Update - ${data.bookingNumber}`,
    html,
    text: EmailService.htmlToText(html)
  });
}

/**
 * Trigger when deposit is paid
 * Notifies both client and photographer
 */
export async function onBookingConfirmed(data: {
  clientId: string;
  clientEmail: string;
  clientName: string;
  photographerId: string;
  photographerEmail: string;
  photographerName: string;
  bookingId: string;
  bookingNumber: string;
  eventDate: string;
  eventLocation: string;
}) {
  console.log(`📬 Triggering notifications: Booking confirmed (${data.bookingNumber})`);
  
  // Notify client
  await NotificationService.createNotification({
    userId: data.clientId,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed!',
    message: `Your booking ${data.bookingNumber} is confirmed. See you on ${data.eventDate}!`,
    data: {
      bookingId: data.bookingId,
      bookingNumber: data.bookingNumber
    }
  });
  
  const clientHtml = EmailTemplates.bookingConfirmedEmail({
    recipientName: data.clientName,
    bookingNumber: data.bookingNumber,
    eventDate: data.eventDate,
    eventLocation: data.eventLocation,
    bookingUrl: `${EMAIL_CONFIG.templates.baseUrl}/bookings/${data.bookingId}`
  });
  
  await EmailService.sendEmail({
    to: data.clientEmail,
    subject: `Booking Confirmed - ${data.bookingNumber}`,
    html: clientHtml,
    text: EmailService.htmlToText(clientHtml)
  });
  
  // Notify photographer
  await NotificationService.createNotification({
    userId: data.photographerId,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed!',
    message: `${data.clientName} paid the deposit. Booking ${data.bookingNumber} is confirmed.`,
    data: {
      bookingId: data.bookingId,
      bookingNumber: data.bookingNumber
    }
  });
  
  const photographerHtml = EmailTemplates.bookingConfirmedEmail({
    recipientName: data.photographerName,
    bookingNumber: data.bookingNumber,
    eventDate: data.eventDate,
    eventLocation: data.eventLocation,
    bookingUrl: `${EMAIL_CONFIG.templates.baseUrl}/bookings/${data.bookingId}`
  });
  
  await EmailService.sendEmail({
    to: data.photographerEmail,
    subject: `Booking Confirmed - ${data.bookingNumber}`,
    html: photographerHtml,
    text: EmailService.htmlToText(photographerHtml)
  });
}



/**
 * Trigger when payment is received
 * Notifies photographer
 */
export async function onPaymentReceived(data: {
  photographerId: string;
  photographerEmail: string;
  photographerName: string;
  bookingNumber: string;
  amount: number;
  paymentStage: 'DEPOSIT' | 'BALANCE';
}) {
  console.log(`📬 Triggering notifications: Payment received (${data.paymentStage})`);
  
  await NotificationService.createNotification({
    userId: data.photographerId,
    type: 'PAYMENT_RECEIVED',
    title: 'Payment Received',
    message: `${data.paymentStage} payment of ₵${data.amount} received for ${data.bookingNumber}`,
    data: {
      bookingNumber: data.bookingNumber,
      amount: data.amount,
      paymentStage: data.paymentStage
    }
  });
  
  const html = EmailTemplates.paymentReceivedEmail({
    photographerName: data.photographerName,
    bookingNumber: data.bookingNumber,
    amount: data.amount,
    paymentStage: data.paymentStage
  });
  
  await EmailService.sendEmail({
    to: data.photographerEmail,
    subject: `Payment Received - ${data.bookingNumber}`,
    html,
    text: EmailService.htmlToText(html)
  });
}

/**
 * Trigger when photos are delivered
 * Notifies client
 */
export async function onPhotosDelivered(data: {
  clientId: string;
  clientEmail: string;
  clientName: string;
  bookingId: string;
  bookingNumber: string;
  photoCount: number;
}) {
  console.log(`📬 Triggering notifications: Photos delivered (${data.bookingNumber})`);
  
  await NotificationService.createNotification({
    userId: data.clientId,
    type: 'PHOTOS_DELIVERED',
    title: 'Photos Ready!',
    message: `Your ${data.photoCount} photos are ready for download!`,
    data: {
      bookingId: data.bookingId,
      bookingNumber: data.bookingNumber,
      photoCount: data.photoCount
    }
  });
  
  const html = EmailTemplates.photosDeliveredEmail({
    clientName: data.clientName,
    bookingNumber: data.bookingNumber,
    photoCount: data.photoCount,
    downloadUrl: `${EMAIL_CONFIG.templates.baseUrl}/bookings/${data.bookingId}/photos`
  });
  
  await EmailService.sendEmail({
    to: data.clientEmail,
    subject: `Photos Ready - ${data.bookingNumber}`,
    html,
    text: EmailService.htmlToText(html)
  });
}

/**
 * Trigger when review is received
 * Notifies photographer
 */
/**
 * Trigger notification when a review is received
 */
export async function onReviewReceived(data: {
  revieweeId: string;
  revieweeEmail: string;
  revieweeName: string;
  reviewerName: string;
  rating: number;
  bookingNumber: string;
  comment?: string;
}) {
  console.log(`📬 Triggering notifications: Review received (${data.rating} stars)`);
  
  try {
    // In-app notification
    await NotificationService.createNotification({
      userId: data.revieweeId,
      type: 'REVIEW_RECEIVED',
      title: `New ${data.rating}-Star Review`,
      message: `${data.reviewerName} left you a ${data.rating}-star review for booking ${data.bookingNumber}.`,
      data: {
        bookingNumber: data.bookingNumber,
        rating: data.rating,
        reviewerName: data.reviewerName
      }
    });
    
    // Email notification
    const stars = '⭐'.repeat(data.rating);
    
    await EmailService.sendEmail({
      to: data.revieweeEmail,
      subject: `New ${data.rating}-Star Review Received`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Review Received! ${stars}</h1>
          </div>
          
          <div style="padding: 40px; background: white;">
            <h2>Hi ${data.revieweeName},</h2>
            
            <p>Great news! You've received a <strong>${data.rating}-star review</strong> from <strong>${data.reviewerName}</strong> for booking <strong>${data.bookingNumber}</strong>.</p>
            
            ${data.comment ? `
              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
                <div style="font-size: 24px; margin-bottom: 10px;">${stars}</div>
                <p style="font-style: italic; color: #666;">"${data.comment}"</p>
              </div>
            ` : ''}
            
            <p>Positive reviews like this help build your reputation and attract more clients!</p>
            
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/profile" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0;">
              View Your Profile
            </a>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">Keep up the great work! 📸</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 14px; margin: 0;">Photography Platform</p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">This is an automated notification.</p>
          </div>
        </div>
      `,
      text: `
      New Review Received! ${stars}

      Hi ${data.revieweeName},

      Great news! You've received a ${data.rating}-star review from ${data.reviewerName} for booking ${data.bookingNumber}.

      ${data.comment ? `Review: "${data.comment}"` : ''}

      Positive reviews like this help build your reputation and attract more clients!

      View your profile: ${process.env.APP_URL || 'http://localhost:3000'}/profile

      Keep up the great work! 📸
            `
    });
          
      console.log('✅ Review notification sent');
    } catch (error) {
          console.error('❌ Failed to send review notification:', error);
        }
}

/**
 * Trigger when deliverables access PIN is released after balance settlement / admin confirmation
 */
export async function onDeliverablesPinReleased(data: {
  clientId: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientName: string;
  photographerName: string;
  bookingId: string;
  bookingNumber: string;
  accessPin: string;
  deliveryUrl: string;
}) {
  console.log(`📬 Triggering notifications: Deliverables PIN released for booking ${data.bookingNumber}`);

  try {
    // 1. In-App Notification
    await NotificationService.createNotification({
      userId: data.clientId,
      type: 'PHOTOS_DELIVERED',
      title: '🔐 Access PIN & Gallery Unlocked',
      message: `Your final gallery from ${data.photographerName} is unlocked! Access PIN: ${data.accessPin}`,
      data: {
        bookingId: data.bookingId,
        bookingNumber: data.bookingNumber,
        accessPin: data.accessPin,
        deliveryUrl: data.deliveryUrl
      }
    });

    // 2. Direct message in app conversation from System Admin
    try {
      await prisma.messages.create({
        data: {
          booking_id: data.bookingId,
          sender_id: data.clientId,
          receiver_id: data.clientId,
          message_text: `🎉 Official Admin Notice: Remaining balance verified! Your Access PIN for your deliverables gallery is: ${data.accessPin}\nDelivery URL: ${data.deliveryUrl}`
        }
      });
    } catch (msgErr) {
      console.warn('Direct message log failed:', msgErr);
    }

    // 3. Email Notification
    const emailSubject = `🔐 Access PIN Released - Booking #${data.bookingNumber}`;
    const emailBody = `
      <h2>Your Session Deliverables Are Ready!</h2>
      <p>Dear ${data.clientName},</p>
      <p>Your remaining balance for booking <strong>#${data.bookingNumber}</strong> with <strong>${data.photographerName}</strong> has been successfully confirmed.</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Your Secure Access PIN</p>
        <p style="margin: 8px 0; font-size: 32px; font-weight: 900; font-family: monospace; letter-spacing: 4px; color: #111827;">${data.accessPin}</p>
      </div>
      <p>Click below to open your gallery:</p>
      <a href="${data.deliveryUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Master Gallery</a>
      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">ClickFlicks Escrow Administration</p>
    `;

    await EmailService.sendEmail({
      to: data.clientEmail,
      subject: emailSubject,
      html: emailBody,
      text: `Your remaining balance for booking #${data.bookingNumber} with ${data.photographerName} has been confirmed. Your Access PIN is: ${data.accessPin}. Gallery URL: ${data.deliveryUrl}`
    });

    // 4. SMS text notification (Live Arkesel Gateway Dispatch)
    if (data.clientPhone) {
      try {
        await ArkeselSmsService.sendBookingPinSms(data.clientPhone, data.bookingNumber, data.accessPin);
      } catch (smsErr: any) {
        console.warn('Arkesel PIN SMS dispatch error:', smsErr.message);
      }
    }
  } catch (err) {
    console.error('Failed to trigger deliverables PIN released notification:', err);
  }
}

/**
 * Trigger when user registers
 * Sends welcome email
 */
export async function onUserRegistered(data: {
  userId: string;
  email: string;
  firstName: string;
  userType: 'CLIENT' | 'PHOTOGRAPHER';
}) {
  console.log(`📬 Triggering notifications: User registered (${data.email})`);
  
  const html = EmailTemplates.welcomeEmail({
    firstName: data.firstName,
    userType: data.userType
  });
  
  await EmailService.sendEmail({
    to: data.email,
    subject: `Welcome to ${EMAIL_CONFIG.templates.companyName}!`,
    html,
    text: EmailService.htmlToText(html)
  });
}


/**
 * TEACHING MOMENT: How to Use These Triggers
 * 
 * In your controllers, call these functions after the main operation succeeds:
 * 
 * Example 1: When creating a booking
 * 
 * export async function createBooking(req, res) {
 *   try {
 *     const booking = await BookingService.createBooking(data);
 *     
 *     // Trigger notifications (don't await - fire and forget)
 *     NotificationTrigger.onBookingCreated({
 *       photographerId: booking.photographerId,
 *       photographerEmail: booking.photographer.email,
 *       ...
 *     }).catch(err => console.error('Notification error:', err));
 *     
 *     return res.status(201).json({ success: true, booking });
 *   } catch (error) {
 *     // ...
 *   }
 * }
 * 
 * Example 2: When paying deposit
 * 
 * export async function processPaymentWebhook(req, res) {
 *   // ... verify payment, update booking
 *   
 *   // Trigger notifications
 *   NotificationTrigger.onBookingConfirmed({
 *     clientId: booking.clientId,
 *     ...
 *   }).catch(err => console.error('Notification error:', err));
 * }
 * 
 * Key Pattern:
 * - Call trigger functions AFTER successful operations
 * - Don't await (use .catch for errors)
 * - Fire and forget - don't block the response
 * - Log errors but don't fail the main operation
 */