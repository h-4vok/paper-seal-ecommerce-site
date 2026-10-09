import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_ORIGIN, resolveSiteOrigin } from './site-origin.mjs';

describe('site origin configuration', () => {
  it('uses the canonical production origin by default', () => {
    expect(resolveSiteOrigin({})).toBe(DEFAULT_SITE_ORIGIN);
  });

  it('uses the configured staging origin for branch builds', () => {
    expect(
      resolveSiteOrigin({ context: 'branch-deploy', siteOrigin: 'https://staging.paperseal.uk' }),
    ).toBe('https://staging.paperseal.uk');
  });

  it('uses the unique Netlify origin for Deploy Previews', () => {
    expect(
      resolveSiteOrigin({
        context: 'deploy-preview',
        deployPrimeUrl: 'https://deploy-preview-99--paperseal.netlify.app',
        siteOrigin: DEFAULT_SITE_ORIGIN,
      }),
    ).toBe('https://deploy-preview-99--paperseal.netlify.app');
  });
});
