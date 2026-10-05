import { z } from 'zod';

const envSchema = z.object({
  SHOPIFY_STORE_DOMAIN: z.url().optional(),
  SHOPIFY_STOREFRONT_TOKEN: z.string().min(1).optional(),
  PUBLIC_UMAMI_WEBSITE_ID: z.string().min(1).optional(),
  PUBLIC_SNIPCART_TEST_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(import.meta.env);
