import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  truncate,
  capitalize,
  toTitleCase,
  getInitials,
  humanizeString,
  getBookingStatusColor,
  getPaymentStatusColor,
  getVerificationStatusColor,
  isValidEmail,
  isValidPhoneNumber,
  isEmpty,
  groupBy,
  sortBy,
  formatFileSize,
  downloadJSON,
  downloadCSV,
  downloadExcel,
  debounce,
  generateId,
  sleep,
} from '@/lib/utils';

// ============================================
// cn (Tailwind class merge)
// ============================================
describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('px-4', false && 'hidden')).toBe('px-4');
    expect(cn('px-4', true && 'hidden')).toBe('px-4 hidden');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toBe('bg-blue-500');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });
});

// ============================================
// Number formatting
// ============================================
describe('formatCurrency', () => {
  it('formats basic amounts', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1,000');
    expect(result).toContain('00');
  });

  it('handles decimals', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234');
    expect(result).toContain('56');
  });

  it('handles null', () => {
    const result = formatCurrency(null);
    expect(result).toContain('0');
  });

  it('handles undefined', () => {
    const result = formatCurrency(undefined);
    expect(result).toContain('0');
  });

  it('handles NaN', () => {
    const result = formatCurrency(NaN);
    expect(result).toContain('0');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});

