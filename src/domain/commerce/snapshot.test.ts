import { describe, expect, it } from 'vitest';
import { commerceSnapshotSchema, productSnapshotSchema } from './snapshot';

const product = {
  id: 'gid://shopify/Product/1',
  handle: 'sample',
  title: 'Sample',
  description: 'Sample product',
  availableForSale: true,
  price: { amount: '10.00', currencyCode: 'GBP' },
  updatedAt: '2026-09-17T00:00:00.000Z',
};

describe('commerce snapshot schemas', () => {
  it('accepts a versioned product', () =>
    expect(productSnapshotSchema.parse(product)).toEqual(product));
  it('accepts an empty versioned snapshot', () => {
    expect(
      commerceSnapshotSchema.parse({
        schemaVersion: 1,
        generatedAt: product.updatedAt,
        products: [],
      }),
    ).toBeTruthy();
  });
});
