/**
 * Utility Functions
 * Helper functions for formatting, validation, and common operations
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";

// ============================================
// TAILWIND CLASS UTILITIES
// ============================================

/**
 * Merge Tailwind classes with proper precedence
 * Used throughout components for dynamic className
 * 
 * @example
 * cn("px-4 py-2", "bg-blue-500", condition && "bg-red-500")
 * // If condition is true, bg-red-500 takes precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// NUMBER FORMATTING
// ============================================

/**
 * Format number as currency (Ghana Cedis)
 *
 * @example
 * formatCurrency(1000) // "₵1,000.00"
 * formatCurrency(1234.56) // "₵1,234.56"
 * formatCurrency(null) // "₵0.00"
 * formatCurrency(undefined) // "₵0.00"
 */
export function formatCurrency(amount: number | null | undefined): string {
  // Handle null, undefined, or NaN values
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/**
 * Format number with thousands separator
 *
 * @example
 * formatNumber(1000) // "1,000"
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(null) // "0"
 */
export function formatNumber(value: number | null | undefined): string {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat("en-GH").format(safeValue);
}

/**
 * Format number as percentage
 * 
 * @example
 * formatPercentage(0.15) // "15.0%"
 * formatPercentage(0.8567) // "85.7%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations (K, M, B)
 * 
 * @example
 * formatCompactNumber(1000) // "1K"
 * formatCompactNumber(1500000) // "1.5M"
 * formatCompactNumber(2300000000) // "2.3B"
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-GH", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

// ============================================
// DATE & TIME FORMATTING
// ============================================

/**
 * Format date to readable string
 * 
 * @example
 * formatDate("2026-01-15") // "Jan 15, 2026"
 * formatDate("2026-01-15", "PPP") // "January 15th, 2026"
 */
export function formatDate(
  dateString: string,
  formatStr: string = "MMM dd, yyyy"
): string {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch {
    return "Invalid date";
  }
}

/**
 * Format date and time together
 * 
 * @example
 * formatDateTime("2026-01-15T14:30:00") // "Jan 15, 2026 at 2:30 PM"
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM dd, yyyy 'at' h:mm a");
  } catch {
    return "Invalid date";
  }
}

/**
 * Format time only (HH:MM format)
 * 
 * @example
 * formatTime("14:30:00") // "2:30 PM"
 * formatTime("09:00:00") // "9:00 AM"
 */
export function formatTime(timeString: string): string {
  try {
    // Create a dummy date with the time
    const dummyDate = parseISO(`2000-01-01T${timeString}`);
    return format(dummyDate, "h:mm a");
  } catch {
    return "Invalid time";
  }
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 * 
 * @example
 * formatRelativeTime("2026-01-15T12:00:00") // "2 hours ago"
 * formatRelativeTime("2026-01-14T12:00:00") // "yesterday"
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    if (isYesterday(date)) {
      return "yesterday";
    }
    
    return format(date, "MMM dd, yyyy");
  } catch {
    return "Invalid date";
  }
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Truncate string to specified length
 * 
 * @example
 * truncate("This is a long text", 10) // "This is a..."
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

/**
 * Capitalize first letter of string
 * 
 * @example
 * capitalize("hello world") // "Hello world"
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to title case
 * 
 * @example
 * toTitleCase("hello world") // "Hello World"
 */
export function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map(word => capitalize(word))
    .join(" ");
}

/**
 * Generate initials from name
 * 
 * @example
 * getInitials("John Doe") // "JD"
 * getInitials("Alice") // "A"
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return '??';
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return '??';
  }

  const parts = trimmed.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Convert snake_case or kebab-case to readable text
 * 
 * @example
 * humanizeString("BOOKING_CONFIRMED") // "Booking Confirmed"
 * humanizeString("pending-verification") // "Pending Verification"
 */
export function humanizeString(str: string | undefined | null): string {
  // Handle undefined, null, or empty strings
  if (!str) {
    return "";
  }

  return str
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map(word => capitalize(word))
    .join(" ");
}

// ============================================
// STATUS UTILITIES
// ============================================

/**
 * Get status color for booking status
 * Returns Tailwind color classes
 */
export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ACCEPTED: "bg-blue-100 text-blue-800 border-blue-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
    CONFIRMED: "bg-green-100 text-green-800 border-green-200",
    IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
    COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
    DISPUTED: "bg-orange-100 text-orange-800 border-orange-200",
  };
  
  return colors[status] || colors.PENDING;
}

/**
 * Get status color for payment status
 */
export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SUCCESSFUL: "bg-green-100 text-green-800 border-green-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
    REFUNDED: "bg-blue-100 text-blue-800 border-blue-200",
  };
  
  return colors[status] || colors.PENDING;
}

/**
 * Get status color for verification status
 */