describe('formatNumber', () => {
  it('formats with thousands separator', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('formats large numbers', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles null', () => {
    expect(formatNumber(null)).toBe('0');
  });

  it('handles undefined', () => {
    expect(formatNumber(undefined)).toBe('0');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatPercentage', () => {
  it('formats decimal as percentage', () => {
    expect(formatPercentage(0.15)).toBe('15.0%');
  });

  it('formats with custom decimals', () => {
    expect(formatPercentage(0.8567, 2)).toBe('85.67%');
  });

  it('formats zero', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('formats 100%', () => {
    expect(formatPercentage(1)).toBe('100.0%');
  });
});

describe('formatCompactNumber', () => {
  it('formats thousands', () => {
    const result = formatCompactNumber(1000);
    expect(result).toMatch(/1K|1k/i);
  });

  it('formats millions', () => {
    const result = formatCompactNumber(1500000);
    expect(result).toMatch(/1\.5M|1,5M/i);
  });

  it('handles small numbers', () => {
    expect(formatCompactNumber(5)).toBe('5');
  });
});

// ============================================
// Date & Time formatting
// ============================================
describe('formatDate', () => {
  it('formats date with default format', () => {
    expect(formatDate('2026-01-15')).toBe('Jan 15, 2026');
  });

  it('formats date with custom format', () => {
    expect(formatDate('2026-01-15', 'yyyy-MM-dd')).toBe('2026-01-15');
  });

  it('handles invalid date', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });
});

describe('formatDateTime', () => {
  it('formats date and time', () => {
    const result = formatDateTime('2026-01-15T14:30:00');
    expect(result).toContain('Jan 15, 2026');
    expect(result).toContain('2:30 PM');
  });

  it('handles invalid date', () => {
    expect(formatDateTime('invalid')).toBe('Invalid date');
  });
});

describe('formatTime', () => {
  it('formats afternoon time', () => {
    expect(formatTime('14:30:00')).toBe('2:30 PM');
  });

  it('formats morning time', () => {
    expect(formatTime('09:00:00')).toBe('9:00 AM');
  });

  it('handles invalid time', () => {
    expect(formatTime('invalid')).toBe('Invalid time');
  });
});

describe('formatRelativeTime', () => {
  it('returns "yesterday" for yesterday dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    expect(formatRelativeTime(yesterday.toISOString())).toBe('yesterday');
  });

  it('returns formatted date for older dates', () => {
    const result = formatRelativeTime('2020-01-15T12:00:00');
    expect(result).toBe('Jan 15, 2020');
  });

  it('handles invalid date', () => {
    expect(formatRelativeTime('invalid')).toBe('Invalid date');
  });
});

// ============================================
// String utilities
// ============================================
describe('truncate', () => {
  it('truncates long string', () => {
    expect(truncate('This is a long text', 10)).toBe('This is a ...');
  });

  it('returns original if shorter than limit', () => {
    expect(truncate('Short', 10)).toBe('Short');
  });

  it('returns original if exact length', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello world')).toBe('Hello world');
  });

  it('lowercases rest', () => {
    expect(capitalize('HELLO')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('toTitleCase', () => {
  it('converts to title case', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
  });

  it('handles single word', () => {
    expect(toTitleCase('hello')).toBe('Hello');
  });
});

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial from first name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('handles null', () => {
    expect(getInitials(null)).toBe('??');
  });

  it('handles undefined', () => {
    expect(getInitials(undefined)).toBe('??');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('??');
  });

  it('handles three-part name', () => {
    expect(getInitials('John Michael Doe')).toBe('JD');
  });
});

describe('humanizeString', () => {
  it('converts snake_case', () => {
    expect(humanizeString('BOOKING_CONFIRMED')).toBe('Booking Confirmed');
  });

  it('converts kebab-case', () => {
    expect(humanizeString('pending-verification')).toBe('Pending Verification');
  });

  it('handles null', () => {
    expect(humanizeString(null)).toBe('');
  });

  it('handles undefined', () => {
    expect(humanizeString(undefined)).toBe('');
  });
});

// ============================================
// Status utilities
// ============================================
describe('getBookingStatusColor', () => {
  it('returns correct color for PENDING', () => {
    expect(getBookingStatusColor('PENDING')).toContain('yellow');
  });

  it('returns correct color for CONFIRMED', () => {
    expect(getBookingStatusColor('CONFIRMED')).toContain('green');
  });

  it('returns correct color for REJECTED', () => {
    expect(getBookingStatusColor('REJECTED')).toContain('red');
  });

  it('returns default for unknown status', () => {
    const result = getBookingStatusColor('UNKNOWN');
    expect(result).toContain('yellow'); // defaults to PENDING color
  });
});

describe('getPaymentStatusColor', () => {
  it('returns correct color for SUCCESSFUL', () => {
    expect(getPaymentStatusColor('SUCCESSFUL')).toContain('green');
  });

  it('returns correct color for FAILED', () => {
    expect(getPaymentStatusColor('FAILED')).toContain('red');
  });

  it('returns correct color for REFUNDED', () => {
    expect(getPaymentStatusColor('REFUNDED')).toContain('blue');
  });
});

describe('getVerificationStatusColor', () => {
  it('returns correct color for VERIFIED', () => {
    expect(getVerificationStatusColor('VERIFIED')).toContain('green');
  });

  it('returns correct color for REJECTED', () => {
    expect(getVerificationStatusColor('REJECTED')).toContain('red');
  });
});

// ============================================
// Validation utilities
// ============================================
describe('isValidEmail', () => {
  it('validates correct email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('validates email with subdomain', () => {
    expect(isValidEmail('user@mail.example.co.uk')).toBe(true);
  });

  it('rejects invalid email - no @', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  it('rejects invalid email - no domain', () => {
    expect(isValidEmail('test@')).toBe(false);
  });

  it('rejects invalid email - spaces', () => {
    expect(isValidEmail('test @example.com')).toBe(false);
  });
});

describe('isValidPhoneNumber', () => {
  it('validates local format', () => {
    expect(isValidPhoneNumber('0244123456')).toBe(true);
  });

  it('validates international format with +', () => {
    expect(isValidPhoneNumber('+233244123456')).toBe(true);
  });

  it('validates international format without +', () => {
    expect(isValidPhoneNumber('233244123456')).toBe(true);
  });

  it('validates with spaces', () => {
    expect(isValidPhoneNumber('024 412 3456')).toBe(true);
  });

  it('rejects too short', () => {
    expect(isValidPhoneNumber('02441234')).toBe(false);
  });

  it('rejects non-Ghana number', () => {
    expect(isValidPhoneNumber('+14155551234')).toBe(false);
  });
});

describe('isEmpty', () => {
  it('null is empty', () => {
    expect(isEmpty(null)).toBe(true);
  });

  it('undefined is empty', () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  it('empty string is empty', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('whitespace string is empty', () => {
    expect(isEmpty('   ')).toBe(true);
  });

  it('empty array is empty', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('empty object is empty', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('non-empty string is not empty', () => {
    expect(isEmpty('hello')).toBe(false);
  });

  it('non-empty array is not empty', () => {
    expect(isEmpty([1])).toBe(false);
  });

  it('number is not empty', () => {
    expect(isEmpty(0)).toBe(false);
  });

  it('false is not empty', () => {
    expect(isEmpty(false)).toBe(false);
  });
});

// ============================================
// Array utilities
// ============================================
describe('groupBy', () => {
  it('groups items by key', () => {
    const items = [
      { type: 'A', value: 1 },
      { type: 'B', value: 2 },
      { type: 'A', value: 3 },
    ];
    const result = groupBy(items, 'type');
    expect(result['A']).toHaveLength(2);
    expect(result['B']).toHaveLength(1);
  });

  it('handles empty array', () => {
    expect(groupBy([], 'key')).toEqual({});
  });

  it('handles single item', () => {
    const items = [{ type: 'A', value: 1 }];
    const result = groupBy(items, 'type');
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['A']).toHaveLength(1);
  });
});

describe('sortBy', () => {
  it('sorts ascending by default', () => {
    const items = [
      { name: 'Charlie', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 28 },
    ];
    const result = sortBy(items, 'name');
    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Bob');
    expect(result[2].name).toBe('Charlie');
  });

  it('sorts descending', () => {
    const items = [
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
    ];
    const result = sortBy(items, 'age', 'desc');
    expect(result[0].age).toBe(30);
    expect(result[1].age).toBe(25);
  });

  it('does not mutate original array', () => {
    const items = [{ v: 2 }, { v: 1 }];
    sortBy(items, 'v');
    expect(items[0].v).toBe(2);
  });
});

// ============================================
// File utilities
// ============================================
describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('formats zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });
});

// ============================================
// Download utilities (DOM-dependent)
// ============================================
describe('downloadJSON', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('creates and triggers download', () => {
    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any);

    downloadJSON({ test: true }, 'test-file');

    expect(clickSpy).toHaveBeenCalled();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe('downloadCSV', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('does nothing with empty data', () => {
    const spy = vi.spyOn(document, 'createElement');
    downloadCSV([], 'empty');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('creates CSV download for data', () => {
    const clickSpy = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any);

    downloadCSV([{ name: 'Test', value: '1' }], 'test');
    expect(clickSpy).toHaveBeenCalled();
  });
});

describe('downloadExcel', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('creates Excel download', () => {
    const clickSpy = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any);

    downloadExcel(
      [{ name: 'Sheet1', headers: ['A', 'B'], rows: [['1', '2']] }],
      'test-excel'
    );
    expect(clickSpy).toHaveBeenCalled();
  });
});

// ============================================
// Debounce & misc
// ============================================
describe('debounce', () => {
  it('delays function execution', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('resets timer on subsequent calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('sleep', () => {
  it('resolves after delay', async () => {
    vi.useFakeTimers();
    let resolved = false;
    sleep(100).then(() => { resolved = true; });

    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    expect(resolved).toBe(true);

    vi.useRealTimers();
  });
});
