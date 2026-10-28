import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { artworks, productPageArtworks } from './domain/catalogue';
import { greetingCards, greetingCardPagePath } from './domain/greeting-cards';
import { collabs } from './domain/collabs';
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
    expect(legacyEntries).toHaveLength(productPageArtworks.length - 2);
    const currentEntries = legacyEntries.filter(([, destination]) =>
      currentHandles.has(destination),
    );

    expect(currentEntries).toHaveLength(9);
    for (const [source, destination, status] of currentEntries) {
      expect(source).toMatch(/^\/artworks\/.+-ps-\d{3}$/);
      expect(destination).toMatch(/^\/artworks\/.+-ps-pr-\d{3}$/);
      expect(status).toBe('301');
    }
    expect(legacyEntries).toContainEqual([
      '/artworks/meet-me-in-eastbourne-ps-005',
      '/commissions',
      '301',
    ]);
  });

  it('registers first-party external redirects with unique contact tracking', async () => {
    const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');
    const entries = redirects
      .trim()
      .split('\n')
      .map((line) => line.split(/\s+/));
    const qrEntries = entries.filter(([source]) => source.startsWith('/redirect/'));
    const expected = [
      [
        '/redirect/collab-comfort-season-chipping-norton',
        'https://buy.stripe.com/6oU3co4kgaP06Uoc88b3q03',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-minster-lovell',
        'https://buy.stripe.com/4gM4gsg2Y4qCdiM4FGb3q01',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-stow-on-the-wold',
        'https://buy.stripe.com/4gM5kwbMIe1c5Qk4FGb3q02',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-the-everyday-cotswolds',
        'https://buy.stripe.com/dRm9AMcQMf5g3Ic1tub3q00',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-the-old-swan-pub',
        'https://buy.stripe.com/dRm4gsg2Y7CO2E82xyb3q05',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-snowshill',
        'https://buy.stripe.com/14A6oA6so3my6Uofkkb3q04',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-instagram',
        'https://www.instagram.com/comfortseason.co.uk/reels/?utm_source=paperseal_studio&utm_medium=referral&utm_campaign=comfort_season_collab',
        '302',
      ],
      [
        '/redirect/collab-comfort-season-website',
        'https://comfortseason.co.uk/?utm_source=paperseal_studio&utm_medium=referral&utm_campaign=comfort_season_collab&utm_content=collabs_page',
        '302',
      ],
      [
        '/redirect/contact-commissions-top-instagram',
        'https://www.instagram.com/thepapersealstudio/?utm_source=paperseal_studio&utm_medium=referral&utm_campaign=contact_cta&utm_content=commissions_top',
        '302',
      ],
      [
        '/redirect/contact-commissions-bottom-instagram',
        'https://www.instagram.com/thepapersealstudio/?utm_source=paperseal_studio&utm_medium=referral&utm_campaign=contact_cta&utm_content=commissions_bottom',
        '302',
      ],
      [
        '/redirect/contact-collabs-top-instagram',
        'https://www.instagram.com/thepapersealstudio/?utm_source=paperseal_studio&utm_medium=referral&utm_campaign=contact_cta&utm_content=collabs_top',
        '302',
      ],
      [
        '/redirect/contact-collabs-bottom-instagram',
        'https://www.instagram.com/thepapersealstudio/?utm_source=paperseal_studio&utm_medium=referral&utm_campaign=contact_cta&utm_content=collabs_bottom',
        '302',
      ],
      ['/redirect/contact-email', 'mailto:hello@paperseal.uk', '302'],
      ['/redirect/contact-whatsapp', 'https://wa.me/447448997200', '302'],
      [
        '/redirect/contact-instagram',
        'https://www.instagram.com/thepapersealstudio/?utm_source=paperseal_studio&utm_medium=referral&utm_campaign=contact_social&utm_content=instagram',
        '302',
      ],
      [
        '/redirect/contact-facebook',
        'https://www.facebook.com/profile.php?id=61596045238215&utm_source=paperseal_studio&utm_medium=referral&utm_campaign=contact_social&utm_content=facebook',
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
      expect(body).toContain('/commissions</loc>');
      expect(body).toContain('/collabs</loc>');
      expect(body).not.toContain('/artworks/meet-me-in-eastbourne-ps-pr-005</loc>');
      expect(body).toContain(`${greetingCardPagePath(greetingCards[0])}</loc>`);
      expect(body).toContain('/our-story</loc>');
      expect(body).toContain('/delivery</loc>');
      expect(body).toContain('/returns</loc>');
      expect(body).toContain('/contact</loc>');
      expect(body).not.toContain('paperseal.co.uk');
      if (site) expect(body).not.toContain('paperseal.uk');
      expect(body).not.toContain('/cart</loc>');
      expect(body).not.toContain('/privacy</loc>');
      expect(body).not.toContain('/redirect/');
      expect(collabs.flatMap(({ artworks }) => artworks)).toHaveLength(6);
    },
  );
});
