import { describe, expect, it } from 'vitest';
import { siteCopy, siteCopySchema } from './site-copy';

const copyFixture = () => structuredClone(siteCopy);
const withoutKey = <T extends object>(value: T, key: keyof T): T =>
  Object.fromEntries(Object.entries(value).filter(([entryKey]) => entryKey !== key)) as T;

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
    [
      'catalogue.searchPlaceholder',
      (copy: typeof siteCopy) => {
        copy.catalogue = withoutKey(copy.catalogue, 'searchPlaceholder');
      },
    ],
    [
      'cart.emptyCopy',
      (copy: typeof siteCopy) => {
        copy.cart = withoutKey(copy.cart, 'emptyCopy');
      },
    ],
    [
      'catalogue.heading',
      (copy: typeof siteCopy) => {
        copy.catalogue.heading = '';
      },
    ],
    [
      'cart.sceneLabel',
      (copy: typeof siteCopy) => {
        copy.cart.sceneLabel = '';
      },
    ],
    [
      'navigation.items href',
      (copy: typeof siteCopy) => {
        copy.navigation.items[0].href = 'artworks';
      },
    ],
  ])('rejects invalid %s copy', (_label, mutate) => {
    const copy = copyFixture();
    mutate(copy);
    expect(siteCopySchema.safeParse(copy).success).toBe(false);
  });
});
