import { describe, expect, it } from 'vitest';
import { siteCopy } from './site-copy';

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
});
