import { expect, test } from '@playwright/test';

const baseURL = process.env.SNIPCART_SMOKE_URL ?? 'http://127.0.0.1:4321';
test('real Snipcart Test empty cart toggles open and closed, then reopens', async ({ page }) => {
  const url = new URL(baseURL);
  expect([`https:`, `http:`]).toContain(url.protocol);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  const hasApiKey = await page.evaluate(() =>
    Boolean(
      (window as Window & { SnipcartSettings?: { publicApiKey?: string } }).SnipcartSettings
        ?.publicApiKey,
    ),
  );
  expect(hasApiKey, 'Configure the public Snipcart Test API key in .env.local first.').toBe(true);
  const bag = page.locator('button.snipcart-checkout');
  await page.evaluate(() => {
    const windowWithSnipcartReady = window as Window & { __snipcartReady?: Promise<void> };
    windowWithSnipcartReady.__snipcartReady = new Promise((resolve) =>
      document.addEventListener('snipcart.ready', () => resolve(), { once: true }),
    );
  });
  await bag.focus();
  await page.evaluate(async () => {
    await (window as Window & { __snipcartReady: Promise<void> }).__snipcartReady;
  });
  await page.keyboard.press('Enter');
  await expect(page.locator('#snipcart')).toContainText(/Your cart is empty/i, { timeout: 30_000 });
  await expect(page.locator('#snipcart')).toContainText(/test mode/i);
  await page.screenshot({ path: 'visual-evidence/snipcart-desktop.png', fullPage: true });
  const close = page.locator('#snipcart .snipcart-cart__secondary-header button');
  await expect(close).toHaveCount(1);
  await close.click();
  await bag.click();
  await expect(page.locator('#snipcart')).toContainText(/Your cart is empty/i, { timeout: 30_000 });
  await close.click();

  await page.setViewportSize({ width: 390, height: 844 });
  await bag.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#snipcart')).toContainText(/Your cart is empty/i, { timeout: 30_000 });
  await page.screenshot({ path: 'visual-evidence/snipcart-mobile.png', fullPage: true });
});
