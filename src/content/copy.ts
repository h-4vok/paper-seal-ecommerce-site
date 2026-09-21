import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const text = z.string().min(1);
const lines = z
  .string()
  .min(1)
  .transform((value) => value.split('\n'));
const navigation = z.object({
  primaryLabel: text,
  items: z.array(z.object({ href: z.string().startsWith('/'), key: text, label: text })).min(1),
  cartLabel: text,
  openMenu: text,
  closeMenu: text,
  explore: text,
  mobileLabel: text,
  contact: text,
  mobileIntro: text,
});
const sharedSchema = z.object({
  skipLink: text,
  brand: z.object({
    name: text,
    region: text,
    homeAriaLabel: text,
    descriptor: text,
    headerNote: lines,
  }),
  navigation,
  footer: z.object({
    eyebrow: text,
    statement: lines,
    explore: text,
    allArtworks: text,
    ourStory: text,
    goodToKnow: text,
    delivery: text,
    returns: text,
    contact: text,
    smallPrint: text,
    privacy: text,
    terms: text,
    copyright: text,
    strapline: text,
  }),
});
const homeSchema = z.object({
  seo: z.object({ title: text, description: text }),
  hero: z.object({
    eyebrow: text,
    heading: text,
    intro: text,
    cta: text,
    imageAlt: text,
    caption: text,
    note: text,
  }),
  promise: z.object({
    label: text,
    items: z.array(z.object({ icon: text, heading: text, body: text })).length(4),
  }),
  manifesto: z.object({
    eyebrow: text,
    heading: text,
    paragraphs: z.array(text).length(2),
    stamp: text,
  }),
  collection: z.object({
    eyebrow: text,
    heading: lines,
    intro: text,
    view: text,
    beachHuts: text,
    harbour: text,
    place: text,
  }),
  browse: z.object({ eyebrow: text, heading: lines, cta: text, annotation: lines }),
  process: z.object({
    eyebrow: text,
    heading: text,
    body: text,
    cta: text,
    steps: z.array(z.object({ number: text, heading: text, body: text })).length(3),
  }),
});
const catalogueSchema = z.object({
  seo: z.object({ title: text, description: text }),
  aside: z.object({
    sealName: text,
    label: text,
    all: text,
    softLaunch: text,
    place: text,
    eyebrow: lines,
    quote: text,
    sealLines: z.array(text).length(3),
  }),
  intro: z.object({ heading: text, eyebrow: text, copy: text }),
  controls: z.object({
    searchLabel: text,
    searchPlaceholder: text,
    placeLabel: text,
    allPlaces: text,
    availabilityLabel: text,
    availabilityBadge: text,
    availabilityNote: text,
    sortLabel: text,
    newest: text,
    title: text,
  }),
  results: z.object({
    label: text,
    countLabel: text,
    cardLink: text,
    emptyEyebrow: text,
    emptyHeading: text,
    reset: text,
  }),
});
const cartSchema = z.object({
  seo: z.object({ title: text, description: text }),
  header: z.object({ eyebrow: text, itemCount: text, heading: text }),
  empty: z.object({ title: text, copy: text, browse: text }),
  scene: z.object({ label: text, alt: text, script: text, copy: text }),
});
const productSchema = z.object({
  labels: z.object({
    breadcrumb: text,
    breadcrumbLink: text,
    gallery: text,
    openImage: text,
    previousImage: text,
    nextImage: text,
    chooseGalleryImage: text,
    showImage: text,
    placeSuffix: text,
    size: text,
    framing: text,
    selectionSuffix: text,
    noStock: text,
    commerceEyebrow: text,
    commerceCopy: text,
    shareGroup: text,
    share: text,
    copyLink: text,
    linkCopied: text,
    shareOpened: text,
    printSizes: text,
    printSizesValue: text,
    presentation: text,
    presentationValue: text,
    ordering: text,
    orderingValue: text,
    delivery: text,
    returns: text,
    lightbox: text,
  }),
  sizes: z.array(z.object({ id: text, label: text, dimensions: text })).length(3),
  framing: z.array(z.object({ id: text, label: text, detail: text })).length(2),
});
const institutionalSchema = z.object({
  statusLabel: text,
  next: z.object({ eyebrow: text, copy: text, browse: text }),
  pages: z
    .array(
      z.object({
        slug: text,
        eyebrow: text,
        heading: text,
        description: text,
        status: text.optional(),
        indexable: z.boolean(),
        sections: z.array(z.object({ heading: text, paragraphs: z.array(text).min(1) })).min(1),
      }),
    )
    .min(1),
});
const placeholderSchema = z.object({ status: text, home: text });
const storiesSchema = z.record(z.string(), text);
export const copySchemas = {
  shared: sharedSchema,
  home: homeSchema,
  catalogue: catalogueSchema,
  cart: cartSchema,
  product: productSchema,
  institutional: institutionalSchema,
  placeholder: placeholderSchema,
  stories: storiesSchema,
} as const;
const schemas = copySchemas;
const root = join(process.cwd(), 'content', 'copy');

export function validateCopyFiles(files: string[]) {
  const expected = new Set(Object.keys(schemas));
  const actual = new Set(files.map((file) => file.replace(/\.yaml$/, '')));
  const missing = [...expected].filter((key) => !actual.has(key));
  const unknown = [...actual].filter((key) => !expected.has(key));
  if (missing.length > 0) throw new Error(`Missing copy YAML files: ${missing.join(', ')}`);
  if (unknown.length > 0) throw new Error(`Unknown copy YAML files: ${unknown.join(', ')}`);
}

export function loadCopy(locale = 'en-GB') {
  const directory = join(root, locale);
  if (
    !readdirSync(root, { withFileTypes: true }).some(
      (entry) => entry.isDirectory() && entry.name === locale,
    )
  )
    throw new Error(`Unknown copy locale: ${locale}`);
  const files = readdirSync(directory)
    .filter((file) => file.endsWith('.yaml'))
    .sort();
  validateCopyFiles(files);
  return Object.fromEntries(
    files.map((file) => {
      const key = file.replace(/\.yaml$/, '') as keyof typeof schemas;
      const parsed = parse(readFileSync(join(directory, file), 'utf8'));
      return [key, schemas[key].parse(parsed)];
    }),
  ) as { [K in keyof typeof schemas]: z.infer<(typeof schemas)[K]> };
}

export const copy = loadCopy();
export type Copy = ReturnType<typeof loadCopy>;

export function copyText(value: string, variables: Record<string, string | number> = {}) {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(variables[key] ?? `{${key}}`));
}

export function copyLines(value: string) {
  return value.split('\n');
}
