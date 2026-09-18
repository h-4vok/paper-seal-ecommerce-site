import { describe, expect, it } from 'vitest';
import { GET as getRobots } from './pages/robots.txt';
import { GET as getSitemap } from './pages/sitemap.xml';

describe('SEO route bodies', () => {
  it.each([new URL('https://preview.example'), undefined])(
    'renders robots with a canonical sitemap for %s',
    async (site) => {
      const response = await getRobots({ site } as Parameters<typeof getRobots>[0]);
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
      const origin = site ? 'https://preview.example' : 'https://paperseal.co.uk';
      expect(await response.text()).toBe(
        `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
      );
    },
  );

  it.each([new URL('https://preview.example'), undefined])(
    'renders all indexable catalogue and trust routes for %s',
    async (site) => {
      const response = await getSitemap({ site } as Parameters<typeof getSitemap>[0]);
      expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
      const body = await response.text();
      expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(body).toContain(
        `<loc>${site ? 'https://preview.example/' : 'https://paperseal.co.uk/'}</loc>`,
      );
      expect(body).toContain('/artworks</loc>');
      expect(body).toContain('/artworks/flower-bed-ps-001</loc>');
      expect(body).toContain('/our-story</loc>');
      expect(body).toContain('/delivery</loc>');
      expect(body).toContain('/returns</loc>');
      expect(body).not.toContain('/cart</loc>');
      expect(body).not.toContain('/privacy</loc>');
    },
  );
});
