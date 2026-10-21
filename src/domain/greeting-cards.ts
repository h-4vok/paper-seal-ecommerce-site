import generatedGreetingCards from '../data/greeting-cards.json';
import { productPagePath } from './product-families';

export interface GreetingCard {
  family: 'greeting-card';
  sku: string;
  title: string;
  handle: string;
  description: string;
  placeName: string;
  publishedOrder: number;
  collections: string[];
  orientation: 'landscape';
  alt: string;
  assetBase: string;
  watermark: 'standard' | 'high-contrast';
  imageDimensions: { width: number; height: number };
  price: number;
  dimensions: { closed: { width: number; height: number; unit: 'inches' } };
  included: { envelope: boolean; packaging: string };
}

export type GreetingCardSide = 'front' | 'back';

export function validateGreetingCards(input: unknown): GreetingCard[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('Greeting-card catalogue must contain at least one product.');
  }
  const handles = new Set<string>();
  const skus = new Set<string>();
  return input.map((candidate, index) => {
    if (!candidate || typeof candidate !== 'object') {
      throw new Error(`Greeting card ${index + 1} must be an object.`);
    }
    const item = candidate as Record<string, unknown>;
    for (const field of [
      'sku',
      'title',
      'handle',
      'description',
      'placeName',
      'alt',
      'assetBase',
    ]) {
      if (typeof item[field] !== 'string' || item[field].trim() === '') {
        throw new Error(`Greeting card ${index + 1} has an invalid ${field}.`);
      }
    }
    if (item.family !== 'greeting-card') {
      throw new Error(`Greeting card ${index + 1} has an invalid family.`);
    }
    if (!/^PS-[A-Z]{2,4}-\d{3}$/.test(item.sku as string)) {
      throw new Error(`Greeting card ${index + 1} has an invalid sku.`);
    }
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.handle as string) ||
      !(item.handle as string).endsWith(`-${(item.sku as string).toLowerCase()}`)
    ) {
      throw new Error(`Greeting card ${index + 1} has an invalid handle.`);
    }
    if (handles.has(item.handle as string) || skus.has(item.sku as string)) {
      throw new Error(`Greeting card ${index + 1} duplicates a stable identifier.`);
    }
    if (
      !Number.isInteger(item.publishedOrder) ||
      (item.publishedOrder as number) < 0 ||
      !Array.isArray(item.collections) ||
      item.collections.some((value) => typeof value !== 'string') ||
      item.orientation !== 'landscape' ||
      !['standard', 'high-contrast'].includes(item.watermark as string) ||
      !Number.isFinite(item.price) ||
      Number(item.price) <= 0
    ) {
      throw new Error(`Greeting card ${index + 1} has invalid catalogue values.`);
    }
    const dimensions = item.dimensions as Record<string, unknown> | undefined;
    const closed = dimensions?.closed as Record<string, unknown> | undefined;
    const included = item.included as Record<string, unknown> | undefined;
    const imageDimensions = item.imageDimensions as Record<string, unknown> | undefined;
    if (
      !closed ||
      closed.width !== 6 ||
      closed.height !== 4 ||
      closed.unit !== 'inches' ||
      !included ||
      typeof included.envelope !== 'boolean' ||
      typeof included.packaging !== 'string' ||
      !imageDimensions ||
      imageDimensions.width !== 720 ||
      imageDimensions.height !== 540
    ) {
      throw new Error(`Greeting card ${index + 1} has invalid product specifications.`);
    }
    handles.add(item.handle as string);
    skus.add(item.sku as string);
    return item as unknown as GreetingCard;
  });
}

export const greetingCards = validateGreetingCards(generatedGreetingCards.greetingCards);

export function greetingCardImagePath(
  card: GreetingCard,
  image: 'search' | 'perspective' | GreetingCardSide,
  width: 720 | 1440 = 1440,
): string {
  const imageName =
    image === 'perspective'
      ? 'mockup-perspective'
      : image === 'front'
        ? 'flat-front'
        : image === 'back'
          ? 'flat-back'
          : 'search';
  return `/images/greeting-cards/${card.assetBase}/${imageName}-${width}.jpg`;
}

export function greetingCardPagePath(card: GreetingCard): string {
  return productPagePath(card.family, card.handle);
}

export function greetingCardSnipcartAttributes(card: GreetingCard, image: string) {
  return {
    'data-item-id': card.sku,
    'data-item-description': card.description,
    'data-item-name': card.title,
    'data-item-image': image,
    'data-item-url': greetingCardPagePath(card),
    'data-item-price': card.price.toFixed(2),
  };
}

export function greetingCardStructuredData(card: GreetingCard, canonical: string, image: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: card.title,
    description: card.description,
    image,
    url: canonical,
    sku: card.sku,
    category: 'Greeting card',
    brand: { '@type': 'Brand', name: 'The Paper Seal Studio' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'GBP',
      price: card.price.toFixed(2),
      url: canonical,
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}
