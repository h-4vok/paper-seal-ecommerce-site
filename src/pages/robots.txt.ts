import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://paperseal.co.uk');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', origin)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
