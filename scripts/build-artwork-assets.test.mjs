import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { composeMockup } from './build-artwork-assets.mjs';

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
