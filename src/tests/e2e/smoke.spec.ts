import { test, expect } from '@playwright/test';

/**
 * Basic E2E smoke tests to verify core functionality
 * Tag with @smoke for quick CI runs
 */
test.describe('Smoke Tests', () => {
    test('should load login page @smoke', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    });

    test('should load signup page @smoke', async ({ page }) => {
        await page.goto('/signup');
        await expect(page.getByRole('heading', { name: /signup/i })).toBeVisible();
    });

    test('should have proper page titles', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/E-Commerce Analytics Dashboard/);
    });
});