import { copy } from '../content/copy';

export type InstitutionalSection = (typeof copy.institutional.pages)[number]['sections'][number];
export type InstitutionalPage = (typeof copy.institutional.pages)[number];

export const institutionalPages = copy.institutional.pages;

export function getInstitutionalPage(slug: string): InstitutionalPage | undefined {
  return institutionalPages.find((page) => page.slug === slug);
}
