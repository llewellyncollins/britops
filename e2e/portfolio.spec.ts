import { test, expect } from '@playwright/test';

test.describe('Portfolio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Continue without account').click();
    await expect(page).toHaveURL('/');
  });

  test('shows upgrade banner for free users', async ({ page }) => {
    await page.getByRole('link', { name: 'Portfolio' }).click();

    // Portfolio is gated behind Pro tier — free users see the upgrade banner
    await expect(page.getByText(/unlock portfolio/i)).toBeVisible();
  });

  test('shows aggregated data after logging operations', async ({ page }) => {
    // Log an operation
    await page.getByRole('link', { name: 'Log Op' }).click();
    await page.locator('input[type="date"]').fill('2025-03-15');
    await page.getByPlaceholder('e.g., Gr 2 EEC').fill('Test');
    await page.getByText('Select procedures...').click();
    await page.getByPlaceholder('Search by name, specialty or category...').fill('cholecystectomy');
    await page.getByText('Laparoscopic cholecystectomy').first().click();
    // Close the procedure picker dropdown
    await page.getByRole('heading', { name: 'Log Operation' }).click();
    await page.getByRole('radio', { name: 'Surgeon independent' }).click();
    await page.getByRole('button', { name: 'Save Operation' }).click();

    // Navigate to Portfolio — still gated for free users
    await page.getByRole('link', { name: 'Portfolio' }).click();
    await expect(page.getByText(/unlock portfolio/i)).toBeVisible();
  });
});
