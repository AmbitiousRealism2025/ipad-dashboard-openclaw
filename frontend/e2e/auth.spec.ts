import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Agent Dashboard');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#email', 'wrong@example.com');
    await page.fill('input#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toContainText('Invalid credentials');
  });

  test('should login successfully with demo credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#email', 'demo@example.com');
    await page.fill('input#password', 'demo123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input#password');
    const toggleButton = page.locator('button[aria-label*="password"]');

    await passwordInput.fill('testpassword');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing agents', async ({ page }) => {
    await page.goto('/agents');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing tasks', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveURL(/.*login/);
  });
});
