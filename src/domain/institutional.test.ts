import { describe, expect, it } from 'vitest';
import {
  contentNoticeSlugs,
  getInstitutionalPage,
  hasContentNotice,
  institutionalPages,
} from './institutional';

describe('institutional route configuration', () => {
  it('keeps required URLs unique and stable', () => {
    expect(institutionalPages.map(({ slug }) => slug)).toEqual([
      'our-story',
      'delivery',
      'returns',
      'contact',
      'privacy',
      'terms',
      'east-sussex',
      'collabs',
    ]);
    expect(new Set(institutionalPages.map(({ slug }) => slug)).size).toBe(
      institutionalPages.length,
    );
  });

  it('makes indexability explicit and finds known routes', () => {
    expect(institutionalPages.every(({ indexable }) => typeof indexable === 'boolean')).toBe(true);
    expect(getInstitutionalPage('returns')?.indexable).toBe(true);
    expect(getInstitutionalPage('privacy')?.indexable).toBe(false);
    expect(getInstitutionalPage('missing')).toBeUndefined();
  });

  it('shows the shared content notice on the seven requested pages only', () => {
    expect(contentNoticeSlugs).toEqual([
      'our-story',
      'collabs',
      'delivery',
      'returns',
      'contact',
      'privacy',
      'terms',
    ]);
    expect(
      institutionalPages
        .filter(({ slug }) => hasContentNotice(slug))
        .map(({ slug }) => slug)
        .sort(),
    ).toEqual([...contentNoticeSlugs].sort());
    expect(hasContentNotice('east-sussex')).toBe(false);
  });
});
