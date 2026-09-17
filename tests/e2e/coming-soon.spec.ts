import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('renders the coming-soon page with an accessible title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('The Paper Seal Studio — Coming soon');
  await expect(page.getByTestId('coming-soon')).toContainText(
    'Something beautiful is coming soon.',
  );
});

test('has no automated accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
