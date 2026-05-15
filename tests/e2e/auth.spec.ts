import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('User can register, login and logout', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.fill('input[name="company_name"]', 'E2E Test Company');
    await page.fill('input[name="full_name"]', 'E2E User');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'S3cur3P@ssw0rd!');
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or ask to verify email
    // Assuming auto-login is true or email confirm is bypassed in test env
    await expect(page).toHaveURL(/.*dashboard/);

    // Logout
    await page.click('text=Déconnexion');
    await expect(page).toHaveURL(/.*login/);
  });
});
