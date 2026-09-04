/**
 * Email Configuration
 * Settings for email notification service
 */

export const EMAIL_CONFIG = {
  // Email service mode: 'disabled', 'log', or 'resend'
  mode: process.env.EMAIL_MODE || 'log',
  
  // Resend API configuration
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'ClickFlicks <noreply@clickflicks.com>',
    fromName: process.env.FROM_NAME || 'ClickFlicks'
  },
  
  // Email templates configuration
  templates: {
    baseUrl: process.env.APP_URL || 'http://localhost:8081',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@clickflicks.com',
    companyName: process.env.COMPANY_NAME || 'ClickFlicks',
    logoUrl: process.env.LOGO_URL || 'https://clickflicks.com/logo.png'
  }
};

/**
 * Validate email configuration
 */
export function validateEmailConfig(): void {
  console.log('📧 Email Configuration:');
  console.log(`   Mode: ${EMAIL_CONFIG.mode}`);
  
  if (EMAIL_CONFIG.mode === 'disabled') {
    console.log('   ⚠️  Email notifications DISABLED');
    return;
  }
  
  if (EMAIL_CONFIG.mode === 'log') {
    console.log('   📝 Email notifications will be LOGGED (not sent)');
    console.log('   ℹ️  Set EMAIL_MODE=resend to send real emails');
    return;
  }
  
  if (EMAIL_CONFIG.mode === 'resend') {
    if (!EMAIL_CONFIG.resend.apiKey) {
      console.warn('   ⚠️  RESEND_API_KEY not set! Emails will not be sent.');
      console.warn('   ℹ️  Get API key from: https://resend.com/api-keys');
    } else {
      console.log('   ✅ Using Resend email service');
      console.log(`   From: ${EMAIL_CONFIG.resend.fromEmail}`);
    }
  }
}

/**
 * TEACHING MOMENT: Email Modes
 * 
 * We use 3 modes for email sending:
 * 
 * 1. DISABLED (EMAIL_MODE=disabled)
 *    - No emails sent
 *    - No logs
 *    - Complete silence
 *    Use when: Testing other features, don't want email noise
 * 
 * 2. LOG (EMAIL_MODE=log) - DEFAULT
 *    - Emails logged to console
 *    - Shows what WOULD be sent
 *    - No actual emails sent
 *    Use when: Development, testing email triggers
 * 
 * 3. RESEND (EMAIL_MODE=resend)
 *    - Real emails sent via Resend
 *    - Requires API key
 *    - Production mode
 *    Use when: Staging/Production environments
 * 
 * This is similar to our STORAGE_MODE and SIMULATE_TRANSFERS patterns!
 * 
 * Development workflow:
 * 1. Start with EMAIL_MODE=log
 * 2. Test all email triggers
 * 3. Verify emails look correct in logs
 * 4. Switch to EMAIL_MODE=resend
 * 5. Add RESEND_API_KEY
 * 6. Test with real emails
 */