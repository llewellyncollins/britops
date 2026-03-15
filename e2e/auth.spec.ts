import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders with form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'BritOps' })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByText('Continue with Google')).toBeVisible();
  });

  test('"Continue without account" navigates to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Continue without account').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Logbook' })).toBeVisible();
  });

  test('toggle between sign-in and create account', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await page.getByRole('button', { name: 'Create one' }).click();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

    await page.getByRole('button', { name: /sign in/i }).first().click();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
