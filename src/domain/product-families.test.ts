import { describe, expect, it } from 'vitest';
import { productFamilyFromQuery } from './product-families';

describe('product family selection', () => {
  it('defaults unknown or missing query values to artworks', () => {
    expect(productFamilyFromQuery(null)).toBe('artwork');
    expect(productFamilyFromQuery('unknown')).toBe('artwork');
  });

  it('restores greeting cards from a shared catalogue URL', () => {
    expect(productFamilyFromQuery('greeting-card')).toBe('greeting-card');
  });
});
