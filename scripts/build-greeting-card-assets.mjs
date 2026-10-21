import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { resolveDriveMasterPath } from './drive-masters.mjs';

export const projectRoot = path.resolve(import.meta.dirname, '..');

function validateId(id) {
  if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error(`Invalid greeting card id "${id}".`);
  }
}

export function validateCard(card) {
  validateId(card?.assetBase);
  if (card?.family !== 'greeting-card') {
    throw new Error(
      `Product ${card?.title ?? card?.assetBase} is not in the greeting-card family.`,
    );
  }
  if (typeof card.title !== 'string' || !card.title.trim()) {
    throw new Error(`Greeting card ${card.assetBase} needs a title.`);
  }
  if (typeof card.driveFileId !== 'string' || !card.driveFileId.trim()) {
    throw new Error(`Greeting card "${card.title}" needs a Google Drive file ID.`);
  }
  for (const name of ['back', 'front']) {
    const panel = card.panels?.[name];
    if (
      !panel ||
      ![panel.left, panel.top, panel.width, panel.height].every(Number.isFinite) ||
      panel.left < 0 ||
      panel.top < 0 ||
      panel.width <= 0 ||
      panel.height <= 0 ||
      panel.left + panel.width > 1 ||
      panel.top + panel.height > 1 ||
      ![0, 90, 180, 270].includes(panel.rotation)
    ) {
      throw new Error(`Greeting card "${card.title}" has an invalid ${name} panel definition.`);
    }
  }
  return card;
}

export async function makeSearchDerivative(imageBuffer, width) {
  if (!Number.isInteger(width) || width <= 0) {
    throw new Error('Greeting card search image width must be a positive integer.');
  }
  return sharp(imageBuffer, { failOn: 'error' })
    .resize(width, Math.round((width * 3) / 4), {
      fit: 'cover',
      position: 'centre',
      kernel: 'lanczos3',
    })
    .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toBuffer();
}

function validateScene(scene) {
  if (
    !Array.isArray(scene.outputPixels) ||
    scene.outputPixels.length !== 2 ||
    scene.outputPixels.some((dimension) => !Number.isInteger(dimension) || dimension <= 0)
  ) {
    throw new Error('Greeting card scene needs valid outputPixels.');
  }
  if (!Array.isArray(scene.frontQuad) || scene.frontQuad.length !== 4) {
    throw new Error('Greeting card scene needs four front-corner points.');
  }
  for (const [index, point] of scene.frontQuad.entries()) {
    if (
      !Array.isArray(point) ||
      point.length !== 2 ||
      point.some((coordinate) => !Number.isFinite(coordinate)) ||
      point[0] < 0 ||
      point[1] < 0 ||
      point[0] >= scene.outputPixels[0] ||
      point[1] >= scene.outputPixels[1]
    ) {
      throw new Error(`Greeting card front corner ${index + 1} is outside the scene canvas.`);
    }
  }
  if (!Array.isArray(scene.outputWidths) || scene.outputWidths.some((width) => width <= 0)) {
    throw new Error('Greeting card scene needs valid output widths.');
  }
  return scene;
}

export async function extractPanel(masterPath, panel) {
  const metadata = await sharp(masterPath, { failOn: 'error' }).metadata();
  if (!metadata.width || !metadata.height)
    throw new Error('Greeting card master has no dimensions.');
  const left = Math.round(panel.left * metadata.width);
  const top = Math.round(panel.top * metadata.height);
  const width = Math.round(panel.width * metadata.width);
  const height = Math.round(panel.height * metadata.height);
  if (left + width > metadata.width || top + height > metadata.height) {
    throw new Error('Greeting card panel crop exceeds the master image.');
  }
  const cropped = await sharp(masterPath, { failOn: 'error' })
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
  const oriented = await sharp(cropped).rotate(panel.rotation).png().toBuffer();
  const orientedMetadata = await sharp(oriented).metadata();
  if (!orientedMetadata.width || !orientedMetadata.height) {
    throw new Error('Could not read the oriented greeting card panel.');
  }
  return { buffer: oriented, width: orientedMetadata.width, height: orientedMetadata.height };
}

function solveLinearSystem(matrix, values) {
  const size = values.length;
  const rows = matrix.map((row, index) => [...row, values[index]]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
    }
    if (Math.abs(rows[pivot][column]) < 1e-10) {
      throw new Error('The perspective transform is singular.');
    }
    [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
    const divisor = rows[column][column];
    for (let entry = column; entry <= size; entry += 1) rows[column][entry] /= divisor;
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = rows[row][column];
      for (let entry = column; entry <= size; entry += 1) {
        rows[row][entry] -= factor * rows[column][entry];
      }
    }
  }
  return rows.map((row) => row[size]);
}

