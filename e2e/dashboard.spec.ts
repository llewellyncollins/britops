import { test, expect } from '@playwright/test';

// Helper to log an operation
async function logOperation(page: import('@playwright/test').Page, diagnosis: string) {
  await page.getByRole('link', { name: 'Log Op' }).click();
  await page.locator('input[type="date"]').fill('2025-03-15');
  await page.getByPlaceholder('e.g., Gr 2 EEC').fill(diagnosis);
  await page.getByText('Select procedures...').click();
  await page.getByPlaceholder('Search by name, specialty or category...').fill('appendicectomy');
  await page.getByText('Laparoscopic appendicectomy').first().click();
  await page.getByRole('button', { name: 'Save Operation' }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Continue without account').click();
    await expect(page).toHaveURL('/');
  });

  test('shows empty state initially', async ({ page }) => {
    await expect(page.getByText('No operations found')).toBeVisible();
    await expect(page.getByText('0 operations')).toBeVisible();
  });

  test('shows operations after logging one', async ({ page }) => {
    await logOperation(page, 'Test diagnosis');
    await expect(page.getByText('Test diagnosis')).toBeVisible();
    await expect(page.getByText('1 operations')).toBeVisible();
  });

  test('search filters operations', async ({ page }) => {
    await logOperation(page, 'Appendicitis case');
    await logOperation(page, 'Gallstones case');

    await page.getByPlaceholder('Search operations...').fill('Appendicitis');
    await expect(page.getByText('Appendicitis case')).toBeVisible();
    await expect(page.getByText('Gallstones case')).not.toBeVisible();
  });
});
