import { afterEach, describe, expect, it, vi } from 'vitest';
import availability, { mapAvailability } from './availability.mjs';

const product = {
  userDefinedId: 'PS-PR-001',
  inventoryManagementMethod: 'Variant',
  allowOutOfStockPurchases: false,
  variants: [
    { variation: [{ name: 'Size', option: 'Small' }], stock: 2, allowOutOfStockPurchases: false },
    { variation: [{ name: 'Size', option: 'Medium' }], stock: 0, allowOutOfStockPurchases: false },
    { variation: [{ name: 'Size', option: 'Large' }], stock: 1, allowOutOfStockPurchases: false },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.SNIPCART_SECRET_API_KEY;
});

describe('Snipcart availability', () => {
  it('maps only sellable size variants and keeps missing stock unavailable', () => {
    expect(mapAvailability([product, { ...product, userDefinedId: 'PS-GC-001' }])).toEqual({
      'PS-PR-001': { Small: 2, Medium: 0, Large: 1 },
    });
    expect(
      mapAvailability([
        { ...product, variants: [{ ...product.variants[0], allowOutOfStockPurchases: true }] },
      ]),
    ).toEqual({ 'PS-PR-001': {} });
  });

  it('fails closed without a private key', async () => {
    const response = await availability();
    expect(response.status).toBe(503);
    expect(response.headers.get('Netlify-CDN-Cache-Control')).toBeNull();
  });

  it('paginates and returns only public stock data', async () => {
    process.env.SNIPCART_SECRET_API_KEY = 'test-only';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ totalItems: 2, items: [product] }))
      .mockResolvedValueOnce(
        Response.json({ totalItems: 2, items: [{ ...product, userDefinedId: 'PS-PR-002' }] }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const response = await availability();
    expect(response.status).toBe(200);
    expect(response.headers.get('Netlify-CDN-Cache-Control')).toContain('durable');
    expect(fetchMock.mock.calls[1][0]).toContain('offset=1');
    expect(await response.json()).toEqual({
      fetchedAt: expect.any(Number),
      products: {
        'PS-PR-001': { Small: 2, Medium: 0, Large: 1 },
        'PS-PR-002': { Small: 2, Medium: 0, Large: 1 },
      },
    });
  });

  it('rejects incomplete upstream data without caching it', async () => {
    process.env.SNIPCART_SECRET_API_KEY = 'test-only';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ totalItems: 1, items: [] })));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await availability();
    expect(response.status).toBe(502);
    expect(response.headers.get('Netlify-CDN-Cache-Control')).toBeNull();
    vi.restoreAllMocks();
  });
});
