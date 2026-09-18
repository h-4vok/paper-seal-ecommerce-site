import { describe, expect, it } from 'vitest';
import {
  FRAMING_OPTIONS,
  PRINT_SIZES,
  artworkMatches,
  artworks,
  filterCatalogue,
  galleryIndex,
  nextVisibleCount,
  normalizeSearch,
  productStructuredData,
  validateCatalogue,
} from './catalogue';

describe('catalogue model', () => {
  it('validates the committed catalogue and product presentation constants', () => {
    expect(artworks).toHaveLength(17);
    expect(new Set(artworks.map(({ artworkCode }) => artworkCode)).size).toBe(17);
    expect(PRINT_SIZES.map(({ dimensions }) => dimensions)).toEqual([
      '17.8 × 12.7 cm · 7 × 5 in',
      '21 × 29.7 cm · 8.27 × 11.69 in',
      '29.7 × 42 cm · 11.69 × 16.54 in',
    ]);
    expect(FRAMING_OPTIONS.map(({ label }) => label)).toEqual(['Unframed', 'Framed']);
  });

  it.each([
    [null, 'Catalogue must contain'],
    [[], 'Catalogue must contain'],
    [[null], 'must be an object'],
    [[{ ...artworks[0], title: '' }], 'invalid title'],
    [[{ ...artworks[0], artworkCode: 'bad' }], 'invalid artworkCode'],
    [[{ ...artworks[0], handle: 'bad' }], 'invalid handle'],
    [[{ ...artworks[0], publishedOrder: -1 }], 'invalid publishedOrder'],
    [[{ ...artworks[0], collections: [1] }], 'invalid collections'],
    [[{ ...artworks[0], orientation: 'square' }], 'invalid orientation'],
    [[{ ...artworks[0], gallery: [] }], 'invalid gallery'],
    [[{ ...artworks[0], gallery: ['master'] }], 'invalid gallery'],
    [[artworks[0], { ...artworks[0], title: 'Duplicate' }], 'duplicates'],
  ])('rejects invalid data %#', (input, message) => {
    expect(() => validateCatalogue(input)).toThrow(message as string);
  });

  it('normalizes and fuzzy-matches useful local metadata', () => {
    expect(normalizeSearch('  Seven—Sísters  ')).toBe('seven sisters');
    expect(artworkMatches(artworks[1], 'svn sstrs')).toBe(true);
    expect(artworkMatches(artworks[1], 'Harbour')).toBe(false);
    expect(artworkMatches(artworks[0], '')).toBe(true);
  });

  it('combines place, query and deterministic sort', () => {
    const eastbourne = filterCatalogue(artworks, {
      query: 'sea',
      place: 'Eastbourne',
      sort: 'title',
    });
    expect(eastbourne.map(({ title }) => title)).toEqual([
      'Beach Huts, Eastbourne',
      'Eastbourne Sunset',
      'Flower Bed',
      'Meet Me in Eastbourne',
    ]);
    expect(filterCatalogue(artworks, { query: 'zzzz', place: 'all', sort: 'newest' })).toEqual([]);
    expect(filterCatalogue(artworks, { query: '', place: 'all', sort: 'newest' })[0].title).toBe(
      'South Downs I',
    );
    const tied = [
      { ...artworks[0], artworkCode: 'PS-020', publishedOrder: 1 },
      { ...artworks[1], artworkCode: 'PS-010', publishedOrder: 1 },
    ];
    expect(
      filterCatalogue(tied, { query: '', place: 'all', sort: 'newest' }).map(
        ({ artworkCode }) => artworkCode,
      ),
    ).toEqual(['PS-010', 'PS-020']);
  });

  it('advances progressive content safely', () => {
    expect(nextVisibleCount(4, 7)).toBe(7);
    expect(nextVisibleCount(-2, -1, 0)).toBe(0);
  });

  it('wraps gallery state and emits no commerce claims in structured data', () => {
    expect(galleryIndex(2, 3, 1)).toBe(0);
    expect(galleryIndex(0, 3, -1)).toBe(2);
    expect(galleryIndex(0, 0, 1)).toBe(0);
    const data = productStructuredData(artworks[0], 'https://paperseal.co.uk/a', '/image.jpg');
    expect(data).toMatchObject({ '@type': 'Product', sku: 'PS-001' });
    expect(data).not.toHaveProperty('offers');
    expect(JSON.stringify(data)).not.toMatch(/price|availability|review/i);
  });

  it('accepts variable local gallery lengths', () => {
    expect(validateCatalogue([{ ...artworks[0], gallery: ['room'] }])[0].gallery).toHaveLength(1);
    expect(
      validateCatalogue([
        { ...artworks[0], gallery: ['room', 'flat', 'room'] },
      ])[0].gallery,
    ).toHaveLength(3);
  });
});
