import { mkdir, writeFile } from 'node:fs/promises';
import { commerceSnapshotSchema } from '../src/domain/commerce/snapshot';

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
const endpoint = domain ? `https://${domain}/api/2025-07/graphql.json` : undefined;

if (!endpoint || !token) {
  console.log('Shopify credentials are not configured; snapshot sync skipped.');
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
  body: JSON.stringify({
    query:
      '{ products(first: 100) { nodes { id handle title description availableForSale updatedAt priceRange { minVariantPrice { amount currencyCode } } } } }',
  }),
});
if (!response.ok) throw new Error(`Shopify sync failed with HTTP ${response.status}`);
const payload = await response.json();
const products = (payload.data?.products?.nodes ?? []).map((product: Record<string, unknown>) => ({
  ...product,
  price: product.priceRange && (product.priceRange as { minVariantPrice: unknown }).minVariantPrice,
}));
const snapshot = commerceSnapshotSchema.parse({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  products,
});
await mkdir('data/shopify', { recursive: true });
await writeFile('data/shopify/products.snapshot.json', `${JSON.stringify(snapshot, null, 2)}\n`);