function destinationToSourceTransform(sourceWidth, sourceHeight, quad) {
  const sourcePoints = [
    [0, 0],
    [sourceWidth - 1, 0],
    [sourceWidth - 1, sourceHeight - 1],
    [0, sourceHeight - 1],
  ];
  const equations = [];
  const values = [];
  for (let index = 0; index < 4; index += 1) {
    const [x, y] = quad[index];
    const [u, v] = sourcePoints[index];
    equations.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    values.push(u);
    equations.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    values.push(v);
  }
  return solveLinearSystem(equations, values);
}

function sampleBilinear(data, width, height, x, y, target, offset) {
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const dx = x - x0;
  const dy = y - y0;
  const corners = [
    [(y0 * width + x0) * 4, (1 - dx) * (1 - dy)],
    [(y0 * width + x1) * 4, dx * (1 - dy)],
    [(y1 * width + x0) * 4, (1 - dx) * dy],
    [(y1 * width + x1) * 4, dx * dy],
  ];
  for (let channel = 0; channel < 4; channel += 1) {
    target[offset + channel] = Math.round(
      corners.reduce((sum, [pixel, weight]) => sum + data[pixel + channel] * weight, 0),
    );
  }
}

export async function warpPerspective(sourceBuffer, canvasWidth, canvasHeight, quad, scale = 1) {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new Error('Perspective warp scale must be a positive integer.');
  }
  const source = await sharp(sourceBuffer, { failOn: 'error' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = source;
  const renderWidth = canvasWidth * scale;
  const renderHeight = canvasHeight * scale;
  const scaledQuad = quad.map(([x, y]) => [x * scale, y * scale]);
  const transform = destinationToSourceTransform(info.width, info.height, scaledQuad);
  const [a, b, c, d, e, f, g, h] = transform;
  const output = Buffer.alloc(renderWidth * renderHeight * 4);
  const minX = Math.max(0, Math.floor(Math.min(...scaledQuad.map(([x]) => x))));
  const maxX = Math.min(renderWidth - 1, Math.ceil(Math.max(...scaledQuad.map(([x]) => x))));
  const minY = Math.max(0, Math.floor(Math.min(...scaledQuad.map(([, y]) => y))));
  const maxY = Math.min(renderHeight - 1, Math.ceil(Math.max(...scaledQuad.map(([, y]) => y))));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const denominator = g * px + h * py + 1;
      if (Math.abs(denominator) < 1e-10) continue;
      const sourceX = (a * px + b * py + c) / denominator;
      const sourceY = (d * px + e * py + f) / denominator;
      if (sourceX < 0 || sourceY < 0 || sourceX > info.width - 1 || sourceY > info.height - 1) {
        continue;
      }
      sampleBilinear(
        data,
        info.width,
        info.height,
        sourceX,
        sourceY,
        output,
        (y * renderWidth + x) * 4,
      );
    }
  }
  return sharp(output, {
    raw: { width: renderWidth, height: renderHeight, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function writeDerivatives(
  buffer,
  outputDirectory,
  name,
  outputWidths,
  chromaSubsampling = '4:2:0',
) {
  for (const width of outputWidths) {
    await sharp(buffer, { failOn: 'error' })
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 94, chromaSubsampling, mozjpeg: true })
      .toFile(path.join(outputDirectory, `${name}-${width}.jpg`));
  }
}

function validateFrontQuad(quad) {
  const crosses = quad.map((point, index) => {
    const next = quad[(index + 1) % quad.length];
    const after = quad[(index + 2) % quad.length];
    return (
      (next[0] - point[0]) * (after[1] - next[1]) - (next[1] - point[1]) * (after[0] - next[0])
    );
  });
  if (
    crosses.some((cross) => Math.abs(cross) < 1) ||
    !crosses.every((cross) => Math.sign(cross) === Math.sign(crosses[0]))
  ) {
    throw new Error('Greeting card front corners must form a convex quadrilateral.');
  }
}

export async function buildGreetingCardAssets({
  root = projectRoot,
  cards,
  scene,
  driveRoots,
} = {}) {
  if (!cards) {
    const manifest = JSON.parse(
      await readFile(path.join(root, 'data', 'assets', 'greeting-cards.json'), 'utf8'),
    );
    if (manifest.generated !== true || !Array.isArray(manifest.cards)) {
      throw new Error(
        'Greeting-card metadata is generated; run `bun run content:build:metadata` first.',
      );
    }
    cards = manifest.cards;
  }
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error('Greeting card asset source needs at least one card.');
  }
  cards.forEach(validateCard);
  if (!scene) {
    scene = JSON.parse(
      await readFile(
        path.join(
          root,
          'scripts',
          'asset-sources',
          'greeting-card-scenes',
          'approved',
          'manifest.json',
        ),
        'utf8',
      ),
    );
  }
  validateScene(scene);
  validateFrontQuad(scene.frontQuad);

  const templatePath = path.join(
    root,
    'scripts',
    'asset-sources',
    'greeting-card-scenes',
    'approved',
    scene.background,
  );
  await access(templatePath);
  const templateMetadata = await sharp(templatePath, { failOn: 'error' }).metadata();
  if (
    templateMetadata.width !== scene.outputPixels[0] ||
    templateMetadata.height !== scene.outputPixels[1]
  ) {
    throw new Error(
      `Greeting card template is ${templateMetadata.width}×${templateMetadata.height}; expected ${scene.outputPixels[0]}×${scene.outputPixels[1]}.`,
    );
  }

  const inputs = [];
  for (const card of cards) {
    const masterPath = await resolveDriveMasterPath(card, { driveRoots });
    const metadata = await sharp(masterPath, { failOn: 'error' }).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error(`Master for "${card.title}" has invalid dimensions.`);
    }
    const back = await extractPanel(masterPath, card.panels.back);
    const front = await extractPanel(masterPath, card.panels.front);
    const backAspect = back.width / back.height;
    const frontAspect = front.width / front.height;
    if (Math.abs(backAspect - 1.5) > 0.02 || Math.abs(frontAspect - 1.5) > 0.02) {
      throw new Error(
        `Master panels for "${card.title}" do not resolve to the expected 6×4 landscape ratio.`,
      );
    }
    inputs.push({ card, back, front });
  }

  const outputRoot = path.join(root, 'public', 'images', 'greeting-cards');
  const stageRoot = path.join(outputRoot, `.stage-${process.pid}`);
  await rm(stageRoot, { recursive: true, force: true });
  await mkdir(stageRoot, { recursive: true });
  try {
    for (const { card, back, front } of inputs) {
      const cardStage = path.join(stageRoot, card.assetBase);
      await mkdir(cardStage, { recursive: true });
      const backFlat = await sharp(back.buffer).flatten({ background: '#ffffff' }).png().toBuffer();
      const frontFlat = await sharp(front.buffer)
        .flatten({ background: '#ffffff' })
        .png()
        .toBuffer();
      await writeDerivatives(backFlat, cardStage, 'flat-back', scene.outputWidths);
      await writeDerivatives(frontFlat, cardStage, 'flat-front', scene.outputWidths);

      const perspective = await warpPerspective(
        front.buffer,
        scene.outputPixels[0],
        scene.outputPixels[1],
        scene.frontQuad,
        4,
      );
      const highResolutionTemplate = await sharp(templatePath)
        .resize(scene.outputPixels[0] * 4, scene.outputPixels[1] * 4, { kernel: 'lanczos3' })
        .png()
        .toBuffer();
      const highResolutionMockup = await sharp(highResolutionTemplate)
        .composite([{ input: perspective, blend: 'multiply' }])
        .png()
        .toBuffer();
      const mockup = await sharp(highResolutionMockup)
        .resize(scene.outputPixels[0], scene.outputPixels[1], { kernel: 'lanczos3' })
        .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
        .toBuffer();
      await writeDerivatives(mockup, cardStage, 'mockup-perspective', scene.outputWidths, '4:4:4');
      for (const width of scene.outputWidths) {
        const searchImage = await makeSearchDerivative(mockup, width);
        await writeFile(path.join(cardStage, `search-${width}.jpg`), searchImage);
      }
      process.stdout.write(
        `Built flat front, flat back, perspective mockup, and 4:3 search image for ${card.assetBase}.\n`,
      );
    }

    await mkdir(outputRoot, { recursive: true });
    for (const { card } of inputs) {
      const destination = path.join(outputRoot, card.assetBase);
      const staged = path.join(stageRoot, card.assetBase);
      const backup = path.join(stageRoot, `${card.assetBase}-backup`);
      let hadPrevious = false;
      try {
        await rename(destination, backup);
        hadPrevious = true;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      try {
        await rename(staged, destination);
      } catch (error) {
        if (hadPrevious) await rename(backup, destination);
        throw error;
      }
      if (hadPrevious) await rm(backup, { recursive: true, force: true });
    }
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  await buildGreetingCardAssets();
}
