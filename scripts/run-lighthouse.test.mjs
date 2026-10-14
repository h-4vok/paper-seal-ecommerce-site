import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildSummaryHtml,
  CATEGORIES,
  evaluateScores,
  parseSitemap,
  runAudit,
  summarizeReport,
  TARGETS,
} from './run-lighthouse.mjs';

const scoreSet = (overrides = {}) => ({
  performance: 91,
  accessibility: 88,
  'best-practices': 94,
  seo: 100,
  ...overrides,
});

describe('Lighthouse audit helpers', () => {
  it('discovers unique sitemap routes and excludes cart', () => {
    const sitemap = `<urlset><url><loc>https://paperseal.uk/</loc></url><url><loc>https://paperseal.uk/cart</loc></url><url><loc>https://paperseal.uk/artworks</loc></url><url><loc>https://paperseal.uk/artworks</loc></url></urlset>`;
    expect(parseSitemap(sitemap, TARGETS.production).map(({ pathname }) => pathname)).toEqual([
      '/',
      '/artworks',
    ]);
  });

  it('rejects invalid or empty sitemaps and maps sitemap paths to the selected host', () => {
    expect(() => parseSitemap('<html>no routes</html>', TARGETS.production)).toThrow(
      /not a URL set/,
    );
    expect(() => parseSitemap('<urlset></urlset>', TARGETS.production)).toThrow(/no routes/);
    expect(
      parseSitemap(
        '<urlset><loc>https://paperseal.uk/</loc><loc>https://paperseal.uk/artworks</loc></urlset>',
        TARGETS.staging,
      ).map(({ href }) => href),
    ).toEqual([
      'https://staging--paperseal.netlify.app/',
      'https://staging--paperseal.netlify.app/artworks',
    ]);
  });

  it('requires and reports all four category scores', () => {
    const summary = summarizeReport(
      {
        finalUrl: 'https://paperseal.uk/',
        categories: {
          ...Object.fromEntries(CATEGORIES.map((key) => [key, { score: scoreSet()[key] / 100 }])),
          performance: {
            score: 0.91,
            auditRefs: [{ id: 'render-blocking', group: 'diagnostics', weight: 1 }],
            groups: { diagnostics: { title: 'Diagnostics' } },
          },
        },
        audits: {
          'render-blocking': {
            title: 'Render-blocking requests',
            description: 'Fix <script> & style loading.',
            score: 0,
            scoreDisplayMode: 'binary',
            displayValue: 'Potential savings of 200 ms',
          },
        },
      },
      'https://paperseal.uk/',
    );
    expect(summary.scores).toEqual({
      performance: 91,
      accessibility: 88,
      'best-practices': 94,
      seo: 100,
    });
    expect(summary.auditsByCategory.performance[0]).toMatchObject({
      title: 'Render-blocking requests',
      group: 'Diagnostics',
      status: 'failed',
      displayValue: 'Potential savings of 200 ms',
    });
    expect(() => summarizeReport({ finalUrl: 'x', categories: {} }, 'x')).toThrow(
      /Missing performance score/,
    );
  });

  it('warns on performance below 90 and fails only SEO below 90', () => {
    const results = [
      {
        url: '/one',
        scores: scoreSet({ performance: 89, accessibility: 20, 'best-practices': 10 }),
      },
      { url: '/two', scores: scoreSet({ seo: 89 }) },
    ];
    expect(evaluateScores(results)).toEqual({
      warnings: ['Performance 89/100 (target 90): /one'],
      failures: ['SEO 89/100 (minimum 90): /two'],
    });
  });

  it('generates an HTML route summary with four score columns and escaped text', () => {
    const html = buildSummaryHtml(
      '<prod>',
      [
        {
          url: 'https://paperseal.uk/?a=1&b=2',
          reportPath: 'index.report.html',
          scores: scoreSet(),
          auditsByCategory: {
            performance: [
              {
                group: 'Diagnostics',
                title: 'Render-blocking requests',
                status: 'failed',
                score: 0,
                scoreDisplayMode: 'binary',
                weight: 1,
                displayValue: 'Potential savings of 200 ms',
                description: 'Fix <script> & style loading.',
              },
            ],
          },
        },
      ],
      [],
      [],
    );
    expect(html).toContain('<th>Performance</th>');
    expect(html).toContain('<th>Accessibility</th>');
    expect(html).toContain('<th>Best Practices</th>');
    expect(html).toContain('<th>SEO</th>');
    expect(html).toContain('All Lighthouse checks (1)');
    expect(html).toContain('Render-blocking requests');
    expect(html).toContain('Potential savings of 200 ms');
    expect(html).toContain('Fix &lt;script&gt; &amp; style loading.');
    expect(html).toContain('&lt;prod&gt;');
    expect(html).toContain('&amp;b=2');
  });
});

