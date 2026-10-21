import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  extractPanel,
  makeSearchDerivative,
  validateCard,
  warpPerspective,
} from './build-greeting-card-assets.mjs';

describe('greeting card image generation', () => {
  it('validates greeting-card family asset metadata', () => {
    const card = {
      family: 'greeting-card',
      assetBase: 'bodiam-castle',
      title: 'Bodiam Castle',
      driveFileId: 'master-id',
      panels: {
        back: { left: 0, top: 0, width: 0.25, height: 1, rotation: 270 },
        front: { left: 0.25, top: 0, width: 0.25, height: 1, rotation: 90 },
      },
    };
    expect(validateCard(card)).toBe(card);
    expect(() => validateCard({ ...card, family: 'artwork' })).toThrow('not in the greeting-card');
  });

  it('extracts the two left-side panels and rotates them independently', async () => {
    const width = 8;
    const height = 4;
    const pixels = Buffer.alloc(width * height * 3);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 3;
        const color = x < 2 ? [255, 0, 0] : x < 4 ? [0, 0, 255] : [0, 255, 0];
        pixels.set(color, offset);
      }
    }
    const master = await sharp(pixels, { raw: { width, height, channels: 3 } })
      .png()
      .toBuffer();
    const back = await extractPanel(master, {
      left: 0,
      top: 0,
      width: 0.25,
      height: 1,
      rotation: 270,
    });
    const front = await extractPanel(master, {
      left: 0.25,
      top: 0,
      width: 0.25,
      height: 1,
      rotation: 90,
    });

    expect(back).toMatchObject({ width: 4, height: 2 });
    expect(front).toMatchObject({ width: 4, height: 2 });
    const readCentre = async (buffer) => {
      const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
      const offset =
        (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels;
      return [...data.subarray(offset, offset + 3)];
    };
    expect(await readCentre(back.buffer)).toEqual([255, 0, 0]);
    expect(await readCentre(front.buffer)).toEqual([0, 0, 255]);
  });

  it('maps a source image to a four-corner quadrilateral', async () => {
    const source = await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 220, g: 30, b: 20 } },
    })
      .png()
      .toBuffer();
    const output = await warpPerspective(source, 6, 6, [
      [1, 1],
      [4, 1],
      [4, 4],
      [1, 4],
    ]);
    const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
    const inside = (2 * info.width + 2) * info.channels;
    const outside = 0;

    expect([...data.subarray(inside, inside + 4)]).toEqual([220, 30, 20, 255]);
    expect([...data.subarray(outside, outside + 4)]).toEqual([0, 0, 0, 0]);
  });

  it('keeps the perspective warp at the requested supersampled resolution', async () => {
    const source = await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 220, g: 30, b: 20 } },
    })
      .png()
      .toBuffer();
    const output = await warpPerspective(
      source,
      6,
      6,
      [
        [1, 1],
        [4, 1],
        [4, 4],
        [1, 4],
      ],
      4,
    );
    const { width, height } = await sharp(output).metadata();

    expect({ width, height }).toEqual({ width: 24, height: 24 });
  });

  it('creates a centred 4:3 product-search image', async () => {
    const source = await sharp({
      create: { width: 1200, height: 526, channels: 3, background: { r: 220, g: 30, b: 20 } },
    })
      .png()
      .toBuffer();
    const output = await makeSearchDerivative(source, 720);
    const { width, height } = await sharp(output).metadata();

    expect({ width, height }).toEqual({ width: 720, height: 540 });
  });
});
