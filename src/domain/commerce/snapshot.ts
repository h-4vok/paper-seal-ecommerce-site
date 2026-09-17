import { z } from 'zod';

export const productSnapshotSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string(),
  availableForSale: z.boolean(),
  price: z.object({ amount: z.string(), currencyCode: z.string() }),
  updatedAt: z.string(),
});

export const commerceSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  products: z.array(productSnapshotSchema),
});

export type CommerceSnapshot = z.infer<typeof commerceSnapshotSchema>;