describe('runAudit', () => {
  let reportRoot;
  afterEach(async () => {
    if (reportRoot) await rm(reportRoot, { recursive: true, force: true });
    reportRoot = undefined;
  });

  it('audits only the chosen host and writes detailed local reports plus summary', async () => {
    reportRoot = await mkdtemp(path.join(os.tmpdir(), 'lighthouse-'));
    const routes = ['https://paperseal.uk/', 'https://paperseal.uk/artworks'];
    const fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => `<urlset>${routes.map((route) => `<loc>${route}</loc>`).join('')}</urlset>`,
    }));
    const lighthouse = vi.fn(async ({ reportBase }) => {
      await writeFile(`${reportBase}.report.html`, '<html>full report</html>');
      await writeFile(
        `${reportBase}.report.json`,
        JSON.stringify({
          finalUrl: routes[0],
          categories: Object.fromEntries(CATEGORIES.map((key) => [key, { score: 0.95 }])),
        }),
      );
    });
    await runAudit('production', {
      reportRoot,
      fetch,
      runLighthouse: lighthouse,
      now: new Date('2026-10-12T10:20:30Z'),
    });
    expect(fetch.mock.calls.map(([url]) => new URL(url).origin)).toEqual([
      TARGETS.production,
      TARGETS.production,
      TARGETS.production,
    ]);
    expect(lighthouse).toHaveBeenCalledTimes(2);
    const outputDir = path.join(reportRoot, 'production', '2026-10-12T10-20-30Z');
    expect(await readFile(path.join(outputDir, 'summary.html'), 'utf8')).toContain(
      'Best Practices',
    );
    expect(await readFile(path.join(outputDir, 'artworks.report.html'), 'utf8')).toContain(
      'full report',
    );
    expect(await readFile(path.join(outputDir, 'artworks.report.json'), 'utf8')).toContain(
      'finalUrl',
    );
  });

  it('reports sitemap network and HTTP failures clearly', async () => {
    await expect(
      runAudit('staging', {
        fetch: async () => {
          throw new Error('offline');
        },
      }),
    ).rejects.toThrow('offline');
    await expect(
      runAudit('staging', {
        fetch: async () => ({ ok: false, status: 503, statusText: 'Unavailable' }),
      }),
    ).rejects.toThrow(/503 Unavailable/);
  });

  it('fails on non-success route response', async () => {
    reportRoot = await mkdtemp(path.join(os.tmpdir(), 'lighthouse-'));
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<urlset><loc>https://staging--paperseal.netlify.app/</loc></urlset>',
      })
      .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Unavailable' });
    await expect(runAudit('staging', { reportRoot, fetch })).rejects.toThrow(/Route returned 503/);
  });

  it('skips sitemap routes whose deployed HTML is noindex', async () => {
    reportRoot = await mkdtemp(path.join(os.tmpdir(), 'lighthouse-'));
    const route = 'https://paperseal.uk/private';
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `<urlset><loc>${route}</loc></urlset>`,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<meta name="robots" content="noindex, nofollow">',
      });
    const runLighthouse = vi.fn();
    await runAudit('production', { reportRoot, fetch, runLighthouse });
    expect(runLighthouse).not.toHaveBeenCalled();
  });

  it('fails on missing reports, bad report data, and SEO below threshold', async () => {
    reportRoot = await mkdtemp(path.join(os.tmpdir(), 'lighthouse-'));
    const fetch = async () => ({
      ok: true,
      text: async () => '<urlset><loc>https://paperseal.uk/</loc></urlset>',
    });
    await expect(
      runAudit('production', {
        reportRoot,
        fetch,
        runLighthouse: ({ reportBase }) =>
          Promise.all([
            writeFile(
              `${reportBase}.report.json`,
              JSON.stringify({ finalUrl: '/', categories: {} }),
            ),
            writeFile(`${reportBase}.report.html`, '<html></html>'),
          ]),
      }),
    ).rejects.toThrow(/Missing performance score/);
    await expect(
      runAudit('production', {
        reportRoot,
        fetch,
        runLighthouse: ({ reportBase }) => writeFile(`${reportBase}.report.json`, '{bad json'),
      }),
    ).rejects.toThrow(/Missing or invalid Lighthouse JSON report/);
    await expect(
      runAudit('production', {
        reportRoot,
        fetch,
        runLighthouse: ({ reportBase }) =>
          Promise.all([
            writeFile(
              `${reportBase}.report.json`,
              JSON.stringify({
                finalUrl: '/',
                categories: Object.fromEntries(
                  CATEGORIES.map((key) => [key, { score: key === 'seo' ? 0.89 : 0.5 }]),
                ),
              }),
            ),
            writeFile(`${reportBase}.report.html`, '<html>report</html>'),
          ]),
      }),
    ).rejects.toThrow(/SEO score policy failed/);
  });

  it('rejects unknown targets', async () => {
    await expect(runAudit('preview')).rejects.toThrow(/Unknown Lighthouse target/);
  });
});
