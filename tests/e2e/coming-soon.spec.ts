import { expect, test } from '@playwright/test';

test('renders the coming-soon page with an accessible title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Paperseal — Coming soon');
  await expect(page.getByTestId('coming-soon')).toContainText(
    'Something beautiful is coming soon.',
  );
});
