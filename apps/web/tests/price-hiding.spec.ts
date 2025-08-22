import { test, expect } from '@playwright/test';

test.describe('Price Hiding Tests', () => {
  test('should redirect unauthenticated users from products page to home', async ({ page }) => {
    // Try to access products page without authentication
    await page.goto('/products');
    
    // Should be redirected to home page
    await expect(page).toHaveURL('/');
  });

  test('should show products without prices for unauthenticated users', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    
    // Check if product cards exist but without prices
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards).toHaveCount(3);
    
    // Prices should not be visible
    const prices = page.locator('.text-primary');
    await expect(prices).toHaveCount(0);
  });

  test('should handle referral code in URL', async ({ page }) => {
    // Visit with referral code
    await page.goto('/?ref=WELCOME10');
    
    // Should redirect to home without ref parameter
    await expect(page).toHaveURL('/');
    
    // Check if referral code cookie was set
    const cookies = await page.context().cookies();
    const referralCookie = cookies.find(cookie => cookie.name === 'referral_code');
    expect(referralCookie?.value).toBe('WELCOME10');
  });
});
