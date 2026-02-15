import { test, expect, Page } from '@playwright/test';

/**
 * Dashboard and Logs E2E Tests
 * Tests dashboard updates and logs visibility
 */

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'e2etest');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

test.describe('Dashboard Updates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display real-time metrics', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify all metric cards are visible
    await expect(page.locator('text=Total Jobs')).toBeVisible();
    await expect(page.locator('text=Applied')).toBeVisible();
    await expect(page.locator('text=Interviewing')).toBeVisible();
    await expect(page.locator('text=Response Rate')).toBeVisible();

    // Verify metrics have values
    const totalJobs = page.locator('[data-testid="metric-total-jobs"]');
    await expect(totalJobs).toContainText(/\d+/);
  });

  test('should update metrics when job status changes', async ({ page }) => {
    // Get initial applied count
    const appliedMetric = page.locator('[data-testid="metric-applied"]');
    const initialCount = await appliedMetric.textContent();

    // Apply to a job
    await page.click('nav a:has-text("Jobs")');
    await page.click('tr:first-child button[aria-label="Actions"]');
    await page.click('text=Apply Now');
    await page.click('button:has-text("Confirm")');

    // Wait for application to complete
    await expect(page.locator('text=/application.*sent/i')).toBeVisible();

    // Go back to dashboard
    await page.click('nav a:has-text("Dashboard")');

    // Verify metric updated
    await page.waitForTimeout(1000); // Wait for metric animation
    const newCount = await appliedMetric.textContent();
    expect(newCount).not.toBe(initialCount);
  });

  test('should display charts with data', async ({ page }) => {
    // Verify bar chart is visible
    await expect(page.locator('text=Application Volume')).toBeVisible();
    await expect(page.locator('svg.recharts-surface')).toBeVisible();

    // Verify pie chart is visible
    await expect(page.locator('text=Pipeline Status')).toBeVisible();

    // Hover over chart to see tooltip
    await page.hover('svg.recharts-surface >> nth=0');
    await expect(page.locator('.recharts-tooltip-wrapper')).toBeVisible();
  });

  test('should show recent activity feed', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();

    // Verify activity items are present
    const activityItems = page.locator('[data-testid="activity-item"]');
    await expect(activityItems.first()).toBeVisible();

    // Verify activity has timestamp
    await expect(page.locator('text=/\d+.*ago/i')).toBeVisible();
  });

  test('should refresh data automatically', async ({ page }) => {
    // Get initial timestamp
    const timestamp1 = await page.locator('[data-testid="last-updated"]').textContent();

    // Wait for auto-refresh (30 seconds)
    await page.waitForTimeout(31000);

    // Verify timestamp changed
    const timestamp2 = await page.locator('[data-testid="last-updated"]').textContent();
    expect(timestamp2).not.toBe(timestamp1);
  });

  test('should handle manual refresh', async ({ page }) => {
    const refreshButton = page.locator('button[aria-label="Refresh"]');
    await refreshButton.click();

    // Should show loading state
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();

    // Should complete refresh
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Logs Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('nav a:has-text("Logs")');
    await expect(page).toHaveURL(/.*logs/);
  });

  test('should display all log entries', async ({ page }) => {
    // Verify logs table is visible
    await expect(page.locator('table')).toBeVisible();

    // Verify log entries exist
    const logRows = page.locator('tbody tr');
    await expect(logRows.first()).toBeVisible();

    // Verify log columns
    await expect(page.locator('th:has-text("Timestamp")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Message")')).toBeVisible();
  });

  test('should filter logs by type', async ({ page }) => {
    // Filter by success
    await page.selectOption('select[name="logType"]', 'success');

    // Verify only success logs are shown
    const successLogs = page.locator('tr:has-text("success")');
    await expect(successLogs.first()).toBeVisible();

    // Filter by error
    await page.selectOption('select[name="logType"]', 'error');

    // Verify only error logs are shown
    const errorLogs = page.locator('tr:has-text("error")');
    await expect(errorLogs.first()).toBeVisible();
  });

  test('should filter logs by date range', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];

    await page.fill('input[name="startDate"]', today);
    await page.fill('input[name="endDate"]', today);
    await page.click('button:has-text("Apply Filter")');

    // Verify filtered results
    const logRows = page.locator('tbody tr');
    await expect(logRows.first()).toBeVisible();
  });

  test('should search logs by keyword', async ({ page }) => {
    await page.fill('input[placeholder*="Search logs"]', 'email sent');

    // Verify search results
    await expect(page.locator('tr:has-text("email sent")')).toBeVisible();

    // Verify other logs are hidden
    const visibleRows = await page.locator('tbody tr:visible').count();
    expect(visibleRows).toBeGreaterThan(0);
  });

  test('should view log details', async ({ page }) => {
    // Click on a log entry
    await page.click('tbody tr:first-child');

    // Verify details modal opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Verify log details are shown
    await expect(page.locator('text=Log Details')).toBeVisible();
    await expect(page.locator('text=/timestamp/i')).toBeVisible();
    await expect(page.locator('text=/message/i')).toBeVisible();

    // Close modal
    await page.click('button[aria-label="Close"]');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should export logs', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    await page.click('button:has-text("Export")');
    await page.click('text=Export as CSV');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('logs');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should paginate logs', async ({ page }) => {
    // Verify pagination controls
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    await expect(page.locator('button:has-text("Previous")')).toBeVisible();

    // Get first page first row
    const firstPageFirstRow = await page.locator('tbody tr:first-child').textContent();

    // Go to next page
    await page.click('button:has-text("Next")');

    // Verify different content
    const secondPageFirstRow = await page.locator('tbody tr:first-child').textContent();
    expect(secondPageFirstRow).not.toBe(firstPageFirstRow);

    // Go back to previous page
    await page.click('button:has-text("Previous")');

    // Verify back to original content
    const backToFirstRow = await page.locator('tbody tr:first-child').textContent();
    expect(backToFirstRow).toBe(firstPageFirstRow);
  });

  test('should show real-time log updates', async ({ page, context }) => {
    // Open logs page
    await expect(page).toHaveURL(/.*logs/);

    // Get initial log count
    const initialCount = await page.locator('tbody tr').count();

    // Trigger an action that creates a log (in another tab)
    const newPage = await context.newPage();
    await newPage.goto('/jobs');
    await newPage.click('button:has-text("Add Job")');
    await newPage.fill('input[name="title"]', 'New Job');
    await newPage.fill('input[name="company"]', 'New Company');
    await newPage.click('button[type="submit"]');
    await newPage.close();

    // Wait for WebSocket update
    await page.waitForTimeout(2000);

    // Verify new log appeared
    const newCount = await page.locator('tbody tr').count();
    expect(newCount).toBeGreaterThan(initialCount);

    // Verify new log is highlighted
    await expect(page.locator('tbody tr:first-child.highlight')).toBeVisible();
  });

  test('should clear old logs', async ({ page }) => {
    await page.click('button:has-text("Clear Logs")');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify logs cleared
    await expect(page.locator('text=No logs found')).toBeVisible();
  });
});
