export const DEFAULT_SITE_ORIGIN = 'https://paperseal.uk';

export function resolveSiteOrigin({ context, deployPrimeUrl, siteOrigin }) {
  if (context === 'deploy-preview') {
    return deployPrimeUrl || siteOrigin || DEFAULT_SITE_ORIGIN;
  }

  return siteOrigin || DEFAULT_SITE_ORIGIN;
}
