import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const copy = JSON.parse(readFileSync(resolve(process.cwd(), 'content/site-copy.json'), 'utf8')) as {
  brand: { footerStatement: string[] };
  home: { heroHeading: string };
  catalogue: { searchPlaceholder: string };
  cart: { heading: string };
  product: { noStockLabel: string };
};

test.describe('catalogue discovery', () => {
  test('renders representative values from the editable copy source', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.home.heroHeading);
    await expect(page.locator('footer')).toContainText(copy.brand.footerStatement[0]);

    await page.goto('/artworks');
    await expect(page.getByPlaceholder(copy.catalogue.searchPlaceholder)).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.cart.heading);

    await page.goto('/artworks/seven-sisters-from-the-gardens-ps-002');
    await expect(page.getByText(copy.product.noStockLabel, { exact: true })).toBeVisible();
  });

  test('renders crawlable cards and combines live search, place and sort controls', async ({
    page,
  }) => {
    const response = await page.goto('/artworks');
    expect(response?.status()).toBe(200);
    const html = await response?.text();
    expect(html?.match(/href="\/artworks\/[^"]+"/g)?.length).toBe(17);
    await expect(page.getByRole('heading', { level: 1, name: 'Artworks' })).toBeVisible();
    await expect(page.locator('[data-artwork-card]')).toHaveCount(17);
    await expect(page.getByRole('button', { name: /Availability/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    const search = page.getByRole('searchbox', { name: 'Search artworks and places' });
    await search.fill('Beachy Head');
    await expect(page.locator('[data-artwork-card]:visible')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Beachy Head' })).toBeVisible();
    await expect(page).toHaveURL(/q=Beachy\+Head/);

    await search.fill('');
    await page.locator('[data-place]').selectOption('Sovereign Harbour');
    await expect(page.locator('[data-artwork-card]:visible')).toHaveCount(2);
    await expect(
      page.getByRole('heading', { name: 'Sovereign Harbour', exact: true }),
    ).toBeVisible();

    await page.locator('[data-place]').selectOption('all');
    await page.locator('[data-sort]').selectOption('title');
    await expect(
      page.locator('[data-artwork-card]:visible').first().getByRole('heading'),
    ).toHaveText('Battle Abbey');
  });

  test('progressively reveals the complete index and restores practical back position', async ({
    page,
  }) => {
    await page.goto('/artworks');
    await page.locator('[data-sentinel]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-artwork-card]:visible')).toHaveCount(8);
    const target = page.getByRole('link', { name: /View South Downs I/ });
    await target.scrollIntoViewIfNeeded();
    const previousScroll = await page.evaluate(() => window.scrollY);
    await target.click();
    await expect(page.getByRole('heading', { level: 1, name: 'South Downs I' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Artworks' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(previousScroll - 600);
  });

  test('announces no-results recovery and passes axe', async ({ page }) => {
    await page.goto('/artworks');
    await page
      .getByRole('searchbox', { name: 'Search artworks and places' })
      .fill('not a real artwork');
    await expect(
      page.getByRole('heading', { name: 'Try another place or a broader search.' }),
    ).toBeVisible();
    await expect(page.locator('[data-result-count]')).toHaveText('0 artworks');
    await page.getByRole('button', { name: 'Reset catalogue' }).click();
    await expect(page.getByRole('searchbox', { name: 'Search artworks and places' })).toBeFocused();
    await expect(page.locator('[data-result-count]')).toHaveText('17 artworks');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('keeps controls and cards usable at a realistic mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/artworks');
    const search = page.getByRole('searchbox', { name: 'Search artworks and places' });
    await search.focus();
    await page.keyboard.type('Pier');
    await expect(page.locator('[data-artwork-card]:visible')).toHaveCount(1);
    await search.fill('');
    await page.locator('[data-place]').selectOption('Beachy Head');
    await expect(page.locator('[data-artwork-card]:visible')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Beachy Head' })).toBeVisible();
    await expect(page).toHaveURL(/place=Beachy\+Head/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('product detail', () => {
  const productPath = '/artworks/seven-sisters-from-the-gardens-ps-002';

  test('uses true product facts, static SEO and no fabricated commerce', async ({ page }) => {
    await page.goto(productPath);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Seven Sisters from the Gardens' }),
    ).toHaveCount(1);
    await expect(page.getByText('Seven Sisters, East Sussex')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(5);
    await expect(page.getByText(/17\.8 × 12\.7 cm · 7 × 5 in/).first()).toBeVisible();
    await expect(page.getByText(/21 × 29\.7 cm · 8\.27 × 11\.69 in/).first()).toBeVisible();
    await expect(page.getByText(/29\.7 × 42 cm · 11\.69 × 16\.54 in/).first()).toBeVisible();
    expect(await page.locator('main').innerText()).not.toMatch(
      /\b(?:A5|A2|review|In stock|Add to cart)\b/i,
    );
    await expect(page.getByText('Online shop coming soon', { exact: true })).toBeVisible();
    expect(await page.locator('body').innerText()).not.toContain('£');

    const json = await page.locator('script[type="application/ld+json"]').textContent();
    expect(json).not.toBeNull();
    const data = JSON.parse(json ?? '[]') as Array<Record<string, unknown>>;
    expect(data[0]?.['@type']).toBe('Product');
    expect(data[0]).not.toHaveProperty('offers');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'product');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://paperseal.co.uk${productPath}`,
    );
  });

  test('operates gallery, option state and copy fallback without moving focus', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(productPath);
    const next = page.getByRole('button', { name: 'Next image' });
    await next.focus();
    await next.click();
    await expect(page.getByRole('button', { name: /Show image 2:/ }).first()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(next).toBeFocused();
    const stage = page.locator('[data-gallery-stage]');
    await stage.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: /Show image 1:/ }).first()).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('radio', { name: /Medium/ }).check();
    await page.getByRole('radio', { name: /Framed/ }).check();
    await expect(page.locator('[data-option-announcement]')).toContainText(
      'Medium, 21 × 29.7 cm · 8.27 × 11.69 in, Framed selected',
    );
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.locator('[data-share-status]')).toHaveText('Link copied to clipboard.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(productPath);
  });

  test('supports mobile swipe and indicator controls and passes axe', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(productPath);
    await expect(page.locator('.product-gallery__dots')).toBeVisible();
    await page
      .getByRole('button', { name: /Show image 2:/ })
      .first()
      .click();
    await expect(page.locator('[data-slide="1"]')).toBeVisible();
    await page.locator('[data-gallery-stage]').evaluate((stage) => {
      const start = new Event('touchstart', { bubbles: true });
      Object.defineProperty(start, 'touches', { value: [{ clientX: 320 }] });
      stage.dispatchEvent(start);
      const end = new Event('touchend', { bubbles: true });
      Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 160 }] });
      stage.dispatchEvent(end);
    });
    await expect(page.locator('[data-slide="0"]')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('opens and closes the active gallery image in an accessible lightbox', async ({ page }) => {
    await page.goto(productPath);
    await page.getByRole('button', { name: /Open .* full screen/ }).click();
    await expect(page.locator('[data-lightbox]')).toBeVisible();
    await expect(page.locator('[data-lightbox-image]')).toBeVisible();
    const imageBounds = await page.locator('[data-lightbox-image]').boundingBox();
    expect(imageBounds?.height).toBeLessThanOrEqual(844);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-lightbox]')).not.toBeVisible();
  });

  test('closes a portrait lightbox when clicking its surface outside the artwork', async ({
    page,
  }) => {
    await page.goto('/artworks/beachy-head-ps-004');
    await page.getByRole('button', { name: /Open .* full screen/ }).click();
    const surface = page.locator('[data-lightbox-surface]');
    await expect(surface).toBeVisible();
    await surface.click({ position: { x: 8, y: 8 } });
    await expect(page.locator('[data-lightbox]')).not.toBeVisible();
  });
});

test.describe('cart and institutional routes', () => {
  test('navigates to an honest dedicated cart and back to catalogue', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Cart, online shop coming soon' }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your cart is waiting for the shop.' }),
    ).toBeVisible();
    await expect(page.getByText('Online shop and checkout coming soon.')).toBeVisible();
    await expect(page.getByText(/subtotal|quantity|checkout now|go to checkout/i)).toHaveCount(0);
    await expect(page.locator('main button')).toHaveCount(0);
    await page.getByRole('link', { name: /Continue browsing artworks/ }).click();
    await expect(page).toHaveURL(/\/artworks$/);
  });

  test('publishes stable trust routes with explicit review status and footer links', async ({
    page,
  }) => {
    await page.goto('/returns');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Human help, without a portal.' }),
    ).toBeVisible();
    await expect(page.getByText(/handled manually by email/)).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    for (const href of ['/our-story', '/contact', '/delivery', '/returns', '/privacy', '/terms']) {
      await expect(page.locator(`footer a[href="${href}"]`)).toHaveCount(1);
    }
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.goto('/privacy');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await expect(page.getByText(/not the final legal privacy notice/)).toBeVisible();
  });

  test('keeps cart, story and contact accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ['/cart', '/our-story', '/contact']) {
      await page.goto(route);
      expect(await page.locator('main h1').count()).toBe(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, route).toEqual([]);
    }
  });
});
