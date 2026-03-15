import { test, expect } from '@playwright/test';

test.describe('Offline behavior', () => {
  test('shows offline indicator when network is down', async ({ page, context }) => {
    await page.goto('/login');
    await page.getByText('Continue without account').click();
    await expect(page).toHaveURL('/');

    // Go offline
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // Should show offline indicator
    await expect(page.getByText('Offline')).toBeVisible();

    // Go back online
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // Offline indicator should disappear
    await expect(page.getByText('Offline')).not.toBeVisible();
  });

  test('can create operations while offline', async ({ page, context }) => {
    await page.goto('/login');
    await page.getByText('Continue without account').click();

    // Go offline
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // Log an operation
    await page.getByRole('link', { name: 'Log Op' }).click();
    await page.locator('input[type="date"]').fill('2025-03-15');
    await page.getByPlaceholder('e.g., Gr 2 EEC').fill('Offline operation');
    await page.getByText('Select procedures...').click();
    await page.getByPlaceholder('Search by name, specialty or category...').fill('appendicectomy');
    await page.getByText('Laparoscopic appendicectomy').first().click();
    await page.getByRole('button', { name: 'Save Operation' }).click();

    // Should redirect to dashboard and show the operation
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Offline operation')).toBeVisible();
  });
});
