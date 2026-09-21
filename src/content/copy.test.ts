import { describe, expect, it } from 'vitest';
import { copy, copyLines, copySchemas, copyText, loadCopy, validateCopyFiles } from './copy';

type LoadedCopy = {
  shared: { navigation: { items: unknown[] } };
  home: { seo: { title: string } };
  catalogue: { controls: { searchPlaceholder: string } };
  cart: { header: { heading: string } };
  product: { labels: { noStock: string } };
  institutional: { pages: unknown[] };
};

describe('editorial copy', () => {
  it('loads the declared locale without a fallback', () => {
    expect(loadCopy('en-GB').shared).toBeDefined();
    expect(() => loadCopy('es-ES')).toThrow('Unknown copy locale');
  });

  it('provides validated shared navigation and home SEO copy', () => {
    const loaded = copy as unknown as LoadedCopy;
    expect(loaded.shared.navigation.items).toHaveLength(4);
    expect(loaded.home.seo.title).toContain('Paperseal');
    expect(loaded.catalogue.controls.searchPlaceholder).toBeTruthy();
    expect(loaded.cart.header.heading).toBeTruthy();
    expect(loaded.product.labels.noStock).toBeTruthy();
    expect(loaded.institutional.pages).toHaveLength(8);
  });

  it('supports only controlled interpolation and readable line breaks', () => {
    expect(copyText('© {year} Paperseal', { year: 2026 })).toBe('© 2026 Paperseal');
    expect(copyLines('Places worth keeping.\nPrints made to live with.')).toEqual([
      'Places worth keeping.',
      'Prints made to live with.',
    ]);
    expect(copyText('Hello {missing}')).toBe('Hello {missing}');
  });

  it('rejects missing required copy values and invalid navigation paths', () => {
    expect(copySchemas.catalogue.safeParse({}).success).toBe(false);
    expect(
      copySchemas.shared.shape.navigation.safeParse({
        items: [{ href: 'not-a-route', key: 'prints', label: 'Prints' }],
        cartLabel: 'Cart',
        openMenu: 'Open',
        closeMenu: 'Close',
        explore: 'Explore',
        mobileLabel: 'Mobile',
        contact: 'Contact',
        mobileIntro: 'Intro',
        primaryLabel: 'Primary',
      }).success,
    ).toBe(false);
  });

  it('rejects missing and unregistered YAML namespaces', () => {
    expect(() => validateCopyFiles(['shared.yaml'])).toThrow('Missing copy YAML files');
    expect(() =>
      validateCopyFiles([
        'shared.yaml',
        'home.yaml',
        'catalogue.yaml',
        'cart.yaml',
        'product.yaml',
        'institutional.yaml',
        'placeholder.yaml',
        'stories.yaml',
        'unexpected.yaml',
      ]),
    ).toThrow('Unknown copy YAML files');
  });
});
