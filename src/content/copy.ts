import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const CopyFile = z.record(z.string(), z.unknown());
const Navigation = z.object({
  homeLabel: z.string().min(1), items: z.array(z.object({ href: z.string().startsWith('/'), key: z.string().min(1), label: z.string().min(1) })).min(1),
  cartLabel: z.string().min(1), openMenu: z.string().min(1), closeMenu: z.string().min(1), explore: z.string().min(1),
  mobileLabel: z.string().min(1), contact: z.string().min(1), mobileIntro: z.string().min(1),
});
const Shared = z.object({ navigation: Navigation, footer: z.record(z.string(), z.string().min(1)) });
const Home = z.object({ seo: z.object({ title: z.string().min(1), description: z.string().min(1) }), hero: z.record(z.string(), z.string().min(1)) });
const root = join(process.cwd(), 'content', 'copy');

export function loadCopy(locale = 'en-GB') {
  const directory = join(root, locale);
  if (!readdirSync(root, { withFileTypes: true }).some((entry) => entry.isDirectory() && entry.name === locale)) {
    throw new Error(`Unknown copy locale: ${locale}`);
  }
  return Object.fromEntries(
    readdirSync(directory).filter((file) => file.endsWith('.yaml')).map((file) => {
      const key = file.replace(/\.yaml$/, '');
      const parsed = parse(readFileSync(join(directory, file), 'utf8'));
      const value = CopyFile.parse(parsed);
      if (key === 'shared') Shared.parse(parsed);
      if (key === 'home') Home.parse(parsed);
      return [key, value];
    }),
  );
}

export const copy = loadCopy();
export type Copy = ReturnType<typeof loadCopy>;

export function copyText(value: string, variables: Record<string, string | number> = {}) {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(variables[key] ?? `{${key}}`));
}

export function copyLines(value: string) {
  return value.split('\n');
}
