import { test, expect } from '@playwright/test';

// Helper to login
async function login(page) {
  await page.goto('/login');
  await page.fill('input#email', 'demo@example.com');
  await page.fill('input#password', 'demo123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

test.describe('Agents Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display agents page', async ({ page }) => {
    await page.goto('/agents');

    await expect(page.locator('h1')).toContainText('Agents');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should show list of agents', async ({ page }) => {
    await page.goto('/agents');

    // Wait for agents to load
    await expect(page.locator('.card')).toHaveCount(2, { timeout: 10000 });
  });

  test('should filter agents by search', async ({ page }) => {
    await page.goto('/agents');

    // Wait for agents to load
    await expect(page.locator('.card')).toHaveCount(2, { timeout: 10000 });

    // Search for Atreides
    await page.fill('input[placeholder*="Search"]', 'Atreides');
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card')).toContainText('Atreides');
  });

  test('should select agent and show command panel', async ({ page }) => {
    await page.goto('/agents');

    // Wait for agents to load
    await expect(page.locator('.card')).toHaveCount(2, { timeout: 10000 });

    // Click on first agent
    await page.locator('.card').first().click();

    // Command panel should appear
    await expect(page.locator('h2')).toContainText('Command:');
  });

  test('should show empty state when search has no results', async ({ page }) => {
    await page.goto('/agents');

    // Wait for agents to load
    await expect(page.locator('.card')).toHaveCount(2, { timeout: 10000 });

    // Search for non-existent agent
    await page.fill('input[placeholder*="Search"]', 'NonExistentAgent');
    await expect(page.locator('text=No agents found')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate between pages', async ({ page }) => {
    // Start on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to agents
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL(/.*agents/);

    // Navigate to tasks
    await page.click('a[href="/tasks"]');
    await expect(page).toHaveURL(/.*tasks/);

    // Navigate to notifications
    await page.click('a[href="/notifications"]');
    await expect(page).toHaveURL(/.*notifications/);
  });

  test('should show connection status', async ({ page }) => {
    await expect(page.locator('.text-green-500, .text-red-500')).toBeVisible();
  });

  test('should logout', async ({ page }) => {
    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Tasks Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display tasks page', async ({ page }) => {
    await page.goto('/tasks');

    await expect(page.locator('h1')).toContainText('Tasks');
  });

  test('should show filter buttons', async ({ page }) => {
    await page.goto('/tasks');

    await expect(page.locator('button:has-text("Total")')).toBeVisible();
    await expect(page.locator('button:has-text("Running")')).toBeVisible();
    await expect(page.locator('button:has-text("Completed")')).toBeVisible();
    await expect(page.locator('button:has-text("Failed")')).toBeVisible();
  });
});
