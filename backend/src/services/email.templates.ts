/**
 * Email Templates
 * Beautiful HTML email templates for all notification types
 */

import { EMAIL_CONFIG } from '../config/email';

/**
 * Base email template
 * Wraps all emails with consistent header/footer
 */
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${EMAIL_CONFIG.templates.companyName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #333;
            margin-top: 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: 600;
        }
        .button:hover {
            background: #764ba2;
        }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${EMAIL_CONFIG.templates.companyName}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${EMAIL_CONFIG.templates.supportEmail}">${EMAIL_CONFIG.templates.supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.templates.companyName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Booking Request Email (to Photographer)
 */
export function bookingRequestEmail(data: {
  photographerName: string;
  clientName: string;
  bookingNumber: string;
  occasionType: string;
  eventDate: string;
  eventLocation: string;
  totalAmount: number;
  bookingUrl: string;
}): string {
  const content = `
    <h2>🎉 New Booking Request!</h2>
    <p>Hi ${data.photographerName},</p>
    <p>Great news! You have a new booking request from <strong>${data.clientName}</strong>.</p>
    
    <div class="info-box">
        <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
        <p><strong>Occasion:</strong> ${data.occasionType}</p>
        <p><strong>Date:</strong> ${data.eventDate}</p>
        <p><strong>Location:</strong> ${data.eventLocation}</p>
        <p><strong>Amount:</strong> ₵${data.totalAmount.toFixed(2)}</p>
    </div>
    
    <p>Please review the booking details and accept or reject the request.</p>
    
    <a href="${data.bookingUrl}" class="button">View Booking Details</a>
    
    <p>Remember: You have 24 hours to respond to this booking request.</p>
  `;
  
  return baseTemplate(content);
}

/**
 * Booking Accepted Email (to Client)
 */
export function bookingAcceptedEmail(data: {
  clientName: string;
  photographerName: string;
  bookingNumber: string;
  eventDate: string;
  depositAmount: number;
  paymentUrl: string;
}): string {
  const content = `
    <h2>✅ Booking Accepted!</h2>
    <p>Hi ${data.clientName},</p>
    <p>Excellent news! <strong>${data.photographerName}</strong> has accepted your booking request.</p>
    
    <div class="info-box">
        <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
        <p><strong>Event Date:</strong> ${data.eventDate}</p>
        <p><strong>Deposit Required:</strong> ₵${data.depositAmount.toFixed(2)}</p>
    </div>
    
    <p><strong>Next Step:</strong> Please pay the deposit to confirm your booking.</p>
    
    <a href="${data.paymentUrl}" class="button">Pay Deposit Now</a>
    
    <p>Your booking will be confirmed once payment is received.</p>
  `;
  
  return baseTemplate(content);
}

/**
 * Booking Confirmed Email (to Both)
 */
export function bookingConfirmedEmail(data: {
  recipientName: string;
  bookingNumber: string;
  eventDate: string;
  eventLocation: string;
  bookingUrl: string;
}): string {
  const content = `
    <h2>🎊 Booking Confirmed!</h2>
    <p>Hi ${data.recipientName},</p>
    <p>Your booking <strong>${data.bookingNumber}</strong> is now confirmed!</p>
    
    <div class="info-box">
        <p><strong>Event Date:</strong> ${data.eventDate}</p>
        <p><strong>Location:</strong> ${data.eventLocation}</p>
    </div>
    
    <p>The deposit has been received and your booking is locked in.</p>
    
    <a href="${data.bookingUrl}" class="button">View Booking</a>
  `;
  
  return baseTemplate(content);
}

/**
 * Photos Delivered Email (to Client)
 */
export function photosDeliveredEmail(data: {
  clientName: string;
  bookingNumber: string;
  photoCount: number;
  downloadUrl: string;
}): string {
  const content = `
    <h2>📸 Your Photos Are Ready!</h2>
    <p>Hi ${data.clientName},</p>
    <p>Great news! Your photos from booking <strong>${data.bookingNumber}</strong> are ready for download.</p>
    
    <div class="info-box">
        <p><strong>Total Photos:</strong> ${data.photoCount}</p>
        <p><strong>Available for:</strong> 30 days</p>
    </div>
    
    <p>Download your photos now before they expire!</p>
    
    <a href="${data.downloadUrl}" class="button">Download Photos</a>
    
    <p>Please don't forget to leave a review for your photographer!</p>
  `;
  
  return baseTemplate(content);
}

/**
 * Payment Received Email (to Photographer)
 */
