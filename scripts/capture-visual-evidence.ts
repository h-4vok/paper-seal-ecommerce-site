import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.DEPLOY_PRIME_URL ?? 'http://127.0.0.1:4321';
const output = process.env.VISUAL_OUTPUT ?? 'visual-evidence';
const browser = await chromium.launch();
const desktop = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
await mkdir(output, { recursive: true });
await desktop.goto(baseURL, { waitUntil: 'networkidle' });
await desktop.screenshot({ path: `${output}/home-desktop.png`, fullPage: true });

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});
await mobile.goto(baseURL, { waitUntil: 'networkidle' });
for (const image of await mobile.locator('main img').all()) {
  await image.scrollIntoViewIfNeeded();
  await image.evaluate((element) => {
    if (element instanceof HTMLImageElement && !element.complete) {
      return new Promise<void>((resolve) => {
        element.addEventListener('load', () => resolve(), { once: true });
        element.addEventListener('error', () => resolve(), { once: true });
      });
    }
  });
}
await mobile.evaluate(() => window.scrollTo(0, 0));
await mobile.screenshot({ path: `${output}/home-mobile.png`, fullPage: true });
await mobile.getByRole('button', { name: 'Open menu' }).click();
await mobile.screenshot({ path: `${output}/mobile-menu-open.png` });

if (process.env.STORYBOOK_URL) {
  await desktop.goto(process.env.STORYBOOK_URL, { waitUntil: 'networkidle' });
  await desktop.screenshot({ path: `${output}/storybook-index.png`, fullPage: true });
}
await browser.close();
