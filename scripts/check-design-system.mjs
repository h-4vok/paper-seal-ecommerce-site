import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'node:fs';

const root = process.cwd();
const coverage = JSON.parse(readFileSync(join(root, '.design-system-coverage.json'), 'utf8'));
const reusableComponents = globSync('src/components/*.astro', { cwd: root })
  .map((file) => file.replaceAll('\\', '/').split('/').pop().replace('.astro', ''))
  .filter((name) => !coverage.exceptions.some((exception) => exception.name === name));
const storyFiles = globSync('src/**/*.stories.@(js|jsx|mjs|ts|tsx)', { cwd: root });
const missing = reusableComponents
  .filter((name) => !coverage.components.some((component) => component.name === name))
  .map((name) => ({ name, reason: 'missing inventory entry' }));
const invalidExceptions = coverage.exceptions.filter((exception) => {
  const source = readFileSync(join(root, 'src', 'components', `${exception.name}.astro`), 'utf8');
  return (
    !/<head|<meta|<script|JsonLd|SeoHead/.test(source) ||
    /<body|<main|<section|<article/.test(source)
  );
});
const broken = coverage.components.filter((component) => {
  if (!existsSync(join(root, component.story))) return true;
  const source = readFileSync(join(root, component.story), 'utf8');
  return !source.includes(`title: '${component.level}/${component.name}'`);
});

const forbidden = [];
for (const file of storyFiles) {
  const source = readFileSync(join(root, file), 'utf8');
  const imageSources = [...source.matchAll(/src=["'](\/images\/[^"']+)["']/g)].map(
    ([, value]) => value,
  );
  for (const imageSource of imageSources) {
    if (!existsSync(join(root, 'public', imageSource.slice(1)))) {
      forbidden.push(`${file}: missing image asset ${imageSource}`);
    }
  }
}

if (!existsSync(join(root, '.storybook', 'main.ts'))) {
  forbidden.push('.storybook/main.ts: missing Storybook config');
}

if (missing.length || broken.length || invalidExceptions.length || forbidden.length) {
  console.error('Design-system check failed.');
  if (missing.length)
    console.error(`Missing inventory entries: ${missing.map(({ name }) => name).join(', ')}`);
  if (broken.length)
    console.error(`Broken story mappings: ${broken.map(({ name }) => name).join(', ')}`);
  if (invalidExceptions.length)
    console.error(
      `Invalid head-only exceptions: ${invalidExceptions.map(({ name }) => name).join(', ')}`,
    );
  if (forbidden.length) console.error(forbidden.join('\n'));
  process.exit(1);
}

console.log(
  `Design-system check passed: ${storyFiles.length} story files, ${reusableComponents.length} reusable components covered.`,
);
