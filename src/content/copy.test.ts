import { describe, expect, it } from 'vitest';
import { copy, copyLines, copyText, loadCopy } from './copy';

type LoadedCopy = { shared: { navigation: { items: unknown[] } }; home: { seo: { title: string } } };

describe('editorial copy', () => {
  it('loads the declared locale without a fallback', () => {
    expect(loadCopy('en-GB').shared).toBeDefined();
    expect(() => loadCopy('es-ES')).toThrow('Unknown copy locale');
  });

  it('provides validated shared navigation and home SEO copy', () => {
    const loaded = copy as unknown as LoadedCopy;
    expect(loaded.shared.navigation.items).toHaveLength(4);
    expect(loaded.home.seo.title).toContain('Paperseal');
  });

  it('supports only controlled interpolation and readable line breaks', () => {
    expect(copyText('© {year} Paperseal', { year: 2026 })).toBe('© 2026 Paperseal');
    expect(copyLines('Places worth keeping.\nPrints made to live with.')).toEqual([
      'Places worth keeping.',
      'Prints made to live with.',
    ]);
    expect(copyText('Hello {missing}')).toBe('Hello {missing}');
  });
});
