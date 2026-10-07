import { describe, expect, it } from 'vitest';
import {
  artworkMatches,
  artworks,
  filterCatalogue,
  formatPrice,
  galleryIndex,
  nextVisibleCount,
  normalizeSearch,
  productStructuredData,
  snipcartItemAttributes,
  validateCatalogue,
} from './catalogue';

describe('catalogue model', () => {
  it('validates the committed catalogue and product presentation constants', () => {
    expect(artworks).toHaveLength(16);
    expect(new Set(artworks.map(({ sku }) => sku)).size).toBe(16);
  });

  it('maps artwork prices to Snipcart base price and size modifiers', () => {
    const artwork = artworks[0];
    const image = `/images/artworks/${artwork.assetBase}/room-1440.jpg`;
    const url = `/artworks/${artwork.handle}`;

    expect(snipcartItemAttributes(artwork, image, url)).toEqual({
      'data-item-id': artwork.sku,
      'data-item-description': artwork.description,
      'data-item-name': artwork.title,
      'data-item-image': image,
      'data-item-url': url,
      'data-item-price': '7.00',
      'data-item-custom1-name': 'Size',
      'data-item-custom1-options': 'Small|Medium[+7.00]|Large[+21.00]',
    });
  });

  it('formats selected product prices to two decimal places', () => {
    expect(formatPrice(14)).toBe('14.00');
    expect(formatPrice(8.5)).toBe('8.50');
  });

  it.each([
    [null, 'Catalogue must contain'],
    [[], 'Catalogue must contain'],
    [[null], 'must be an object'],
    [[{ ...artworks[0], title: '' }], 'invalid title'],
    [[{ ...artworks[0], sku: 'bad' }], 'invalid sku'],
    [[{ ...artworks[0], handle: 'Bad Handle' }], 'invalid handle'],
    [[{ ...artworks[0], publishedOrder: -1 }], 'invalid publishedOrder'],
    [[{ ...artworks[0], collections: [1] }], 'invalid collections'],
    [[{ ...artworks[0], orientation: 'square' }], 'invalid orientation'],
    [[{ ...artworks[0], gallery: [] }], 'invalid gallery'],
    [[{ ...artworks[0], gallery: ['master'] }], 'invalid gallery'],
    [[{ ...artworks[0], price: { small: 7, medium: -1, large: 28 } }], 'invalid price'],
    [[{ ...artworks[0], price: { small: 7, medium: 14 } }], 'invalid price'],
    [[artworks[0], { ...artworks[0], title: 'Duplicate' }], 'duplicates'],
    [[artworks[0], { ...artworks[1], sku: artworks[0].sku }], 'duplicates'],
  ])('rejects invalid data %#', (input, message) => {
    expect(() => validateCatalogue(input)).toThrow(message as string);
  });

  it('normalizes and fuzzy-matches useful local metadata', () => {
    expect(normalizeSearch('  Seven—Sísters  ')).toBe('seven sisters');
    expect(artworkMatches(artworks[1], 'svn sstrs')).toBe(true);
    expect(artworkMatches(artworks[1], 'PS-PR-002')).toBe(true);
    expect(artworkMatches(artworks[1], 'Harbour')).toBe(false);
    expect(artworkMatches(artworks[0], '')).toBe(true);
  });

  it('filters and sorts a local catalogue for every filter state', () => {
    const items = [
      {
        sku: 'PS-PR-003',
        title: 'Zebra Coast',
        handle: 'zebra-coast-ps-003',
        description: 'A coastal study.',
        placeName: 'Brighton',
        publishedOrder: 2,
        collections: ['coast'],
        orientation: 'landscape',
        alt: 'Zebra Coast artwork',
        assetBase: '/artworks/zebra-coast',
        gallery: ['flat'],
      },
      {
        sku: 'PS-PR-002',
        title: 'Amber Harbour',
        handle: 'amber-harbour-ps-002',
        description: 'A harbour study.',
        placeName: 'Brighton',
        publishedOrder: 2,
        collections: ['harbour'],
        orientation: 'portrait',
        alt: 'Amber Harbour artwork',
        assetBase: '/artworks/amber-harbour',
        gallery: ['room'],
      },
      {
        sku: 'PS-PR-001',
        title: 'Quiet Moor',
        handle: 'quiet-moor-ps-001',
        description: 'A moorland study.',
        placeName: 'Yorkshire',
        publishedOrder: 1,
        collections: ['moor'],
        orientation: 'landscape',
        alt: 'Quiet Moor artwork',
        assetBase: '/artworks/quiet-moor',
        gallery: ['flat', 'room'],
      },
    ] as const;
    const catalogue = [...items] as unknown as typeof artworks;

    const allNewest = filterCatalogue(catalogue, {
      query: '',
      place: 'all',
      sort: 'newest',
    });
    expect(allNewest.map(({ sku }) => sku)).toEqual(['PS-PR-002', 'PS-PR-003', 'PS-PR-001']);
    expect(allNewest).not.toBe(catalogue);
    expect(catalogue.map(({ sku }) => sku)).toEqual(['PS-PR-003', 'PS-PR-002', 'PS-PR-001']);

    const filteredByQueryAndPlace = filterCatalogue(catalogue, {
      query: 'harbour',
      place: 'Brighton',
      sort: 'title',
    });
    expect(filteredByQueryAndPlace.map(({ sku }) => sku)).toEqual(['PS-PR-002']);

    const filteredByPlace = filterCatalogue(catalogue, {
      query: '',
      place: 'Yorkshire',
      sort: 'title',
    });
    expect(filteredByPlace.map(({ sku }) => sku)).toEqual(['PS-PR-001']);

    expect(
      filterCatalogue(catalogue, {
        query: 'not-found',
        place: 'all',
        sort: 'title',
      }),
    ).toEqual([]);
    expect(
      filterCatalogue(catalogue, {
        query: '',
        place: 'London',
        sort: 'title',
      }),
    ).toEqual([]);

    const alphabetical = filterCatalogue(catalogue, {
      query: '',
      place: 'all',
      sort: 'title',
    });
    expect(alphabetical.map(({ title }) => title)).toEqual([
      'Amber Harbour',
      'Quiet Moor',
      'Zebra Coast',
    ]);
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
    expect(data).toMatchObject({ '@type': 'Product', sku: artworks[0].sku });
    expect(data).not.toHaveProperty('offers');
    expect(JSON.stringify(data)).not.toMatch(/price|availability|review/i);
  });

  it('accepts variable local gallery lengths', () => {
    expect(validateCatalogue([{ ...artworks[0], gallery: ['room'] }])[0].gallery).toHaveLength(1);
    expect(
      validateCatalogue([{ ...artworks[0], gallery: ['room', 'flat', 'room'] }])[0].gallery,
    ).toHaveLength(3);
  });
});
