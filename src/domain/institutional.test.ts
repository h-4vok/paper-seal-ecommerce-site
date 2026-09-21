import { describe, expect, it } from 'vitest';
import { getInstitutionalPage, institutionalPages } from './institutional';

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
});
