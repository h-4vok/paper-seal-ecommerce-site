import generatedCatalogue from '../data/artworks.json';

export type Orientation = 'landscape' | 'portrait';
export type GalleryKind = 'flat' | 'room';

export interface Artwork {
  artworkCode: string;
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
}

export interface CatalogueState {
  query: string;
  place: string;
  sort: 'newest' | 'title';
}

export const PRINT_SIZES = [
  { id: 'small', label: 'Small', dimensions: '17.8 × 12.7 cm · 7 × 5 in' },
  { id: 'medium', label: 'Medium', dimensions: '21 × 29.7 cm · 8.27 × 11.69 in' },
  { id: 'large', label: 'Large', dimensions: '29.7 × 42 cm · 11.69 × 16.54 in' },
] as const;

export const FRAMING_OPTIONS = [
  { id: 'unframed', label: 'Unframed' },
  { id: 'framed', label: 'Framed' },
] as const;

const requiredText = [
  'artworkCode',
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

  const codes = new Set<string>();
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
    if (!/^PS-\d{3}$/.test(item.artworkCode as string)) {
      throw new Error(`Artwork ${index + 1} has an invalid artworkCode.`);
    }
    if (!/^[a-z0-9-]+-ps-\d{3}$/.test(item.handle as string)) {
      throw new Error(`Artwork ${index + 1} has an invalid handle.`);
    }
    if (codes.has(item.artworkCode as string) || handles.has(item.handle as string)) {
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
    if (
      !Array.isArray(item.gallery) ||
      item.gallery.length === 0 ||
      item.gallery.some((kind) => !['flat', 'room'].includes(String(kind)))
    ) {
      throw new Error(`Artwork ${index + 1} has an invalid gallery.`);
    }
    codes.add(item.artworkCode as string);
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
      artwork.artworkCode,
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
      : right.publishedOrder - left.publishedOrder ||
        left.artworkCode.localeCompare(right.artworkCode),
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
    sku: artwork.artworkCode,
    category: 'Fine art print',
    brand: { '@type': 'Brand', name: 'Paperseal' },
  };
}
