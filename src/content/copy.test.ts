import { describe, expect, it } from 'vitest';
import { copy, copyLines, copySchemas, copyText, loadCopy, validateCopyFiles } from './copy';

type LoadedCopy = {
  shared: { navigation: { items: unknown[] } };
  home: { seo: { title: string } };
  catalogue: { controls: { searchPlaceholder: string } };
  commissions: { seo: { title: string }; galleryLabel: string };
  collabs: {
    seo: { title: string };
    galleryLabel: string;
    mapLink: string;
    contact: {
      linksLabel: string;
      actions: { whatsapp: string; instagram: string };
      top: { heading: string; copy: string };
      bottom: { heading: string; copy: string };
    };
    uniqueWorksNote: string;
  };
  cart: { header: { heading: string } };
  product: { labels: { addToCart: string; selectSizeCta: string; selectSizePrompt: string } };
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
    expect(loaded.shared.navigation.items).toMatchObject([
      { href: '/artworks', label: 'Our Artwork' },
      { href: '/our-story', label: 'Our Story' },
      { href: '/collabs', label: 'Collabs' },
      { href: '/commissions', label: 'Commissions' },
    ]);
    expect(copy.shared.footer.commissions).toBe('Commissions');
    expect(loaded.home.seo.title).toContain('The Paper Seal Studio');
    expect(loaded.catalogue.controls.searchPlaceholder).toBeTruthy();
    expect(copy.commissions.seo.title).toContain('Commissioned Artworks');
    expect(copy.commissions.galleryLabel).toBeTruthy();
    expect(copy.commissions.contact.actions).toMatchObject({
      whatsapp: expect.stringContaining('WhatsApp'),
      instagram: expect.stringContaining('Instagram'),
    });
    expect(copy.commissions.contact.bottom.copy).not.toMatch(/call/i);
    expect(loaded.collabs.seo.title).toContain('Collaborations');
    expect(loaded.collabs.galleryLabel).toBeTruthy();
    expect(loaded.collabs.mapLink).toContain('Discover');
    expect(loaded.collabs.contact.linksLabel).toContain('Collaboration');
    expect(loaded.collabs.contact.actions.whatsapp).toContain('WhatsApp');
    expect(loaded.collabs.contact.top.copy).toContain('collaboration');
    expect(loaded.collabs.contact.bottom.copy).not.toMatch(/call/i);
    expect(loaded.collabs.uniqueWorksNote).toContain('not available to buy');
    expect(loaded.cart.header.heading).toBeTruthy();
    expect(loaded.product.labels.addToCart).toBeTruthy();
    expect(loaded.product.labels.selectSizeCta).toBe('Select size');
    expect(loaded.product.labels.selectSizePrompt).toBeTruthy();
    expect(copy.product.greetingCard.gallery).toBe('Greeting card images');
    expect(loaded.institutional.pages).toHaveLength(7);
  });

  it('supports only controlled interpolation and readable line breaks', () => {
    expect(copyText('© {year} The Paper Seal Studio', { year: 2026 })).toBe(
      '© 2026 The Paper Seal Studio',
    );
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
        'commissions.yaml',
        'collabs.yaml',
        'unexpected.yaml',
      ]),
    ).toThrow('Unknown copy YAML files');
  });
});
