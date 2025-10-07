import { test, expect } from '@playwright/test';

test.describe('Guild Leaderboards', () => {
  test('should render leaderboards and switch tabs', async ({ page }) => {
    await page.goto('/pvp/leaderboards');

    await expect(page.getByRole('heading', { name: /Guild Leaderboards/i })).toBeVisible();

    const killFameTab = page.getByRole('button', { name: /Kill Fame/i });
    await expect(killFameTab).toBeVisible();

    await killFameTab.click();
    await expect(killFameTab).toHaveAttribute('class', /bg-neon-green/);

    const attacksTab = page.getByRole('button', { name: /Attacks Won/i });
    await attacksTab.click();
    await expect(attacksTab).toHaveAttribute('class', /bg-neon-red/);
  });

  test('should show metric legend', async ({ page }) => {
    await page.goto('/pvp/leaderboards');

    await expect(page.getByText('K/D ≥ 2.0')).toBeVisible();
    await expect(page.getByText('K/D ≥ 1.0')).toBeVisible();
    await expect(page.getByText('K/D < 1.0')).toBeVisible();
  });
});
