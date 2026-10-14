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
  const auditsByCategory = Object.fromEntries(
    CATEGORIES.map((category) => {
      const categoryReport = report.categories[category];
      const refs = categoryReport?.auditRefs ?? [];
      const audits = refs
        .map((ref) => {
          const audit = report.audits?.[ref.id];
          if (!audit) return null;
          const status =
            audit.score === null
              ? (audit.scoreDisplayMode ?? 'informational')
              : audit.score === 1
                ? 'passed'
                : audit.score === 0
                  ? 'failed'
                  : 'partial';
          return {
            id: ref.id,
            title: audit.title ?? ref.id,
            description: audit.description ?? '',
            group: categoryReport.groups?.[ref.group]?.title ?? 'Checks',
            weight: ref.weight ?? 0,
            score: audit.score,
            scoreDisplayMode: audit.scoreDisplayMode ?? '',
            status,
            displayValue: audit.displayValue ?? '',
          };
        })
        .filter(Boolean);
      return [category, audits];
    }),
  );
  return { url, finalUrl: report.finalUrl, scores, auditsByCategory };
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
  const categoryLabels = {
    performance: 'Performance',
    accessibility: 'Accessibility',
    'best-practices': 'Best Practices',
    seo: 'SEO',
  };
  const rows = results
    .map(({ url, reportPath, scores, auditsByCategory }) => {
      const auditCount = CATEGORIES.reduce(
        (total, category) => total + (auditsByCategory?.[category]?.length ?? 0),
        0,
      );
      const categoryDetails = CATEGORIES.map((category) => {
        const audits = auditsByCategory?.[category] ?? [];
        const groups = Object.groupBy(audits, (audit) => audit.group);
        const groupDetails = Object.entries(groups)
          .map(
            ([groupName, groupAudits]) =>
              `<section class="audit-group"><h4>${escapeHtml(groupName)}</h4><ul>${groupAudits
                .map(
                  (audit) =>
                    `<li class="audit audit--${escapeHtml(audit.status)}"><span class="audit-status">${escapeHtml(audit.status)}</span><strong>${escapeHtml(audit.title)}</strong>${audit.displayValue ? `<span class="audit-value">${escapeHtml(audit.displayValue)}</span>` : ''}<span class="audit-meta">${audit.score === null ? escapeHtml(audit.scoreDisplayMode) : `${Math.round(audit.score * 100)}/100`} · weight ${audit.weight}</span><p>${escapeHtml(audit.description)}</p></li>`,
                )
                .join('')}</ul></section>`,
          )
          .join('');
        return `<section class="audit-category"><h3>${categoryLabels[category]} (${audits.length})</h3>${groupDetails || '<p>No audit checks returned.</p>'}</section>`;
      }).join('');
      return `<tr><th scope="row"><a href="${escapeHtml(reportPath)}">${escapeHtml(url)}</a></th>${CATEGORIES.map((category) => `<td>${scores[category]}</td>`).join('')}</tr><tr class="findings-row"><td colspan="5"><details><summary>All Lighthouse checks (${auditCount})</summary>${categoryDetails}<p><a href="${escapeHtml(reportPath)}">Open the complete Lighthouse report</a> for screenshots, trace data, and expanded diagnostic details.</p></details></td></tr>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>Lighthouse ${escapeHtml(target)} summary</title>
<style>
body{font:16px/1.5 system-ui,sans-serif;margin:2rem;color:#172033}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.65rem;border-bottom:1px solid #ccd2dc;vertical-align:top}thead{background:#edf0f5}.findings-row td{padding:0 1rem 1rem}.findings-row details{padding:.5rem 0}.findings-row summary{cursor:pointer;font-weight:700;padding:.5rem 0}.audit-category{border-top:1px solid #ccd2dc;margin-top:1rem}.audit-group ul{list-style:none;padding:0}.audit{border-left:4px solid #758095;margin:.75rem 0;padding:.5rem 1rem;background:#f6f7f9}.audit--failed{border-color:#c53636}.audit--passed{border-color:#23804a}.audit--partial{border-color:#d68a14}.audit-status{display:inline-block;font-size:.8rem;font-weight:700;text-transform:uppercase;margin-right:.6rem}.audit-value,.audit-meta{display:block;color:#455064;font-size:.9rem}.audit p{margin:.45rem 0 0;color:#455064}a{overflow-wrap:anywhere}
</style>
</head>
<body>
<h1>Lighthouse ${escapeHtml(target)} summary</h1>
<p>Mobile navigation audits. Scores and every category check are listed by route. Open the complete native Lighthouse report for the full trace and diagnostic details.</p>
${warnings.length ? `<h2>Performance warnings</h2><ul>${warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
${failures.length ? `<h2>SEO failures</h2><ul>${failures.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
<table><thead><tr><th>Route</th>${CATEGORIES.map((category) => `<th>${categoryLabels[category]}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
</body>
</html>`;
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
