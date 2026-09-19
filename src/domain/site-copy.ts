import { z } from 'zod';
import rawCopy from '../../content/site-copy.json';

const text = z.string().min(1);
const copySchema = z.object({
  brand: z.object({
    name: text,
    region: text,
    homeAriaLabel: text,
    headerNote: z.array(text).length(2),
    footerStatement: z.array(text).length(2),
    footerBase: text,
  }),
  navigation: z.object({
    primaryLabel: text,
    mobileLabel: text,
    exploreLabel: text,
    items: z.array(z.object({ href: z.string().startsWith('/'), label: text })).min(1),
    contactLabel: text,
  }),
  home: z.object({
    title: text,
    description: text,
    heroEyebrow: text,
    heroHeading: text,
    heroIntro: text,
    heroCta: text,
    heroAlt: text,
    heroCaption: text,
    heroNote: text,
    promiseLabel: text,
    promises: z.array(z.object({ title: text, copy: text })).length(4),
    manifestoEyebrow: text,
    manifestoHeading: text,
    manifestoParagraphs: z.array(text).length(2),
    collectionEyebrow: text,
    collectionHeading: z.array(text).length(2),
    collectionIntro: text,
    browseEyebrow: text,
    browseHeading: z.array(text).length(2),
    browseCta: text,
    processEyebrow: text,
    processHeading: text,
    processBody: text,
    processCta: text,
    processSteps: z.array(z.object({ title: text, copy: text })).length(3),
  }),
  catalogue: z.record(z.string(), z.union([text, z.array(text)])),
  cart: z.record(text),
});

export const siteCopy = copySchema.parse(rawCopy);
