import type { APIRoute } from 'astro';
import { artworks } from '../domain/catalogue';
import { institutionalPages } from '../domain/institutional';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://paperseal.co.uk');
  const paths = [
    '/',
    '/artworks',
    ...artworks.map(({ handle }) => `/artworks/${handle}`),
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
