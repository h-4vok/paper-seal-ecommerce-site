import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'node:fs';

const root = process.cwd();
const coverage = JSON.parse(readFileSync(join(root, '.design-system-coverage.json'), 'utf8'));
const reusableComponents = globSync('src/components/*.astro', { cwd: root })
  .map((file) => file.replaceAll('\\', '/').split('/').pop().replace('.astro', ''))
  .filter((name) => !coverage.exceptions.some((exception) => exception.name === name));
const inventoryErrors = [];
const componentNames = new Set(reusableComponents);
const indexedNames = new Set();
const levels = new Set(['Atoms', 'Molecules', 'Organisms', 'Templates']);
for (const component of coverage.components) {
  if (indexedNames.has(component.name)) inventoryErrors.push(`duplicate: ${component.name}`);
  indexedNames.add(component.name);
  if (!componentNames.has(component.name)) inventoryErrors.push(`stale: ${component.name}`);
  if (
    component.source !== `src/components/${component.name}.astro` ||
    !existsSync(join(root, component.source ?? ''))
  )
    inventoryErrors.push(`invalid source: ${component.name}`);
  if (!levels.has(component.level)) inventoryErrors.push(`invalid level: ${component.name}`);
  if (typeof component.useFor !== 'string' || !component.useFor.trim())
    inventoryErrors.push(`missing useFor: ${component.name}`);
}
const { tokens, sharedClasses } = coverage.foundations ?? {};
if (!tokens || !existsSync(join(root, tokens))) inventoryErrors.push('missing foundations tokens');
if (!Array.isArray(sharedClasses) || !sharedClasses.length) {
  inventoryErrors.push('missing shared classes');
} else if (tokens && existsSync(join(root, tokens))) {
  const css = readFileSync(join(root, tokens), 'utf8');
  for (const className of sharedClasses) {
    if (typeof className !== 'string' || !css.includes(`.${className}`))
      inventoryErrors.push(`missing shared class: ${className}`);
  }
}
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
if (missing.length || invalidExceptions.length || inventoryErrors.length) {
  console.error('Design-system check failed.');
  if (missing.length)
    console.error(`Missing inventory entries: ${missing.map(({ name }) => name).join(', ')}`);
  if (invalidExceptions.length)
    console.error(
      `Invalid head-only exceptions: ${invalidExceptions.map(({ name }) => name).join(', ')}`,
    );
  if (inventoryErrors.length) console.error(inventoryErrors.join('\n'));
  process.exit(1);
}

console.log(
  `Design-system check passed: ${reusableComponents.length} reusable components classified.`,
);
