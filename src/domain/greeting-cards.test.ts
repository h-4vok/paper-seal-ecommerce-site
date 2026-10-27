import { describe, expect, it } from 'vitest';
import {
  greetingCards,
  greetingCardImagePath,
  greetingCardPagePath,
  greetingCardSnipcartAttributes,
  greetingCardStructuredData,
  validateGreetingCards,
} from './greeting-cards';
import { pageArchetypeForFamily, productFamilyRegistry } from './product-families';

const card = greetingCards[0];

describe('greeting-card product family', () => {
  it('loads the Bodiam card with its approved product details', () => {
    expect(card).toMatchObject({
      family: 'greeting-card',
      sku: 'PS-GC-001',
      handle: 'bodiam-castle-greeting-card-ps-gc-001',
      showInProductSearch: true,
      showInCommissions: false,
      price: 2,
      dimensions: { closed: { width: 6, height: 4, unit: 'inches' } },
      included: { envelope: true, packaging: 'clear cellophane sleeve' },
    });
    expect(validateGreetingCards([card])).toEqual([card]);
  });

  it('defaults visibility for greeting-card data created before the optional fields existed', () => {
    const legacyCard = { ...card } as Record<string, unknown>;
    delete legacyCard.showInProductSearch;
    delete legacyCard.showInCommissions;

    expect(validateGreetingCards([legacyCard])[0]).toMatchObject({
      showInProductSearch: true,
      showInCommissions: false,
    });
  });

  it.each([
    [null, 'must be an object'],
    [{ ...card, title: '' }, 'invalid title'],
    [{ ...card, family: 'artwork' }, 'invalid family'],
    [{ ...card, sku: 'bad' }, 'invalid sku'],
    [{ ...card, handle: 'bad-handle' }, 'invalid handle'],
    [{ ...card, handle: 'different-ps-gc-002' }, 'invalid handle'],
    [{ ...card, publishedOrder: -1 }, 'invalid catalogue values'],
    [{ ...card, collections: [3] }, 'invalid catalogue values'],
    [{ ...card, orientation: 'portrait' }, 'invalid catalogue values'],
    [{ ...card, watermark: 'none' }, 'invalid catalogue values'],
    [{ ...card, showInProductSearch: 'yes' }, 'invalid showInProductSearch'],
    [{ ...card, showInCommissions: 1 }, 'invalid showInCommissions'],
    [{ ...card, price: 0 }, 'invalid catalogue values'],
    [
      { ...card, dimensions: { closed: { width: 5, height: 4, unit: 'inches' } } },
      'invalid product specifications',
    ],
    [{ ...card, included: { envelope: true, packaging: 3 } }, 'invalid product specifications'],
    [{ ...card, imageDimensions: { width: 100, height: 50 } }, 'invalid product specifications'],
  ])('rejects invalid product data %j', (invalid, message) => {
    expect(() => validateGreetingCards([invalid])).toThrow(message);
  });

  it('rejects missing catalogues and duplicate stable identifiers', () => {
    expect(() => validateGreetingCards(null)).toThrow('must contain at least one product');
    expect(() => validateGreetingCards([])).toThrow('must contain at least one product');
    expect(() => validateGreetingCards([card, card])).toThrow('duplicates a stable identifier');
  });

  it('uses family routes and page archetypes independently', () => {
    expect(greetingCardPagePath(card)).toBe(
      '/greeting-cards/bodiam-castle-greeting-card-ps-gc-001',
    );
    expect(pageArchetypeForFamily('greeting-card')).toBe('greeting-card-detail');
    expect(pageArchetypeForFamily('artwork')).toBe('artwork-detail');
    expect(productFamilyRegistry.artwork.searchWatermark).toBe(true);
    expect(productFamilyRegistry['greeting-card'].searchWatermark).toBe(false);
    expect(
      Object.values(productFamilyRegistry).every(({ pageArchetype }) =>
        ['artwork-detail', 'greeting-card-detail'].includes(pageArchetype),
      ),
    ).toBe(true);
  });

  it('builds separate front, back, perspective and 4:3 search asset paths', () => {
    expect(greetingCardImagePath(card, 'front', 720)).toBe(
      '/images/greeting-cards/bodiam-castle/flat-front-720.jpg',
    );
    expect(greetingCardImagePath(card, 'back', 1440)).toBe(
      '/images/greeting-cards/bodiam-castle/flat-back-1440.jpg',
    );
    expect(greetingCardImagePath(card, 'perspective', 1440)).toBe(
      '/images/greeting-cards/bodiam-castle/mockup-perspective-1440.jpg',
    );
    expect(greetingCardImagePath(card, 'search', 720)).toBe(
      '/images/greeting-cards/bodiam-castle/search-720.jpg',
    );
  });

  it('uses the fixed £2 price as a single Snipcart item without options', () => {
    expect(greetingCardSnipcartAttributes(card, greetingCardImagePath(card, 'search'))).toEqual({
      'data-item-id': 'PS-GC-001',
      'data-item-description': card.description,
      'data-item-name': 'Bodiam Castle',
      'data-item-image': '/images/greeting-cards/bodiam-castle/search-1440.jpg',
      'data-item-url': '/greeting-cards/bodiam-castle-greeting-card-ps-gc-001',
      'data-item-price': '2.00',
    });
  });

  it('includes the card price and canonical route in product structured data', () => {
    expect(
      greetingCardStructuredData(card, 'https://paperseal.uk/greeting-cards/bodiam', '/card.jpg'),
    ).toMatchObject({
      '@type': 'Product',
      sku: card.sku,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'GBP',
        price: '2.00',
        url: 'https://paperseal.uk/greeting-cards/bodiam',
      },
    });
  });
});
