import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { siteCopy, siteCopySchema } from './site-copy';

const copyFixture = () => structuredClone(siteCopy);
const source = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('site copy', () => {
  it('validates required editorial and interface copy', () => {
    expect(siteCopy.home.title).toContain('Paperseal');
    expect(siteCopy.navigation.items).toHaveLength(4);
    expect(siteCopy.catalogue.searchPlaceholder).toBeTruthy();
  });

  it('keeps copy separate from product data', () => {
    expect(siteCopy).not.toHaveProperty('artworks');
    expect(siteCopy).not.toHaveProperty('products');
  });

  it.each([
    ['catalogue.searchPlaceholder', (copy: typeof siteCopy) => delete copy.catalogue.searchPlaceholder],
    ['cart.emptyCopy', (copy: typeof siteCopy) => delete copy.cart.emptyCopy],
    ['catalogue.heading', (copy: typeof siteCopy) => { copy.catalogue.heading = ''; }],
    ['cart.sceneLabel', (copy: typeof siteCopy) => { copy.cart.sceneLabel = ''; }],
    ['navigation.items href', (copy: typeof siteCopy) => { copy.navigation.items[0].href = 'artworks'; }],
  ])('rejects invalid %s copy', (_label, mutate) => {
    const copy = copyFixture();
    mutate(copy);
    expect(siteCopySchema.safeParse(copy).success).toBe(false);
  });

  it('wires representative copy namespaces into rendered Astro surfaces', () => {
    const home = source('src/pages/index.astro');
    const catalogue = source('src/pages/artworks/index.astro');
    const cart = source('src/pages/cart.astro');
    const product = source('src/pages/artworks/[handle].astro');
    const header = source('src/components/SiteHeader.astro');
    const footer = source('src/components/SiteFooter.astro');

    expect(home).toContain('{home.heroHeading}');
    expect(catalogue).toContain('{catalogue.searchPlaceholder}');
    expect(cart).toContain('{cart.heading}');
    expect(product).toContain('{product.commerceTitle}');
    expect(header).toContain('siteCopy.navigation.menuOpenLabel');
    expect(footer).toContain('siteCopy.navigation.footerNavigation');
  });
});
