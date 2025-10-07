import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /Welcome to the/i })).toBeVisible();
    
    // Check for quick stats
    await expect(page.getByText(/Market Volume/i)).toBeVisible();
    await expect(page.getByText(/Active Players/i)).toBeVisible();
  });

  test('should open command palette with Ctrl+K', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Press Ctrl+K
    await page.keyboard.press('Control+k');
    
    // Check if command palette is visible
    await expect(page.getByPlaceholder(/Search commands/i)).toBeVisible();
  });

  test('should navigate to trading hub', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on trading link
    await page.getByRole('link', { name: /Trading/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/trading/);
    await expect(page.getByRole('heading', { name: /Trading Hub/i })).toBeVisible();
  });

  test('should navigate to PvP hub', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on PvP link
    await page.getByRole('link', { name: /PvP/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/pvp/);
    await expect(page.getByRole('heading', { name: /PvP Hub/i })).toBeVisible();
  });

  test('should display market ticker', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for market ticker
    await expect(page.getByText(/Market Ticker/i)).toBeVisible();
  });

  test('should display server status', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for server status widget
    await expect(page.getByText(/Server Status/i)).toBeVisible();
    await expect(page.getByText(/Online|Offline/i)).toBeVisible();
  });
});

test.describe('Trading Tools E2E Tests', () => {
  test('should load arbitrage calculator', async ({ page }) => {
    await page.goto('/trading/arbitrage');
    
    await expect(page.getByRole('heading', { name: /Arbitrage/i })).toBeVisible();
  });

  test('should load trade simulator', async ({ page }) => {
    await page.goto('/trading/simulator');
    
    await expect(page.getByRole('heading', { name: /Monte Carlo/i })).toBeVisible();
  });
});

test.describe('PvP Tools E2E Tests', () => {
  test('should load leaderboards', async ({ page }) => {
    await page.goto('/pvp/leaderboards');
    
    await expect(page.getByRole('heading', { name: /Leaderboards/i })).toBeVisible();
    await expect(page.getByText(/Top Players|Top Guilds/i)).toBeVisible();
  });
});

test.describe('Accessibility Tests', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for h1
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/items');
    
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    // Check that images have alt text
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});

test.describe('Performance Tests', () => {
  test('should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});
