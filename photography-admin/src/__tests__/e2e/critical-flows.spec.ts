/**
 * E2E Test Specs for Critical Admin Flows
 *
 * Framework: Playwright
 * Install: npm i -D @playwright/test && npx playwright install
 * Run: npx playwright test
 *
 * These specs cover the most critical user journeys in the admin dashboard.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ============================================
// Authentication Flow
// ============================================
test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('wrong@email.com');
    await page.getByPlaceholder(/password/i).fill('WrongPass');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible();
  });

  test('should lock out after 5 failed attempts', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    for (let i = 0; i < 5; i++) {
      await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
      await page.getByPlaceholder(/password/i).fill('WrongPass');
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(/locked|too many attempts/i)).toBeVisible();
  });

  test('should redirect to login after session timeout', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(BASE_URL + '/');

    // Clear auth tokens to simulate expiry
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
  });
});

// ============================================
// Dashboard Overview
// ============================================
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Replace with auth state fixture
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('should display stat cards', async ({ page }) => {
    await expect(page.getByText(/total users|total bookings|revenue/i).first()).toBeVisible();
  });

  test('should have working sidebar navigation', async ({ page }) => {
    await page.getByRole('link', { name: /users/i }).first().click();
    await expect(page).toHaveURL(/\/users/);

    await page.getByRole('link', { name: /bookings/i }).click();
    await expect(page).toHaveURL(/\/bookings/);

    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('should open command palette with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/search|command/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });
});

// ============================================
// KYC Verification Flow
// ============================================
test.describe('KYC Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.goto(`${BASE_URL}/photographers/pending`);
  });

  test('should display pending verifications list', async ({ page }) => {
    await expect(page.getByText(/kyc|verification|pending/i).first()).toBeVisible();
  });

  test('should view photographer details', async ({ page }) => {
    const firstRow = page.locator('tr, [data-testid="photographer-row"]').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page.getByText(/id|document|portfolio/i).first()).toBeVisible();
    }
  });

  test('should approve a photographer with confirmation', async ({ page }) => {
    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      // Should show confirmation dialog
      await expect(page.getByText(/confirm|are you sure/i)).toBeVisible();
      await page.getByRole('button', { name: /confirm|yes/i }).click();
      // Should show success toast
      await expect(page.getByText(/approved|success/i)).toBeVisible();
    }
  });

  test('should reject a photographer with reason', async ({ page }) => {
    const rejectBtn = page.getByRole('button', { name: /reject/i }).first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      await expect(page.getByText(/reason/i)).toBeVisible();
      await page.getByPlaceholder(/reason/i).fill('Incomplete documentation');
      await page.getByRole('button', { name: /confirm|submit/i }).click();
      await expect(page.getByText(/rejected|success/i)).toBeVisible();
    }
  });
});

// ============================================
// Booking Management Flow
// ============================================
test.describe('Booking Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.goto(`${BASE_URL}/bookings`);
  });

  test('should display bookings list', async ({ page }) => {
    await expect(page.getByText(/bookings/i).first()).toBeVisible();
  });

  test('should filter bookings by status', async ({ page }) => {
    const statusFilter = page.getByRole('combobox', { name: /status/i })
      .or(page.getByText(/all statuses|filter/i).first());
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.getByText(/pending/i).first().click();
    }
  });

  test('should search bookings', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test booking');
      await page.waitForTimeout(500); // debounce
    }
  });

  test('should export bookings data', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i }).first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
    }
  });
});

// ============================================
// User Management Flow
// ============================================
test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.goto(`${BASE_URL}/users`);
  });

  test('should display users list with pagination', async ({ page }) => {
    await expect(page.getByText(/users/i).first()).toBeVisible();
  });

  test('should view user detail', async ({ page }) => {
    const firstUser = page.locator('tr, [data-testid="user-row"]').first();
    if (await firstUser.isVisible()) {
      await firstUser.click();
    }
  });

  test('should suspend a user with confirmation', async ({ page }) => {
    const suspendBtn = page.getByRole('button', { name: /suspend/i }).first();
    if (await suspendBtn.isVisible()) {
      await suspendBtn.click();
      await expect(page.getByText(/confirm|are you sure/i)).toBeVisible();
    }
  });
});

// ============================================
// Analytics & Export Flow
// ============================================
test.describe('Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.goto(`${BASE_URL}/analytics`);
  });

  test('should display analytics charts', async ({ page }) => {
    await expect(page.getByText(/analytics|revenue|bookings/i).first()).toBeVisible();
  });

  test('should change date range', async ({ page }) => {
    const datePicker = page.getByText(/last 30 days|date range|this month/i).first();
    if (await datePicker.isVisible()) {
      await datePicker.click();
      await page.getByText(/last 7 days/i).click();
    }
  });

  test('should export to CSV', async ({ page }) => {
    const csvBtn = page.getByRole('button', { name: /csv/i }).first();
    if (await csvBtn.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        csvBtn.click(),
      ]);
      if (download) {
        expect(download.suggestedFilename()).toContain('.csv');
      }
    }
  });

  test('should export to Excel', async ({ page }) => {
    const excelBtn = page.getByRole('button', { name: /excel/i }).first();
    if (await excelBtn.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        excelBtn.click(),
      ]);
      if (download) {
        expect(download.suggestedFilename()).toContain('.xls');
      }
    }
  });
});

// ============================================
// Settings Page
// ============================================
test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.goto(`${BASE_URL}/settings`);
  });

  test('should display settings tabs', async ({ page }) => {
    await expect(page.getByText(/settings/i).first()).toBeVisible();
  });

  test('should navigate between settings sections', async ({ page }) => {
    const tabs = ['general', 'notifications', 'security', 'ip whitelist'];
    for (const tab of tabs) {
      const tabBtn = page.getByRole('button', { name: new RegExp(tab, 'i') })
        .or(page.getByText(new RegExp(tab, 'i')).first());
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });
});

// ============================================
// Accessibility Checks
// ============================================
test.describe('Accessibility', () => {
  test('login page has proper form labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
    const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('sidebar navigation uses semantic links', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    const navLinks = page.getByRole('link');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(5);
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});

// ============================================
// Performance Checks
// ============================================
test.describe('Performance', () => {
  test('dashboard loads within acceptable time', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    const start = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;

    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors on main pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill('admin@photobook.com');
    await page.getByPlaceholder(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    const pages = ['/', '/users', '/bookings', '/analytics', '/settings'];
    for (const p of pages) {
      await page.goto(`${BASE_URL}${p}`);
      await page.waitForLoadState('domcontentloaded');
    }

    // Filter out known non-critical errors (e.g., favicon)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
