import type { APIRoute } from 'astro';
import { productPageArtworks } from '../domain/catalogue';
import { greetingCards, greetingCardPagePath } from '../domain/greeting-cards';
import { institutionalPages } from '../domain/institutional';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://paperseal.uk');
  const paths = [
    '/',
    '/artworks',
    '/commissions',
    '/collabs',
    ...productPageArtworks.map(({ handle }) => `/artworks/${handle}`),
    ...greetingCards.map(greetingCardPagePath),
    ...institutionalPages.filter(({ indexable }) => indexable).map(({ slug }) => `/${slug}`),
  ];
  const entries = paths
    .map((path) => `  <url><loc>${new URL(path, origin).href}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
