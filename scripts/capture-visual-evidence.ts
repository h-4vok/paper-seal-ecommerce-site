import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.DEPLOY_PRIME_URL ?? 'http://127.0.0.1:4321';
const output = process.env.VISUAL_OUTPUT ?? 'visual-evidence';
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
await mkdir(output, { recursive: true });
await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.screenshot({ path: `${output}/coming-soon.png`, fullPage: true });
await browser.close();
