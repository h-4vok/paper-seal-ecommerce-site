import { z } from 'zod';

const envSchema = z.object({
  // Shopify values are retained for the optional legacy sync script only. They
  // must not be parsed during an Astro build now that storefront commerce uses Snipcart.
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_STOREFRONT_TOKEN: z.string().optional(),
  PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),
  PUBLIC_UMAMI_URL: z.string().optional(),
  PUBLIC_SNIPCART_TEST_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(import.meta.env);