export function getVerificationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    VERIFIED: "bg-green-100 text-green-800 border-green-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  };
  
  return colors[status] || colors.PENDING;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email format
 * 
 * @example
 * isValidEmail("test@example.com") // true
 * isValidEmail("invalid-email") // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Ghana format)
 * Accepts formats: 0244123456, +233244123456, 233244123456
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+?233|0)[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Group array items by a key
 * 
 * @example
 * groupBy([{type: "A", value: 1}, {type: "A", value: 2}], "type")
 * // { A: [{type: "A", value: 1}, {type: "A", value: 2}] }
 */
export function groupBy<T extends Record<string, unknown>>(
  array: T[], 
  key: keyof T
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array of objects by a key
 */
export function sortBy<T extends Record<string, unknown>>(
  array: T[],
  key: keyof T,
  order: "asc" | "desc" = "asc"
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

// ============================================
// FILE UTILITIES
// ============================================

/**
 * Format file size to human-readable string
 * 
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

// ============================================
// DOWNLOAD UTILITIES
// ============================================

/**
 * Download data as JSON file
 */
export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csv = [
    headers.join(","),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape values with commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    ),
  ].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// DEBOUNCE & THROTTLE
// ============================================

/**
 * Debounce function - delays execution until after wait time
 * Useful for search inputs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate random ID (for temporary use)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Sleep/delay function (for testing)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// PDF EXPORT
// ============================================

/**
 * Generate and download a PDF report using browser print API
 * Creates a styled HTML document and triggers print dialog (Save as PDF)
 */
export function downloadPDF(
  title: string,
  sections: Array<{ heading: string; content: string | string[][] }>,
  metadata?: { generatedBy?: string; timeRange?: string }
): void {
  const now = new Date().toLocaleString();
  const rows = (data: string[][]) =>
    data.map(row => `<tr>${row.map(cell => `<td style="padding:6px 12px;border:1px solid #ddd;">${cell}</td>`).join('')}</tr>`).join('');

  const sectionHTML = sections.map(s => {
    if (typeof s.content === 'string') {
      return `<div style="margin-bottom:24px;"><h2 style="font-size:16px;margin-bottom:8px;color:#1e40af;">${s.heading}</h2><p style="font-size:13px;color:#374151;">${s.content}</p></div>`;
    }
    const [headers, ...body] = s.content;
    return `<div style="margin-bottom:24px;"><h2 style="font-size:16px;margin-bottom:8px;color:#1e40af;">${s.heading}</h2><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr>${headers.map(h => `<th style="padding:8px 12px;border:1px solid #ddd;background:#f3f4f6;text-align:left;font-weight:600;">${h}</th>`).join('')}</tr></thead><tbody>${rows(body)}</tbody></table></div>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><title>${title}</title><style>@media print{body{margin:0;padding:20px;}}body{font-family:system-ui,-apple-system,sans-serif;color:#111827;max-width:800px;margin:0 auto;padding:40px;}</style></head><body><div style="border-bottom:3px solid #1e40af;padding-bottom:16px;margin-bottom:24px;"><h1 style="font-size:24px;color:#1e40af;margin:0;">${title}</h1><p style="font-size:12px;color:#6b7280;margin-top:4px;">Generated: ${now}${metadata?.timeRange ? ` | Period: ${metadata.timeRange}` : ''}${metadata?.generatedBy ? ` | By: ${metadata.generatedBy}` : ''}</p></div>${sectionHTML}<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">PhotoBook Ghana Admin Dashboard Report</div></body></html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// ============================================
// EXCEL EXPORT
// ============================================

/**
 * Download data as Excel-compatible file (.xlsx via XML spreadsheet)
 */
export function downloadExcel(
  sheets: Array<{ name: string; headers: string[]; rows: (string | number)[][] }>,
  filename: string
): void {
  const escapeXml = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const sheetXml = sheets.map(sheet => {
    const headerRow = `<Row>${sheet.headers.map(h => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}</Row>`;
    const dataRows = sheet.rows.map(row =>
      `<Row>${row.map(cell => {
        const type = typeof cell === 'number' ? 'Number' : 'String';
        return `<Cell><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`;
      }).join('')}</Row>`
    ).join('');
    return `<Worksheet ss:Name="${escapeXml(sheet.name)}"><Table>${headerRow}${dataRows}</Table></Worksheet>`;
  }).join('');

  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheetXml}</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Resolve user / photographer avatar with hierarchy:
 * 1. User's uploaded profile_image_url / avatarUrl
 * 2. Photographer's profile_image_url
 * 3. KYC selfie / document photo
 * 4. High quality initials avatar fallback
 */
export function getUserAvatar(
  user?: any,
  fallbackSeed?: string
): string {
  if (!user && !fallbackSeed) {
    return 'https://ui-avatars.com/api/?name=User&background=0D9488&color=fff&bold=true';
  }

  // 1. Direct profile image on user object
  if (user?.profile_image_url) return user.profile_image_url;
  if (user?.avatarUrl) return user.avatarUrl;
  if (user?.avatar) return user.avatar;

  // 2. Nested photographer profile image
  const p = user?.photographer || user?.photographers;
  if (p?.users?.profile_image_url) return p.users.profile_image_url;
  if (p?.profile_image_url) return p.profile_image_url;

  // 3. KYC selfie or ID document
  const kycDocs = p?.photographer_kyc?.documents || p?.kyc_documents || p?.documents || user?.kyc_documents;
  if (Array.isArray(kycDocs) && kycDocs.length > 0) {
    const selfie = kycDocs.find((d: any) => 
      d.document_type === 'SELFIE' || 
      d.type === 'SELFIE' || 
      d.document_type === 'ID_FRONT' ||
      d.file_name?.toLowerCase().includes('selfie')
    );
    if (selfie?.file_url) return selfie.file_url;
    if (kycDocs[0]?.file_url) return kycDocs[0].file_url;
  }
  if (p?.photographer_kyc?.portfolio_link) return p.photographer_kyc.portfolio_link;

  // 4. Clean initials avatar fallback
  const name = user?.fullName || user?.full_name || user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}` : fallbackSeed) || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=0D9488&color=fff&bold=true`;
}