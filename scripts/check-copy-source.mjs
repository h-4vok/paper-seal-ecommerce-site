import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const copyRoot = join(root, 'content', 'copy');
const errors = [];

if (existsSync(join(root, 'content', 'site-copy.json')))
  errors.push('content/site-copy.json must not exist');
if (readdirSync(copyRoot, { recursive: true }).some((file) => String(file).endsWith('.json'))) {
  errors.push('content/copy must contain YAML only');
}

const roots = ['src', 'tests', 'scripts', 'content', 'README.md', 'CONTEXT.md'];
const files = roots
  .flatMap((entry) => {
    const path = join(root, entry);
    if (!existsSync(path)) return [];
    if (!entry.includes('.'))
      return readdirSync(path, { recursive: true }).map((file) => join(path, String(file)));
    return [path];
  })
  .filter((file) => /\.(astro|ts|tsx|mjs|md|yaml|yml)$/.test(file));

for (const file of files) {
  if (file.endsWith('check-copy-source.mjs')) continue;
  const content = readFileSync(file, 'utf8');
  if (/site-copy\.json|domain\/site-copy|\bsiteCopy\b/.test(content))
    errors.push(`${file.replace(`${root}\\`, '')} references the removed JSON copy system`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Copy source guard passed: YAML-only copy/localisation sources.');
