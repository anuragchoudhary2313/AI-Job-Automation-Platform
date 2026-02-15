import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Test Fixtures and Helpers
 * Reusable utilities for E2E tests
 */

// Extend base test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'e2etest');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await use(page);
  },
});

// Helper functions
export async function createJob(page: Page, jobData: {
  title: string;
  company: string;
  description?: string;
  hrEmail?: string;
}) {
  await page.click('nav a:has-text("Jobs")');
  await page.click('button:has-text("Add Job")');

  await page.fill('input[name="title"]', jobData.title);
  await page.fill('input[name="company"]', jobData.company);

  if (jobData.description) {
    await page.fill('textarea[name="description"]', jobData.description);
  }

  if (jobData.hrEmail) {
    await page.fill('input[name="hrEmail"]', jobData.hrEmail);
  }

  await page.click('button[type="submit"]');
  await expect(page.locator(`text=${jobData.title}`)).toBeVisible();
}

export async function applyToJob(page: Page, jobTitle: string) {
  await page.click(`tr:has-text("${jobTitle}") button[aria-label="Actions"]`);
  await page.click('text=Apply Now');
  await page.click('button:has-text("Confirm")');
  await expect(page.locator('text=/application.*sent/i')).toBeVisible({ timeout: 20000 });
}

export async function waitForNotification(page: Page, message: string | RegExp) {
  await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 10000 });
}

export async function navigateTo(page: Page, route: string) {
  await page.click(`nav a:has-text("${route}")`);
  await expect(page).toHaveURL(new RegExp(route.toLowerCase()));
}

export { expect };
