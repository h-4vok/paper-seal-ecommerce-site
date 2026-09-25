import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { copy } from '../../src/content/copy';

test.describe('The Paper Seal Studio Home', () => {
  test('renders the complete server-authored Home with crawlable destinations', async ({
    page,
  }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    const serverHtml = await response?.text();
    expect(serverHtml?.match(/<h1\b/g) ?? []).toHaveLength(1);
    await expect(page).toHaveTitle('The Paper Seal Studio — Art prints inspired by East Sussex');
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toHaveText(
      'Celebrate the beauty of East Sussex everyday.',
    );
    await expect(
      page.getByRole('heading', { name: 'For familiar places that stay with you.' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Places that are part of you.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /A wall can hold a memory/ })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'East Sussex is art. We make it last.' }),
    ).toBeVisible();

    const artworkLinks = page.locator('a[href="/artworks"]');
    await expect(artworkLinks.first()).toBeVisible();
    expect(await artworkLinks.count()).toBeGreaterThanOrEqual(4);
    await expect(page.locator('footer')).toContainText('Independent art from the Sussex coast.');
  });

  test('publishes complete SEO and structured metadata', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Eastbourne and East Sussex/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://paperseal.co.uk/',
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://paperseal.co.uk/',
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https:\/\/paperseal\.co\.uk\//,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );

    const data = await page.locator('script[type="application/ld+json"]').textContent();
    expect(data).not.toBeNull();
    const json = JSON.parse(data ?? '[]') as Array<Record<string, string>>;
    expect(json.map((item) => item['@type'])).toEqual(['Organization', 'WebSite']);
  });

  test('serves responsive, dimensioned contextual artwork', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('main img');
    await expect(images).toHaveCount(6);
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute('width', /\d+/);
      await expect(image).toHaveAttribute('height', /\d+/);
      await expect(image).toHaveAttribute('alt', /.+/);
    }
    expect(await page.locator('main source[type="image/avif"]').count()).toBe(6);
    expect(await page.locator('main source[type="image/webp"]').count()).toBe(6);
  });

  for (const [name, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['tablet', { width: 820, height: 1180 }],
    ['mobile', { width: 390, height: 844 }],
  ] as const) {
    test(`shows paper quality and its story destination on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));

      const response = await page.goto('/');
      const html = await response?.text();
      expect(html).toContain(copy.home.paperQuality.heading);
      const paper = page.locator('section.paper-quality');
      await expect(
        paper.getByRole('heading', { name: copy.home.paperQuality.heading }),
      ).toBeVisible();
      await expect(paper).toContainText(copy.home.paperQuality.body);
      for (const attribute of copy.home.paperQuality.attributes)
        await expect(paper).toContainText(attribute);
      const slides = paper.locator('[data-paper-slide]');
      await expect(slides).toHaveCount(3);
      for (const [index, image] of copy.home.paperQuality.images.entries())
        await expect(slides.nth(index).locator('img')).toHaveAttribute('alt', image.alt);
      await slides.first().locator('img').scrollIntoViewIfNeeded();
      await expect
        .poll(
          () =>
            slides
              .first()
              .locator('img')
              .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
          { timeout: 30000 },
        )
        .toBe(true);
      expect(
        await paper.evaluate((element) => {
          const collection = document.querySelector('.current-collection');
          return (
            collection !== null &&
            Boolean(element.compareDocumentPosition(collection) & Node.DOCUMENT_POSITION_FOLLOWING)
          );
        }),
      ).toBe(true);
      const link = paper.getByRole('link', { name: copy.home.paperQuality.cta });
      await expect(link).toHaveAttribute('href', '/our-story#paper-and-quality');
      await expect(link).toHaveClass(/button-link/);
      const imageBounds = await slides.first().locator('img').boundingBox();
      const contentBounds = await paper.locator('.paper-quality__content').boundingBox();
      expect(imageBounds).not.toBeNull();
      expect(contentBounds).not.toBeNull();
      expect(contentBounds!.x).toBeGreaterThanOrEqual(imageBounds!.x);
      expect(contentBounds!.y).toBeGreaterThanOrEqual(imageBounds!.y);
      expect(contentBounds!.x + contentBounds!.width).toBeLessThanOrEqual(
        imageBounds!.x + imageBounds!.width,
      );
      expect(contentBounds!.y + contentBounds!.height).toBeLessThanOrEqual(
        imageBounds!.y + imageBounds!.height,
      );
      const next = paper.getByRole('button', { name: copy.home.paperQuality.nextImage });
      const previous = paper.getByRole('button', { name: copy.home.paperQuality.previousImage });
      const dots = paper.locator('[data-paper-index]');
      await next.click();
      await expect(slides.nth(1)).toBeVisible();
      await expect(slides.first()).toBeHidden();
      await expect(dots.nth(1)).toHaveAttribute('aria-pressed', 'true');
      await expect(paper.locator('[data-paper-caption]')).toHaveText(
        copy.home.paperQuality.images[1].caption,
      );
      await dots.nth(2).focus();
      await dots.nth(2).press('Space');
      await expect(slides.nth(2)).toBeVisible();
      await expect(dots.nth(2)).toHaveAttribute('aria-pressed', 'true');
      await previous.click();
      await expect(slides.nth(1)).toBeVisible();
      await dots.first().click();
      await expect(slides.first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      );
      await link.click();
      await expect(page).toHaveURL(/\/our-story#paper-and-quality$/);
      await expect(page.locator('#paper-and-quality')).toContainText(
        copy.institutional.pages
          .find((item) => item.slug === 'our-story')
          ?.sections.find((item) => item.id === 'paper-and-quality')?.heading ?? '',
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      );
      expect(errors).toEqual([]);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
  }

  test('has no automated accessibility violations on desktop', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('supports keyboard, modal focus, Escape and trigger restoration', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Open menu' });
    await trigger.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Explore The Paper Seal Studio' });
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('link', { name: 'Prints', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('open menu has no automated accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test('catalogue and cart destinations are honest and SEO files are crawlable', async ({
  page,
  request,
}) => {
  await page.goto('/artworks');
  await expect(page.getByRole('heading', { level: 1, name: 'Artworks' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('[data-artwork-card]')).toHaveCount(16);

  await page.goto('/cart');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Your cart is waiting for the shop.' }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');

  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain('Sitemap: https://paperseal.co.uk/sitemap.xml');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).toContain('<loc>https://paperseal.co.uk/</loc>');
  expect(xml).toContain('/artworks');
  expect(xml).toContain('/our-story');
  expect(xml).not.toContain('/cart');
});
