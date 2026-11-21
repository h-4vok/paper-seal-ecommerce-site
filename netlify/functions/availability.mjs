const stockHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'public, durable, max-age=60',
};

export function mapAvailability(items) {
  const products = {};
  for (const product of items) {
    if (!product.userDefinedId?.startsWith('PS-PR-') || product.archived) continue;
    const sizes = {};
    if (product.inventoryManagementMethod === 'Variant' && !product.allowOutOfStockPurchases) {
      for (const variant of product.variants ?? []) {
        const size = variant.variation?.find((field) => field.name === 'Size')?.option;
        if (
          ['Small', 'Medium', 'Large'].includes(size) &&
          variant.variation.length === 1 &&
          Number.isInteger(variant.stock) &&
          variant.stock >= 0 &&
          variant.allowOutOfStockPurchases === false
        )
          sizes[size] = variant.stock;
      }
    }
    products[product.userDefinedId] = sizes;
  }
  return products;
}

export default async () => {
  const key = process.env.SNIPCART_SECRET_API_KEY;
  if (!key) return Response.json({ error: 'Availability is not configured.' }, { status: 503 });

  try {
    const items = [];
    let totalItems;
    do {
      const response = await fetch(
        `https://app.snipcart.com/api/products?limit=50&offset=${items.length}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`,
          },
        },
      );
      if (!response.ok) throw new Error(`Snipcart returned ${response.status}.`);
      const page = await response.json();
      if (!Array.isArray(page.items) || !Number.isInteger(page.totalItems)) {
        throw new Error('Invalid Snipcart products response.');
      }
      if (page.items.length === 0 && items.length < page.totalItems) {
        throw new Error('Incomplete Snipcart products response.');
      }
      items.push(...page.items);
      totalItems = page.totalItems;
    } while (items.length < totalItems);
    return Response.json(
      { fetchedAt: Date.now(), products: mapAvailability(items) },
      { headers: stockHeaders },
    );
  } catch (error) {
    console.error('Could not load Snipcart availability:', error);
    return Response.json({ error: 'Availability could not be loaded.' }, { status: 502 });
  }
};

export const config = { path: '/api/availability' };