export function paymentReceivedEmail(data: {
  photographerName: string;
  bookingNumber: string;
  amount: number;
  paymentStage: 'DEPOSIT' | 'BALANCE';
}): string {
  const stageText = data.paymentStage === 'DEPOSIT' ? 'Deposit' : 'Balance';
  
  const content = `
    <h2>💰 Payment Received!</h2>
    <p>Hi ${data.photographerName},</p>
    <p>${stageText} payment received for booking <strong>${data.bookingNumber}</strong>.</p>
    
    <div class="info-box">
        <p><strong>Amount:</strong> ₵${data.amount.toFixed(2)}</p>
        <p><strong>Payment Type:</strong> ${stageText}</p>
        <p><strong>Status:</strong> Held in escrow</p>
    </div>
    
    <p>${data.paymentStage === 'DEPOSIT' 
      ? 'The deposit is being held securely. It will be released to you after you start the shoot.' 
      : 'The balance is being held securely. It will be released after you deliver the photos.'
    }</p>
  `;
  
  return baseTemplate(content);
}

/**
 * Booking Rejected Email (to Client)
 */
export function bookingRejectedEmail(data: {
  clientName: string;
  photographerName: string;
  bookingNumber: string;
  reason?: string;
}): string {
  const content = `
    <h2>❌ Booking Not Available</h2>
    <p>Hi ${data.clientName},</p>
    <p>Unfortunately, <strong>${data.photographerName}</strong> is unable to accept your booking request <strong>${data.bookingNumber}</strong>.</p>
    
    ${data.reason ? `
    <div class="info-box">
        <p><strong>Reason:</strong> ${data.reason}</p>
    </div>
    ` : ''}
    
    <p>Don't worry! There are many other talented photographers available on our platform.</p>
    
    <a href="${EMAIL_CONFIG.templates.baseUrl}/search" class="button">Find Another Photographer</a>
  `;
  
  return baseTemplate(content);
}

/**
 * Review Received Email (to Photographer)
 */
export function reviewReceivedEmail(data: {
  photographerName: string;
  rating: number;
  reviewerName: string;
  comment: string;
  bookingNumber: string;
}): string {
  const stars = '⭐'.repeat(data.rating);
  
  const content = `
    <h2>🌟 You Received a Review!</h2>
    <p>Hi ${data.photographerName},</p>
    <p><strong>${data.reviewerName}</strong> left a review for booking <strong>${data.bookingNumber}</strong>.</p>
    
    <div class="info-box">
        <p><strong>Rating:</strong> ${stars} (${data.rating}/5)</p>
        <p><strong>Comment:</strong><br>"${data.comment}"</p>
    </div>
    
    <p>Great work! Reviews help build your reputation on the platform.</p>
  `;
  
  return baseTemplate(content);
}

/**
 * Welcome Email (to New Users)
 */
export function welcomeEmail(data: {
  firstName: string;
  userType: 'CLIENT' | 'PHOTOGRAPHER';
}): string {
  const isPhotographer = data.userType === 'PHOTOGRAPHER';
  
  const content = `
    <h2>👋 Welcome to ${EMAIL_CONFIG.templates.companyName}!</h2>
    <p>Hi ${data.firstName},</p>
    <p>Thank you for joining our platform! We're excited to have you here.</p>
    
    ${isPhotographer ? `
    <h3>Getting Started as a Photographer:</h3>
    <ol>
        <li>Complete your profile</li>
        <li>Upload your portfolio (at least 5 photos)</li>
        <li>Set up your payout account</li>
        <li>Start receiving bookings!</li>
    </ol>
    
    <a href="${EMAIL_CONFIG.templates.baseUrl}/photographer/profile" class="button">Complete Your Profile</a>
    ` : `
    <h3>Getting Started as a Client:</h3>
    <ol>
        <li>Search for photographers in your area</li>
        <li>View portfolios and reviews</li>
        <li>Send a booking request</li>
        <li>Pay securely and get your photos!</li>
    </ol>
    
    <a href="${EMAIL_CONFIG.templates.baseUrl}/search" class="button">Find a Photographer</a>
    `}
    
    <p>If you have any questions, feel free to reach out to our support team.</p>
  `;
  
  return baseTemplate(content);
}

/**
 * TEACHING MOMENT: Email Template Best Practices
 * 
 * 1. RESPONSIVE DESIGN
 *    - Max-width: 600px (mobile-friendly)
 *    - Inline CSS (better email client support)
 *    - Simple layouts (avoid complex CSS)
 * 
 * 2. CLEAR CALL-TO-ACTION
 *    - One primary button per email
 *    - Prominent, easy to click
 *    - Clear action text
 * 
 * 3. BRANDED DESIGN
 *    - Company colors
 *    - Logo (if you have one)
 *    - Consistent styling
 * 
 * 4. MOBILE-FIRST
 *    - 60%+ of emails opened on mobile
 *    - Large touch targets
 *    - Readable font sizes
 * 
 * 5. PLAIN TEXT VERSION
 *    - Always provide text alternative
 *    - Some email clients block HTML
 *    - Better accessibility
 * 
 * 6. DELIVERABILITY
 *    - No spammy words (FREE, ACT NOW, etc.)
 *    - Proper from address
 *    - Unsubscribe link (for marketing emails)
 *    - SPF/DKIM/DMARC records (DNS)
 */