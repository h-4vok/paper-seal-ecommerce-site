import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CATALOGUE_WIDTHS,
  composeMockup,
  writeCatalogueDerivatives,
} from './build-artwork-assets.mjs';

let temporaryDirectory;

afterEach(async () => {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

describe('product mockup generation', () => {
  it('composites the artwork inside the measured paper rectangle and keeps the 4:3 scene canvas', async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'paperseal-mockup-'));
    const masterPath = path.join(temporaryDirectory, 'master.png');
    const templatePath = path.join(temporaryDirectory, 'template.png');
    await sharp({ create: { width: 1440, height: 1080, channels: 3, background: '#e3d4c2' } })
      .png()
      .toFile(templatePath);
    await sharp({ create: { width: 20, height: 10, channels: 3, background: '#c52c2c' } })
      .png()
      .toFile(masterPath);

    const output = await composeMockup(
      masterPath,
      templatePath,
      { left: 100, top: 80, width: 200, height: 140 },
      { title: 'Test artwork' },
      '13',
      'a4',
    );
    const metadata = await sharp(output).metadata();
    const { data } = await sharp(output)
      .extract({ left: 100, top: 80, width: 200, height: 140 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(metadata).toMatchObject({ width: 1440, height: 1080 });
    const centerPixel = (70 * 200 + 100) * 3;
    const center = [...data.subarray(centerPixel, centerPixel + 3)];
    expect(center[0]).toBeGreaterThan(180);
    expect(center[1]).toBeLessThan(80);
    expect(center[2]).toBeLessThan(80);
  });
});

describe('catalogue artwork generation', () => {
  it.each([
    { orientation: 'landscape', width: 1800, height: 1200, axis: 'x', start: 250, end: 1550 },
    { orientation: 'portrait', width: 1800, height: 2700, axis: 'y', start: 750, end: 1950 },
  ])('centres the $orientation artwork in matching 4:3 WebP and JPEG variants', async (artwork) => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'paperseal-catalogue-'));
    const masterPath = path.join(temporaryDirectory, 'master.svg');
    const { width, height, axis, start, end } = artwork;
    const first =
      axis === 'x'
        ? `<rect width="${start}" height="${height}" fill="red"/>`
        : `<rect width="${width}" height="${start}" fill="red"/>`;
    const last =
      axis === 'x'
        ? `<rect x="${end}" width="${width - end}" height="${height}" fill="blue"/>`
        : `<rect y="${end}" width="${width}" height="${height - end}" fill="blue"/>`;
    await writeFile(
      masterPath,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="lime"/>${first}${last}</svg>`,
    );

    await writeCatalogueDerivatives(masterPath, temporaryDirectory);

    for (const outputWidth of CATALOGUE_WIDTHS) {
      for (const [extension, format] of [
        ['webp', 'webp'],
        ['jpg', 'jpeg'],
      ]) {
        const output = await readFile(
          path.join(temporaryDirectory, `card-${outputWidth}.${extension}`),
        );
        const metadata = await sharp(output).metadata();
        expect(metadata).toMatchObject({
          width: outputWidth,
          height: (outputWidth * 3) / 4,
          format,
        });
      }
    }

    const { data, info } = await sharp(
      await readFile(path.join(temporaryDirectory, 'card-480.webp')),
    )
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixel = (x, y) => [
      ...data.subarray(
        (y * info.width + x) * info.channels,
        (y * info.width + x) * info.channels + 3,
      ),
    ];
    const beginning = axis === 'x' ? pixel(5, 180) : pixel(240, 5);
    const middle = pixel(240, 180);
    const ending = axis === 'x' ? pixel(475, 180) : pixel(240, 355);
    expect(beginning[0]).toBeGreaterThan(180);
    expect(beginning[2]).toBeLessThan(80);
    expect(middle[1]).toBeGreaterThan(180);
    expect(middle[0]).toBeLessThan(80);
    expect(ending[2]).toBeGreaterThan(180);
    expect(ending[0]).toBeLessThan(80);
  });
});
