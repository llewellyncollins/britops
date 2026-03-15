import { test, expect } from '@playwright/test';

test.describe('Log Operation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Continue without account').click();
    await expect(page).toHaveURL('/');
  });

  test('full operation logging flow', async ({ page }) => {
    // Navigate to Log Op via bottom nav link
    await page.getByRole('link', { name: 'Log Op' }).click();
    await expect(page.getByRole('heading', { name: 'Log Operation' })).toBeVisible();

    // Fill the date
    await page.locator('input[type="date"]').fill('2025-03-15');

    // Fill patient ID
    await page.getByPlaceholder('Hospital number').fill('PT001');

    // Fill diagnosis
    await page.getByPlaceholder('e.g., Gr 2 EEC').fill('Gallstone disease');

    // Open procedure picker and select a procedure
    await page.getByText('Select procedures...').click();
    await page.getByPlaceholder('Search by name, specialty or category...').fill('cholecystectomy');
    await page.getByText('Laparoscopic cholecystectomy').first().click();

    // Close the procedure picker dropdown by clicking outside it
    await page.getByRole('heading', { name: 'Log Operation' }).click();

    // Select involvement level
    await page.getByRole('button', { name: 'Surgeon independent' }).click();

    // Submit the form
    await page.getByRole('button', { name: 'Save Operation' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');

    // The new operation should appear
    await expect(page.getByText('Gallstone disease')).toBeVisible();
  });

  test('save button is disabled without procedures selected', async ({ page }) => {
    await page.getByRole('link', { name: 'Log Op' }).click();

    const saveButton = page.getByRole('button', { name: 'Save Operation' });
    await expect(saveButton).toBeDisabled();
  });
});
