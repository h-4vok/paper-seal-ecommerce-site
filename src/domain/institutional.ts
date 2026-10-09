import { copy } from '../content/copy';

export type InstitutionalSection = (typeof copy.institutional.pages)[number]['sections'][number];
export type InstitutionalPage = (typeof copy.institutional.pages)[number];

export const institutionalPages = copy.institutional.pages;

export const contentNoticeSlugs = [
  'our-story',
  'collabs',
  'delivery',
  'returns',
  'contact',
  'privacy',
  'terms',
] as const;

export function hasContentNotice(slug: string): boolean {
  return contentNoticeSlugs.some((noticeSlug) => noticeSlug === slug);
}

export function getInstitutionalPage(slug: string): InstitutionalPage | undefined {
  return institutionalPages.find((page) => page.slug === slug);
}
