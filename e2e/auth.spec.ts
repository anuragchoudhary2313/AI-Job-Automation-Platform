import { test, expect, Page } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 * Tests user registration, login, and logout flows
 */

// Test data
const testUser = {
  username: 'e2etest',
  email: 'e2etest@example.com',
  password: 'TestPassword123!',
  teamName: 'E2E Test Team'
};

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new user', async ({ page }) => {
    // Navigate to register page
    await page.click('text=Create account');
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="teamName"]', testUser.teamName);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Should see welcome message
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Should see user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill login form with wrong password
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', 'WrongPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/incorrect.*password/i')).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/username.*required/i')).toBeVisible();
    await expect(page.locator('text=/password.*required/i')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[aria-label*="password"]');

    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await toggleButton.click();

    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);

    // Open user menu
    await page.click('[data-testid="user-menu"]');

    // Click logout
    await page.click('text=Logout');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);

    // Should not be able to access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should remember me functionality', async ({ page, context }) => {
    // Login with remember me checked
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.check('input[name="rememberMe"]');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);

    // Close and reopen browser
    await page.close();
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Should still be logged in
    await expect(newPage).toHaveURL(/.*dashboard/);
  });

  test('should handle session expiration', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);

    // Simulate token expiration by clearing localStorage
    await page.evaluate(() => localStorage.removeItem('token'));

    // Try to access protected route
    await page.goto('/jobs');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);

    // Should show session expired message
    await expect(page.locator('text=/session.*expired/i')).toBeVisible();
  });
});
