import { test, expect, Page } from '@playwright/test';

/**
 * Bot Automation Flow E2E Tests
 * Tests the complete job application automation flow
 */

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'e2etest');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

test.describe('Bot Automation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('complete automation flow: login → run bot → resume → email → dashboard → logs', async ({ page }) => {
    // Step 1: Verify we're logged in and on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Step 2: Navigate to Jobs page
    await page.click('nav a:has-text("Jobs")');
    await expect(page).toHaveURL(/.*jobs/);

    // Step 3: Add a new job manually
    await page.click('button:has-text("Add Job")');
    await page.fill('input[name="title"]', 'Senior Software Engineer');
    await page.fill('input[name="company"]', 'Tech Corp');
    await page.fill('textarea[name="description"]', 'Great opportunity for experienced developers');
    await page.fill('input[name="hrEmail"]', 'hr@techcorp.com');
    await page.click('button[type="submit"]');

    // Verify job was added
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible();
    await expect(page.locator('text=Tech Corp')).toBeVisible();

    // Step 4: Generate resume for the job
    await page.click('tr:has-text("Senior Software Engineer") button[aria-label="Actions"]');
    await page.click('text=Generate Resume');

    // Wait for resume generation
    await expect(page.locator('text=/resume.*generated/i')).toBeVisible({ timeout: 15000 });

    // Verify resume appears in resumes page
    await page.click('nav a:has-text("Resumes")');
    await expect(page).toHaveURL(/.*resumes/);
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible();

    // Step 5: Run bot to send application
    await page.click('nav a:has-text("Jobs")');
    await page.click('tr:has-text("Senior Software Engineer") button[aria-label="Actions"]');
    await page.click('text=Apply Now');

    // Confirm application
    await page.click('button:has-text("Confirm")');

    // Wait for email sending notification
    await expect(page.locator('text=/application.*sent/i')).toBeVisible({ timeout: 20000 });

    // Step 6: Verify dashboard updated
    await page.click('nav a:has-text("Dashboard")');
    await expect(page).toHaveURL(/.*dashboard/);

    // Wait for metrics to update
    await page.waitForTimeout(2000);

    // Check that "Applied" count increased
    const appliedMetric = page.locator('[data-testid="metric-applied"]');
    await expect(appliedMetric).toBeVisible();

    // Verify job status changed to "Applied"
    await page.click('nav a:has-text("Jobs")');
    const jobRow = page.locator('tr:has-text("Senior Software Engineer")');
    await expect(jobRow.locator('text=Applied')).toBeVisible();

    // Step 7: Check logs for activity
    await page.click('nav a:has-text("Logs")');
    await expect(page).toHaveURL(/.*logs/);

    // Verify log entries exist
    await expect(page.locator('text=/resume.*generated/i')).toBeVisible();
    await expect(page.locator('text=/email.*sent/i')).toBeVisible();
    await expect(page.locator('text=/application.*submitted/i')).toBeVisible();

    // Verify log details
    await page.click('tr:has-text("email sent")');
    await expect(page.locator('text=hr@techcorp.com')).toBeVisible();
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible();
  });

  test('should run scheduled bot automation', async ({ page }) => {
    // Navigate to settings
    await page.click('nav a:has-text("Settings")');
    await expect(page).toHaveURL(/.*settings/);

    // Enable auto-apply
    await page.click('text=Bot Settings');
    await page.check('input[name="autoApplyEnabled"]');
    await page.fill('input[name="maxApplicationsPerDay"]', '10');
    await page.click('button:has-text("Save Settings")');

    // Verify settings saved
    await expect(page.locator('text=/settings.*saved/i')).toBeVisible();

    // Trigger manual bot run
    await page.click('nav a:has-text("Dashboard")');
    await page.click('button:has-text("Run Bot")');

    // Wait for bot to process jobs
    await expect(page.locator('text=/bot.*running/i')).toBeVisible();
    await expect(page.locator('text=/bot.*completed/i')).toBeVisible({ timeout: 30000 });

    // Check logs for bot activity
    await page.click('nav a:has-text("Logs")');
    await expect(page.locator('text=/bot.*started/i')).toBeVisible();
    await expect(page.locator('text=/processed.*jobs/i')).toBeVisible();
  });

  test('should handle bot errors gracefully', async ({ page }) => {
    // Add job with invalid email
    await page.click('nav a:has-text("Jobs")');
    await page.click('button:has-text("Add Job")');
    await page.fill('input[name="title"]', 'Test Job');
    await page.fill('input[name="company"]', 'Test Company');
    await page.fill('input[name="hrEmail"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Try to apply
    await page.click('tr:has-text("Test Job") button[aria-label="Actions"]');
    await page.click('text=Apply Now');
    await page.click('button:has-text("Confirm")');

    // Should show error notification
    await expect(page.locator('text=/error.*email/i')).toBeVisible();

    // Job status should remain pending
    await expect(page.locator('tr:has-text("Test Job") text=Pending')).toBeVisible();

    // Error should be logged
    await page.click('nav a:has-text("Logs")');
    await expect(page.locator('text=/error.*invalid.*email/i')).toBeVisible();
  });

  test('should filter and search jobs', async ({ page }) => {
    await page.click('nav a:has-text("Jobs")');

    // Search by company
    await page.fill('input[placeholder*="Search"]', 'Tech Corp');
    await expect(page.locator('tr:has-text("Tech Corp")')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');

    // Filter by status
    await page.selectOption('select[name="status"]', 'applied');
    await expect(page.locator('tr:has-text("Applied")')).toBeVisible();

    // Sort by date
    await page.click('th:has-text("Date")');
    // Verify sorting (newest first)
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
  });

  test('should bulk apply to multiple jobs', async ({ page }) => {
    await page.click('nav a:has-text("Jobs")');

    // Select multiple jobs
    await page.check('tr:has-text("Job 1") input[type="checkbox"]');
    await page.check('tr:has-text("Job 2") input[type="checkbox"]');
    await page.check('tr:has-text("Job 3") input[type="checkbox"]');

    // Click bulk apply
    await page.click('button:has-text("Apply to Selected")');
    await page.click('button:has-text("Confirm")');

    // Wait for all applications to complete
    await expect(page.locator('text=/3.*applications.*sent/i')).toBeVisible({ timeout: 30000 });

    // Verify all jobs updated
    await expect(page.locator('tr:has-text("Job 1") text=Applied')).toBeVisible();
    await expect(page.locator('tr:has-text("Job 2") text=Applied')).toBeVisible();
    await expect(page.locator('tr:has-text("Job 3") text=Applied')).toBeVisible();
  });

  test('should show real-time progress during bot run', async ({ page }) => {
    await page.click('button:has-text("Run Bot")');

    // Should show progress indicator
    await expect(page.locator('[role="progressbar"]')).toBeVisible();

    // Should show current job being processed
    await expect(page.locator('text=/processing.*job/i')).toBeVisible();

    // Should update progress percentage
    const progressText = page.locator('text=/%/');
    await expect(progressText).toBeVisible();

    // Wait for completion
    await expect(page.locator('text=/completed/i')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[role="progressbar"]')).not.toBeVisible();
  });
});
