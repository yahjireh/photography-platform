/**
 * Validation Service
 * Strict validation for email addresses and phone numbers
 */

import dns from 'dns';

// Common disposable/temporary email domains to block
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'getairmail.com',
  'dispostable.com',
  'yopmail.com',
  'trashmail.com',
  'fakeinbox.com',
  'generator.email',
  'temp-mail.org',
  'dropmail.me',
  'mohmal.com',
  'mytemp.email',
  'emailondeck.com',
  'crazymailing.com',
  'nada.ltd',
  'getnada.com',
  'burnermail.io',
  'inboxkitten.com'
]);

/**
 * Result of email validation
 */
export interface EmailValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Result of phone validation
 */
export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  reason?: string;
}

/**
 * Validate an email address:
 * 1. Syntax check (RFC 5322 regex)
 * 2. Disposable / temporary domain blocklist
 * 3. DNS MX record check (confirms the domain actually exists and accepts mail)
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Email is required' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Basic syntax check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, reason: 'Invalid email format' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, reason: 'Invalid email structure' };
  }

  const domain = parts[1];

  // Block disposable email domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      reason: 'Disposable or temporary email addresses are not allowed. Please use a valid personal or work email.'
    };
  }

  // DNS MX record check to verify the domain has active mail servers
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        isValid: false,
        reason: `The email domain "${domain}" does not appear to have active mail servers.`
      };
    }
  } catch (error: any) {
    // In local development or network-restricted environments, fallback gracefully if DNS lookup fails for timeout
    if (error.code === 'ENOTFOUND' || error.code === 'NODATA') {
      return {
        isValid: false,
        reason: `The email domain "${domain}" does not exist or cannot receive mail.`
      };
    }
    console.warn(`⚠️ DNS MX lookup error for ${domain}:`, error.message);
    // Allow if it's just a local network resolver issue during development
  }

  return { isValid: true };
}

/**
 * Validate a phone number:
 * Accepts:
 * - Ghana formats: +233XXXXXXXXX, 02XXXXXXXX, 05XXXXXXXX, 03XXXXXXXX
 * - International formats: +[country code][number] (minimum 8 digits, maximum 15 digits per E.164)
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, reason: 'Phone number is required' };
  }

  // Remove spaces, hyphens, parentheses
  const cleaned = phone.trim().replace(/[\s\-()]/g, '');

  // Must contain only digits, optionally starting with '+'
  if (!/^\+?[0-9]{9,15}$/.test(cleaned)) {
    return {
      isValid: false,
      reason: 'Phone number must contain 9 to 15 digits and may include an optional leading +'
    };
  }

  // Format Ghana local numbers to international +233
  let formatted = cleaned;
  if (/^0[235][0-9]{8}$/.test(cleaned)) {
    formatted = '+233' + cleaned.substring(1);
  } else if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }

  return {
    isValid: true,
    formatted
  };
}

/**
 * Ghana Telecom & Mobile Money Providers
 */
export type MomoProvider = 'MTN' | 'VODAFONE' | 'TELECEL' | 'AIRTELTIGO';

export interface MomoValidationResult {
  isValid: boolean;
  detectedProvider?: MomoProvider;
  reason?: string;
}

/**
 * Detect Ghana telecom network provider from phone number prefix:
 * - MTN: 024, 025, 053, 054, 055, 059
 * - Telecel (formerly Vodafone): 020, 050
 * - AT (AirtelTigo): 026, 027, 056, 057
 */
export function detectGhanaMomoProvider(phone: string): MomoProvider | 'UNKNOWN' {
  if (!phone || typeof phone !== 'string') return 'UNKNOWN';

  const cleaned = phone.trim().replace(/[\s\-()]/g, '');
  let local10 = cleaned;
  if (local10.startsWith('+233')) {
    local10 = '0' + local10.substring(4);
  } else if (local10.startsWith('233')) {
    local10 = '0' + local10.substring(3);
  }

  const prefix3 = local10.substring(0, 3);

  // MTN prefixes
  if (['024', '025', '053', '054', '055', '059'].includes(prefix3)) {
    return 'MTN';
  }
  // Telecel prefixes
  if (['020', '050'].includes(prefix3)) {
    return 'TELECEL';
  }
  // AirtelTigo prefixes
  if (['026', '027', '056', '057'].includes(prefix3)) {
    return 'AIRTELTIGO';
  }

  return 'UNKNOWN';
}

/**
 * Validate that phone number prefix matches the selected payout channel
 * E.g., a 020 or 050 number cannot be paired with MTN Mobile Money.
 */
export function validateMomoNetworkPairing(phone: string, selectedProvider: string): MomoValidationResult {
  if (!phone) {
    return { isValid: false, reason: 'Mobile Money phone number is required' };
  }

  const detected = detectGhanaMomoProvider(phone);
  const normalized = (selectedProvider || '').toUpperCase();

  const isMTN = normalized.includes('MTN');
  const isTelecel = normalized.includes('TELECEL') || normalized.includes('VODAFONE');
  const isAT = normalized.includes('AIRTEL') || normalized.includes('TIGO') || normalized.includes('AT');

  if (isMTN) {
    if (detected === 'TELECEL') {
      return {
        isValid: false,
        detectedProvider: 'TELECEL',
        reason: 'A Telecel number (020, 050) cannot be paired with an MTN Mobile Money selection. Please choose Vodafone/Telecel Cash or enter a valid MTN number (024, 054, 055, 059, 053, 025).'
      };
    }
    if (detected === 'AIRTELTIGO') {
      return {
        isValid: false,
        detectedProvider: 'AIRTELTIGO',
        reason: 'An AirtelTigo number (026, 027, 056, 057) cannot be paired with an MTN Mobile Money selection. Please choose AirtelTigo Money or enter an MTN number.'
      };
    }
  } else if (isTelecel) {
    if (detected === 'MTN') {
      return {
        isValid: false,
        detectedProvider: 'MTN',
        reason: 'An MTN number (024, 054, 055, etc.) cannot be paired with Vodafone/Telecel Cash. Please choose MTN Mobile Money or enter a Telecel number (020, 050).'
      };
    }
    if (detected === 'AIRTELTIGO') {
      return {
        isValid: false,
        detectedProvider: 'AIRTELTIGO',
        reason: 'An AirtelTigo number cannot be paired with Vodafone/Telecel Cash. Please choose AirtelTigo Money.'
      };
    }
  } else if (isAT) {
    if (detected === 'MTN') {
      return {
        isValid: false,
        detectedProvider: 'MTN',
        reason: 'An MTN number cannot be paired with AirtelTigo Money. Please choose MTN Mobile Money.'
      };
    }
    if (detected === 'TELECEL') {
      return {
        isValid: false,
        detectedProvider: 'TELECEL',
        reason: 'A Telecel number cannot be paired with AirtelTigo Money. Please choose Vodafone/Telecel Cash.'
      };
    }
  }

  return { isValid: true, detectedProvider: detected === 'UNKNOWN' ? undefined : detected };
}

