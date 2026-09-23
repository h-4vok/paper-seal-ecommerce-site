import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const output = 'visual-evidence/paper-quality-carousel';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
for (const [surface, url] of [
  ['home', 'http://127.0.0.1:4321/'],
  ['story', 'http://127.0.0.1:6006/iframe.html?id=organisms-paperquality--desktop'],
]) {
  for (const [viewport, width, height] of [
    ['desktop', 1440, 900],
    ['tablet', 820, 1180],
    ['mobile', 390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const section = page.locator('.paper-quality');
    await section.waitFor();
    for (const index of [0, 1, 2]) {
      if (index) await section.locator(`[data-paper-index="${index}"]`).click();
      const image = section.locator('[data-paper-slide]:visible img');
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(async (element) => {
        if (!element.complete) {
          await new Promise((resolve) => element.addEventListener('load', resolve, { once: true }));
        }
      });
      await section.screenshot({ path: `${output}/${surface}-${viewport}-${index + 1}.png` });
    }
    console.log(surface, viewport, 'errors', errors.length);
    await page.close();
  }
}
await browser.close();
