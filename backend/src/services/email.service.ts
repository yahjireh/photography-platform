/**
 * Email Service
 * Handles sending emails via Resend or logging for development
 */

import { EMAIL_CONFIG } from '../config/email';

/**
 * TEACHING MOMENT: Dynamic Import
 * 
 * We only import Resend if EMAIL_MODE=resend
 * This prevents errors if the package isn't installed yet
 */
let Resend: any = null;
let resendClient: any = null;

if (EMAIL_CONFIG.mode === 'resend') {
  try {
    const ResendModule = require('resend');
    Resend = ResendModule.Resend;
    resendClient = new Resend(EMAIL_CONFIG.resend.apiKey);
  } catch (error) {
    console.warn('⚠️  Resend package not installed. Install with: npm install resend');
  }
}

/**
 * Email data structure
 */
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email
 * 
 * @param data - Email data
 * @returns Success status
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  
  if (EMAIL_CONFIG.mode === 'disabled') {
    // Emails disabled - do nothing
    return true;
  }
  
  if (EMAIL_CONFIG.mode === 'log') {
    // Log mode - just log the email
    console.log('\n📧 ═══════════════════════════════════════════════════');
    console.log('📧 EMAIL (LOG MODE - NOT ACTUALLY SENT)');
    console.log('📧 ═══════════════════════════════════════════════════');
    console.log(`📧 To: ${data.to}`);
    console.log(`📧 Subject: ${data.subject}`);
    console.log('📧 ───────────────────────────────────────────────────');
    console.log(`📧 Text Content:\n${data.text || 'No text version'}`);
    console.log('📧 ───────────────────────────────────────────────────');
    console.log(`📧 HTML Preview: ${data.html.substring(0, 200)}...`);
    console.log('📧 ═══════════════════════════════════════════════════');
    console.log('ℹ️  Set EMAIL_MODE=resend to send real emails\n');
    return true;
  }
  
  if (EMAIL_CONFIG.mode === 'resend') {
    // Real email sending via Resend
    
    if (!resendClient) {
      console.error('❌ Resend client not initialized');
      return false;
    }
    
    try {
      console.log(`📧 Sending email to ${data.to}: ${data.subject}`);
      
      const result = await resendClient.emails.send({
        from: EMAIL_CONFIG.resend.fromEmail,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text
      });
      
      console.log(`✅ Email sent successfully! ID: ${result.id}`);
      return true;
      
    } catch (error: any) {
      console.error('❌ Failed to send email:', error.message);
      return false;
    }
  }
  
  return false;
}

/**
 * Generate text version from HTML
 * Simple HTML to text conversion for email clients that don't support HTML
 * 
 * @param html - HTML content
 * @returns Plain text version
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/\n\s+\n/g, '\n\n') // Remove multiple blank lines
    .trim();
}

/**
 * TEACHING MOMENT: Why Resend?
 * 
 * There are many email services available:
 * 
 * 1. RESEND (our choice)
 *    - Modern, developer-friendly API
 *    - Generous free tier (3,000 emails/month)
 *    - Works globally (including Africa)
 *    - Easy setup
 *    - Great deliverability
 *    Pricing: Free up to 3,000/month, then $20/month for 50,000
 * 
 * 2. SENDGRID
 *    - Very popular
 *    - Free tier: 100 emails/day
 *    - More complex API
 *    Better for: High volume, enterprise
 * 
 * 3. MAILGUN
 *    - Good for developers
 *    - Free tier: 5,000 emails/month
 *    - Slightly more complex
 *    Better for: Transactional emails at scale
 * 
 * 4. AWS SES
 *    - Very cheap
 *    - Free tier: 62,000 emails/month
 *    - Complex setup (AWS configuration)
 *    Better for: AWS-based infrastructure
 * 
 * 5. POSTMARK
 *    - Excellent deliverability
 *    - No free tier
 *    - $15/month for 10,000 emails
 *    Better for: Critical transactional emails
 * 
 * For your platform:
 * - Resend's 3,000/month free tier is perfect for starting
 * - At 100 bookings/month × 5 emails per booking = 500 emails/month
 * - Room to grow to 600 bookings/month before paying
 * - When you hit limits, $20/month for 50,000 is very affordable
 */

/**
 * ALTERNATIVE: Send via SendGrid
 * 
 * If you prefer SendGrid, here's the equivalent code:
 * 
 * import sgMail from '@sendgrid/mail';
 * 
 * sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 * 
 * await sgMail.send({
 *   to: data.to,
 *   from: EMAIL_CONFIG.resend.fromEmail,
 *   subject: data.subject,
 *   html: data.html,
 *   text: data.text
 * });
 */