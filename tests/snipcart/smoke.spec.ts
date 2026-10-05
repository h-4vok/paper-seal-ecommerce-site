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
    await (window as Window & { __snipcartReady?: Promise<void> }).__snipcartReady;
  });
  await bag.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#snipcart')).toContainText(/Your cart is empty/i, { timeout: 30_000 });
  await expect(page.locator('#snipcart')).toContainText(/test mode/i);
  const sealImage = await page
    .locator('#snipcart .snipcart-empty-cart')
    .evaluate((element) => getComputedStyle(element, '::before').backgroundImage);
  expect(sealImage).toContain('/images/brand/paperseal-seal.png');
  const sealResponse = await page.request.get('/images/brand/paperseal-seal.png');
  expect(sealResponse.ok()).toBe(true);
  expect(sealResponse.headers()['content-type']).toContain('image/png');
  await expect(page.locator('#snipcart .snipcart-cart__secondary-header')).toHaveCSS(
    'background-color',
    'rgb(243, 237, 226)',
  );
  await page.screenshot({ path: 'visual-evidence/snipcart-desktop.png' });
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
  await page.screenshot({ path: 'visual-evidence/snipcart-mobile.png' });
});

test('real Snipcart Test populated side cart uses the Paperseal theme', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(new URL('/artworks/flower-bed-ps-001/', baseURL).toString());
  const add = page.locator('button.snipcart-add-item');
  await page.evaluate(() => {
    const windowWithSnipcartReady = window as Window & { __snipcartReady?: Promise<void> };
    windowWithSnipcartReady.__snipcartReady = new Promise((resolve) =>
      document.addEventListener('snipcart.ready', () => resolve(), { once: true }),
    );
  });
  await add.focus();
  await page.evaluate(async () => {
    await (window as Window & { __snipcartReady?: Promise<void> }).__snipcartReady;
  });
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#snipcart')).toContainText('Flower Bed', { timeout: 30_000 });
  await expect(page.locator('#snipcart')).toContainText('£8.00');
  await expect(page.locator('#snipcart .snipcart-cart__secondary-header')).toHaveCSS(
    'background-color',
    'rgb(243, 237, 226)',
  );
  await page.screenshot({ path: 'visual-evidence/snipcart-populated-desktop.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#snipcart')).toContainText('Flower Bed');
  await page.screenshot({ path: 'visual-evidence/snipcart-populated-mobile.png' });
});

test('test checkout shows the payment form without card guidance', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(new URL('/artworks/flower-bed-ps-001/', baseURL).toString());
  const settings = await page.evaluate(
    () => (window as Window & { SnipcartSettings?: { templatesUrl?: string } }).SnipcartSettings,
  );
  expect(settings?.templatesUrl).toBeUndefined();
  await page.locator('button.snipcart-add-item').focus();
  await expect(page.locator('#snipcart')).toBeAttached();
  await expect(page.locator('#snipcart')).not.toHaveAttribute('hidden', { timeout: 30_000 });
  await page.locator('button.snipcart-add-item').click();
  await expect(page.locator('#snipcart')).toContainText('Flower Bed', { timeout: 30_000 });
  await page.locator('#snipcart').getByRole('button', { name: 'Checkout' }).click();
  const checkout = page.locator('#snipcart');
  await checkout.getByRole('textbox', { name: 'First name' }).fill('Test');
  await checkout.getByRole('textbox', { name: 'Last name' }).fill('Customer');
  await checkout.getByRole('textbox', { name: 'Email' }).fill('checkout-test@example.com');
  await checkout.getByRole('textbox', { name: 'Street address' }).fill('1 Test Street');
  await checkout.getByRole('textbox', { name: 'City' }).fill('Eastbourne');
  await checkout.getByRole('textbox', { name: 'Province/State' }).fill('East Sussex');
  await checkout.getByRole('textbox', { name: 'Postal/ZIP code' }).fill('BN21 1AA');
  await checkout.getByRole('button', { name: 'Continue to shipping' }).click();
  await checkout.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(checkout.locator('.snipcart-test-payment-hint')).toHaveCount(0);
  await expect(checkout.getByText('4242 4242 4242 4242')).toHaveCount(0);
  await expect(checkout.locator('.snipcart-payment__form-container iframe')).toBeVisible({
    timeout: 30_000,
  });
  await expect(checkout.getByRole('button', { name: 'Place order' })).toBeVisible({
    timeout: 30_000,
  });
  await page.screenshot({ path: 'visual-evidence/snipcart-payment.png' });
});
