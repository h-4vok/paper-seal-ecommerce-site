import generatedCatalogue from '../data/artworks.json';

export type Orientation = 'landscape' | 'portrait';
export type GalleryKind = 'flat' | 'room';
export type ArtworkSize = 'small' | 'medium' | 'large';

export interface ArtworkPrices {
  small: number;
  medium: number;
  large: number;
}

export interface Artwork {
  sku: string;
  title: string;
  handle: string;
  description: string;
  placeName: string;
  publishedOrder: number;
  collections: string[];
  orientation: Orientation;
  alt: string;
  assetBase: string;
  gallery: GalleryKind[];
  price: ArtworkPrices;
}

export function formatPrice(amount: number): string {
  return amount.toFixed(2);
}

export function snipcartSizeOptions(prices: ArtworkPrices): string {
  return [
    `Small`,
    `Medium[+${formatPrice(prices.medium - prices.small)}]`,
    `Large[+${formatPrice(prices.large - prices.small)}]`,
  ].join('|');
}

export function snipcartItemAttributes(artwork: Artwork, image: string, url: string) {
  return {
    'data-item-id': artwork.sku,
    'data-item-description': artwork.description,
    'data-item-name': artwork.title,
    'data-item-image': image,
    'data-item-url': url,
    'data-item-price': formatPrice(artwork.price.small),
    'data-item-custom1-name': 'Size',
    'data-item-custom1-options': snipcartSizeOptions(artwork.price),
  };
}

export interface CatalogueState {
  query: string;
  place: string;
  sort: 'newest' | 'title';
}

const requiredText = [
  'sku',
  'title',
  'handle',
  'description',
  'placeName',
  'alt',
  'assetBase',
] as const;

export function validateCatalogue(input: unknown): Artwork[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('Catalogue must contain at least one artwork.');
  }

  const skus = new Set<string>();
  const handles = new Set<string>();
  return input.map((candidate, index) => {
    if (!candidate || typeof candidate !== 'object') {
      throw new Error(`Artwork ${index + 1} must be an object.`);
    }
    const item = candidate as Record<string, unknown>;
    for (const field of requiredText) {
      if (typeof item[field] !== 'string' || item[field].trim() === '') {
        throw new Error(`Artwork ${index + 1} has an invalid ${field}.`);
      }
    }
    if (!/^PS-PR-\d{3}$/.test(item.sku as string)) {
      throw new Error(`Artwork ${index + 1} has an invalid sku.`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.handle as string)) {
      throw new Error(`Artwork ${index + 1} has an invalid handle.`);
    }
    if (skus.has(item.sku as string) || handles.has(item.handle as string)) {
      throw new Error(`Artwork ${index + 1} duplicates a stable identifier.`);
    }
    if (!Number.isInteger(item.publishedOrder) || (item.publishedOrder as number) < 0) {
      throw new Error(`Artwork ${index + 1} has an invalid publishedOrder.`);
    }
    if (
      !Array.isArray(item.collections) ||
      item.collections.some((value) => typeof value !== 'string')
    ) {
      throw new Error(`Artwork ${index + 1} has invalid collections.`);
    }
    if (item.orientation !== 'landscape' && item.orientation !== 'portrait') {
      throw new Error(`Artwork ${index + 1} has an invalid orientation.`);
    }
    const price = item.price as Record<string, unknown> | undefined;
    if (
      !price ||
      ['small', 'medium', 'large'].some(
        (size) => !Number.isFinite(price[size]) || Number(price[size]) <= 0,
      )
    ) {
      throw new Error(`Artwork ${index + 1} has invalid price values.`);
    }
    if (
      !Array.isArray(item.gallery) ||
      item.gallery.length === 0 ||
      item.gallery.some((kind) => !['flat', 'room'].includes(String(kind)))
    ) {
      throw new Error(`Artwork ${index + 1} has an invalid gallery.`);
    }
    skus.add(item.sku as string);
    handles.add(item.handle as string);
    return item as unknown as Artwork;
  });
}

export const artworks = validateCatalogue(generatedCatalogue.artworks);

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-GB')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function fuzzyIncludes(haystack: string, needle: string): boolean {
  if (haystack.includes(needle)) return true;
  return haystack.split(' ').some((word) => {
    let cursor = 0;
    for (const character of word) {
      if (character === needle[cursor]) cursor += 1;
      if (cursor === needle.length) return true;
    }
    return false;
  });
}

export function artworkMatches(artwork: Artwork, query: string): boolean {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  const searchable = normalizeSearch(
    [
      artwork.title,
      artwork.placeName,
      artwork.description,
      artwork.sku,
      ...artwork.collections,
    ].join(' '),
  );
  return normalizedQuery.split(' ').every((token) => fuzzyIncludes(searchable, token));
}

export function filterCatalogue(items: Artwork[], state: CatalogueState): Artwork[] {
  const filtered = items.filter(
    (artwork) =>
      artworkMatches(artwork, state.query) &&
      (state.place === 'all' || artwork.placeName === state.place),
  );
  return [...filtered].sort((left, right) =>
    state.sort === 'title'
      ? left.title.localeCompare(right.title, 'en-GB')
      : right.publishedOrder - left.publishedOrder || left.sku.localeCompare(right.sku),
  );
}

export function nextVisibleCount(current: number, total: number, step = 4): number {
  return Math.min(Math.max(current, 0) + Math.max(step, 1), Math.max(total, 0));
}

export function galleryIndex(current: number, length: number, direction: 1 | -1): number {
  if (length <= 0) return 0;
  return (current + direction + length) % length;
}

export function productStructuredData(artwork: Artwork, canonical: string, image: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: artwork.title,
    description: artwork.description,
    image,
    url: canonical,
    sku: artwork.sku,
    category: 'Fine art print',
    brand: { '@type': 'Brand', name: 'The Paper Seal Studio' },
  };
}
