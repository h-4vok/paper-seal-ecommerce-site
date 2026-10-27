export type ProductFamily = 'artwork' | 'greeting-card';
export type ProductPageArchetype = 'artwork-detail' | 'greeting-card-detail';

export function productFamilyFromQuery(value: string | null): ProductFamily {
  return value === 'greeting-card' ? 'greeting-card' : 'artwork';
}

/**
 * Product families choose a route and a page archetype independently. More
 * than one family can point to the same archetype as the catalogue grows.
 */
export const productFamilyRegistry = {
  artwork: {
    routeBase: '/artworks',
    pageArchetype: 'artwork-detail',
    searchWatermark: true,
  },
  'greeting-card': {
    routeBase: '/greeting-cards',
    pageArchetype: 'greeting-card-detail',
    searchWatermark: false,
  },
} as const satisfies Record<
  ProductFamily,
  { routeBase: string; pageArchetype: ProductPageArchetype; searchWatermark: boolean }
>;

export function productPagePath(family: ProductFamily, handle: string): string {
  return `${productFamilyRegistry[family].routeBase}/${handle}`;
}

export function pageArchetypeForFamily(family: ProductFamily): ProductPageArchetype {
  return productFamilyRegistry[family].pageArchetype;
}
