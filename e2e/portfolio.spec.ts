import { test, expect } from '@playwright/test';

test.describe('Portfolio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Continue without account').click();
    await expect(page).toHaveURL('/');
  });

  test('shows empty state when no operations logged', async ({ page }) => {
    await page.getByRole('link', { name: 'Portfolio' }).click();
    await expect(page.getByText(/no operations logged yet/i)).toBeVisible();
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
    await page.getByRole('button', { name: 'Surgeon independent' }).click();
    await page.getByRole('button', { name: 'Save Operation' }).click();

    // Navigate to Portfolio
    await page.getByRole('link', { name: 'Portfolio' }).click();

    // Should see the procedure in the table
    await expect(page.getByText('Laparoscopic cholecystectomy')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'General Surgery' })).toBeVisible();
  });
});
