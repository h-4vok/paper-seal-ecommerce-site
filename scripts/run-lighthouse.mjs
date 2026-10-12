import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const execFile = promisify(execFileCallback);

async function runLighthouseCli({ url, reportBase, chromePath, lighthouseCli }) {
  await execFile(
    process.execPath,
    [
      lighthouseCli,
      url,
      '--output=html',
      '--output=json',
      `--output-path=${reportBase}`,
      `--only-categories=${CATEGORIES.join(',')}`,
      '--chrome-flags=--headless=new --disable-gpu --no-sandbox',
      '--quiet',
    ],
    {
      env: { ...process.env, ...(chromePath ? { CHROME_PATH: chromePath } : {}) },
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  return {
    report: JSON.parse(await readFile(`${reportBase}.report.json`, 'utf8')),
    html: await readFile(`${reportBase}.report.html`, 'utf8'),
  };
}

export const TARGETS = {
  production: 'https://paperseal.uk',
  staging: 'https://staging--paperseal.netlify.app',
};

export const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const REPORT_ROOT = path.resolve('lighthouse-reports');

export function parseSitemap(xml, origin) {
  if (!xml.includes('<urlset')) throw new Error('Sitemap response is not a URL set.');
  const routes = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(([, loc]) => {
    const sitemapUrl = new URL(loc.trim());
    return new URL(`${sitemapUrl.pathname}${sitemapUrl.search}${sitemapUrl.hash}`, origin);
  });
  if (!routes.length) throw new Error('Sitemap contains no routes.');
  return [
    ...new Map(
      routes.filter((url) => url.pathname !== '/cart').map((url) => [url.href, url]),
    ).values(),
  ];
}

export function summarizeReport(report, url) {
  if (!report?.categories || !report?.finalUrl)
    throw new Error(`Missing or invalid Lighthouse report for ${url}.`);
  const scores = Object.fromEntries(
    CATEGORIES.map((category) => {
      const score = report.categories[category]?.score;
      if (typeof score !== 'number' || !Number.isFinite(score))
        throw new Error(`Missing ${category} score for ${url}.`);
      return [category, Math.round(score * 100)];
    }),
  );
  return { url, finalUrl: report.finalUrl, scores };
}

export function evaluateScores(results) {
  const warnings = results
    .filter(({ scores }) => scores.performance < 90)
    .map(({ url, scores }) => `Performance ${scores.performance}/100 (target 90): ${url}`);
  const failures = results
    .filter(({ scores }) => scores.seo < 90)
    .map(({ url, scores }) => `SEO ${scores.seo}/100 (minimum 90): ${url}`);
  return { warnings, failures };
}

export function buildSummaryHtml(target, results, warnings, failures) {
  const rows = results
    .map(
      ({ url, reportPath, scores }) =>
        `<tr><th scope="row"><a href="${escapeHtml(reportPath)}">${escapeHtml(url)}</a></th>${CATEGORIES.map((category) => `<td>${scores[category]}</td>`).join('')}</tr>`,
    )
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Lighthouse ${escapeHtml(target)} summary</title><style>body{font:16px system-ui,sans-serif;margin:2rem;color:#172033}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.65rem;border-bottom:1px solid #ccd2dc}thead{background:#edf0f5}code{overflow-wrap:anywhere}</style></head><body><h1>Lighthouse ${escapeHtml(target)} summary</h1><p>Mobile navigation audits. Each route links to its full Lighthouse HTML report.</p>${warnings.length ? `<h2>Performance warnings</h2><ul>${warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}${failures.length ? `<h2>SEO failures</h2><ul>${failures.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}<table><thead><tr><th>Route</th>${CATEGORIES.map((category) => `<th>${category}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

export async function runAudit(targetName, dependencies = {}) {
  const origin = TARGETS[targetName];
  if (!origin)
    throw new Error(`Unknown Lighthouse target "${targetName}". Use production or staging.`);
  const fetchImpl = dependencies.fetch ?? fetch;
  const chromePath = dependencies.chromePath ?? process.env.CHROME_PATH ?? process.env.CHROME_BIN;
  const lighthouseCli =
    dependencies.lighthouseCli ?? path.resolve('node_modules/lighthouse/cli/index.js');
  const runLighthouse = dependencies.runLighthouse ?? runLighthouseCli;
  const now = dependencies.now ?? new Date();
  const stamp = now
    .toISOString()
    .replaceAll(':', '-')
    .replace(/\.\d{3}Z$/, 'Z');
  const outputDir = path.join(dependencies.reportRoot ?? REPORT_ROOT, targetName, stamp);
  const sitemapUrl = new URL('/sitemap.xml', origin);
  const sitemapResponse = await fetchImpl(sitemapUrl);
  if (!sitemapResponse.ok)
    throw new Error(
      `Sitemap request failed (${sitemapResponse.status} ${sitemapResponse.statusText}): ${sitemapUrl.href}`,
    );
  const routes = parseSitemap(await sitemapResponse.text(), origin);
  await mkdir(outputDir, { recursive: true });
  const results = [];
  for (const route of routes) {
    const response = await fetchImpl(route);
    if (!response.ok)
      throw new Error(`Route returned ${response.status} ${response.statusText}: ${route.href}`);
    const pageHtml = await response.text();
    const robotsMeta = pageHtml.match(
      /<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    )?.[1];
    if (robotsMeta?.toLowerCase().includes('noindex')) {
      console.log(`Skipping noindex route: ${route.href}`);
      continue;
    }
    const baseName =
      route.pathname === '/' ? 'index' : route.pathname.slice(1).replaceAll('/', '__');
    const reportBase = path.join(outputDir, baseName);
    try {
      await runLighthouse({ url: route.href, reportBase, chromePath, lighthouseCli });
    } catch (error) {
      throw new Error(`Lighthouse could not audit ${route.href}: ${error.message}`, {
        cause: error,
      });
    }
    const htmlPath = `${reportBase}.report.html`;
    const jsonPath = `${reportBase}.report.json`;
    let report;
    try {
      report = JSON.parse(await readFile(jsonPath, 'utf8'));
    } catch (error) {
      throw new Error(
        `Missing or invalid Lighthouse JSON report for ${route.href}: ${error.message}`,
        { cause: error },
      );
    }
    const runtimeStatus = report.audits?.['http-status-code']?.details?.items?.[0]?.statusCode;
    if (typeof runtimeStatus === 'number' && (runtimeStatus < 200 || runtimeStatus >= 300)) {
      throw new Error(
        `Route returned HTTP ${runtimeStatus} during Lighthouse navigation: ${route.href}`,
      );
    }
    const summary = summarizeReport(report, route.href);
    try {
      await readFile(htmlPath);
    } catch (error) {
      throw new Error(`Missing Lighthouse HTML report for ${route.href}: ${error.message}`, {
        cause: error,
      });
    }
    results.push({ ...summary, reportPath: `${baseName}.report.html` });
    console.log(
      `${summary.url}\n  Performance ${summary.scores.performance} | Accessibility ${summary.scores.accessibility} | Best Practices ${summary.scores['best-practices']} | SEO ${summary.scores.seo}`,
    );
  }
  const { warnings, failures } = evaluateScores(results);
  warnings.forEach((warning) => console.warn(`WARNING: ${warning}`));
  const summaryPath = path.join(outputDir, 'summary.html');
  await writeFile(summaryPath, buildSummaryHtml(targetName, results, warnings, failures));
  console.log(`\nFull reports and route score summary: ${summaryPath}`);
  if (failures.length) throw new Error(`SEO score policy failed on ${failures.length} route(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runAudit(process.argv[2]).catch((error) => {
    console.error(`Lighthouse audit failed: ${error.message}`);
    process.exitCode = 1;
  });
}
