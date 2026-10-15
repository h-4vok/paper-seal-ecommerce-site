import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { artworks } from './domain/catalogue';
import { GET as getRobots } from './pages/robots.txt';
import { GET as getSitemap } from './pages/sitemap.xml';

describe('SEO route bodies', () => {
  it('redirects every legacy artwork URL to its SKU-based handle', async () => {
    const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');
    const entries = redirects
      .trim()
      .split('\n')
      .map((line) => line.split(/\s+/));
    const currentHandles = new Set(artworks.map(({ handle }) => `/artworks/${handle}`));

    const legacyEntries = entries.filter(([source]) => source.startsWith('/artworks/'));
    expect(legacyEntries).toHaveLength(artworks.length);
    const currentEntries = legacyEntries.filter(([, destination]) =>
      currentHandles.has(destination),
    );

    expect(currentEntries).toHaveLength(10);
    for (const [source, destination, status] of currentEntries) {
      expect(source).toMatch(/^\/artworks\/.+-ps-\d{3}$/);
      expect(destination).toMatch(/^\/artworks\/.+-ps-pr-\d{3}$/);
      expect(status).toBe('301');
    }
  });

  it('temporarily redirects each Comfort Season QR route to its assigned artwork', async () => {
    const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');
    const entries = redirects
      .trim()
      .split('\n')
      .map((line) => line.split(/\s+/));
    const qrEntries = entries.filter(([source]) => source.startsWith('/redirect/'));
    const expected = [
      [
        '/redirect/collab-comfort-season-chipping-norton',
        '/artworks/new-eastbourne-flower-bed-ps-pr-001',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-minster-lovell',
        '/artworks/seven-sisters-from-the-eastbourne-promenade-ps-pr-002',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-stow-on-the-wold',
        '/artworks/the-beachy-head-pub-ps-pr-004',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-the-everyday-cotswolds',
        '/artworks/meet-me-in-eastbourne-ps-pr-005',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-the-old-swan-pub',
        '/artworks/eastbourne-pier-ps-pr-006',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-snowshill',
        '/artworks/beach-huts-eastbourne-ps-pr-007',
        '302',
      ],
    ];

    expect(qrEntries).toEqual(expected);
    expect(new Set(qrEntries.map(([, destination]) => destination)).size).toBe(expected.length);
  });

  it.each([new URL('https://preview.example'), undefined])(
    'renders robots with a canonical sitemap for %s',
    async (site) => {
      const response = await getRobots({ site } as Parameters<typeof getRobots>[0]);
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
      const origin = site ? 'https://preview.example' : 'https://paperseal.uk';
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
        `<loc>${site ? 'https://preview.example/' : 'https://paperseal.uk/'}</loc>`,
      );
      expect(body).toContain('/artworks</loc>');
      expect(body).toContain('/artworks/new-eastbourne-flower-bed-ps-pr-001</loc>');
      expect(body).toContain('/our-story</loc>');
      expect(body).toContain('/delivery</loc>');
      expect(body).toContain('/returns</loc>');
      expect(body).not.toContain('paperseal.co.uk');
      if (site) expect(body).not.toContain('paperseal.uk');
      expect(body).not.toContain('/cart</loc>');
      expect(body).not.toContain('/privacy</loc>');
      expect(body).not.toContain('/redirect/');
    },
  );
});
