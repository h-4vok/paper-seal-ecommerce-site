import { readFile, writeFile, access } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import {
  MOCKUP_SIZE_SOURCE_KEYS,
  resolveMockupSelections,
  validateMockupRegistry,
} from './mockup-registry.mjs';

export const projectRoot = path.resolve(import.meta.dirname, '..');
const priceFields = ['small', 'medium', 'large'];
const registryPath = (root) =>
  path.join(root, 'scripts', 'asset-sources', 'artwork-scenes', 'approved', 'manifest.json');
const approvedRegistry = validateMockupRegistry(
  JSON.parse(readFileSync(registryPath(projectRoot), 'utf8')),
);
const generated = {
  generated: true,
  source: 'content/artworks.yaml',
  generator: 'content:build:metadata',
};

function fail(index, message) {
  throw new Error(`Artwork ${index + 1}: ${message}`);
}

export function validateArtworkManifest(input, registry = approvedRegistry) {
  if (
    !input ||
    typeof input !== 'object' ||
    !Array.isArray(input.artworks) ||
    input.artworks.length === 0
  ) {
    throw new Error('Content manifest must contain at least one artwork.');
  }
  const skus = new Set();
  const handles = new Set();
  const assets = new Set();

  for (const [index, item] of input.artworks.entries()) {
    if (!item || typeof item !== 'object') fail(index, 'must be an object.');
    for (const field of [
      'sku',
      'title',
      'handle',
      'description',
      'placeName',
      'alt',
      'assetBase',
      'masterFile',
      'driveFileId',
    ]) {
      if (typeof item[field] !== 'string' || item[field].trim() === '')
        fail(index, `has an invalid ${field}.`);
    }
    if (!/^PS-[A-Z]{2,4}-\d{3}$/.test(item.sku)) fail(index, 'has an invalid sku.');
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.handle) ||
      !item.handle.endsWith(`-${item.sku.toLowerCase()}`)
    )
      fail(index, 'has an invalid handle.');
    if (skus.has(item.sku) || handles.has(item.handle) || assets.has(item.assetBase))
      fail(index, 'duplicates a stable identifier.');
    if (!Number.isInteger(item.publishedOrder) || item.publishedOrder < 0)
      fail(index, 'has an invalid publishedOrder.');
    if (
      !Array.isArray(item.collections) ||
      item.collections.length === 0 ||
      item.collections.some((value) => typeof value !== 'string' || !value.trim())
    )
      fail(index, 'has invalid collections.');
    if (!['landscape', 'portrait'].includes(item.orientation))
      fail(index, 'has an invalid orientation.');
    if (
      !item.price ||
      typeof item.price !== 'object' ||
      priceFields.some((size) => !Number.isFinite(item.price[size]) || item.price[size] <= 0)
    )
      fail(index, 'has invalid price values.');
    resolveMockupSelections(item, index, registry);
    skus.add(item.sku);
    handles.add(item.handle);
    assets.add(item.assetBase);
  }
  return input.artworks;
}

export function deriveOutputs(artworks, registry = approvedRegistry, imageDimensions = new Map()) {
  return {
    catalogue: artworks.map(({ masterFile, driveFileId, mockups, ...catalogue }, index) => ({
      ...catalogue,
      mockups: resolveMockupSelections({ ...catalogue, mockups }, index, registry),
      imageDimensions: imageDimensions.get(catalogue.assetBase) ?? {
        width: 720,
        height: catalogue.orientation === 'portrait' ? 1280 : 510,
      },
    })),
    assets: {
      ...generated,
      provenance:
        'Display-only composites generated from approved Google Drive masters. Production masters are never committed or served.',
      artworks: artworks.map(
        (
          {
            sku,
            title,
            handle,
            description,
            placeName,
            publishedOrder,
            collections,
            price,
            alt,
            mockups,
            ...asset
          },
          index,
        ) => ({
          ...asset,
          mockups: resolveMockupSelections({ ...asset, mockups }, index, registry),
        }),
      ),
    },
  };
}

export async function buildMetadata({ root = projectRoot } = {}) {
  const sourcePath = path.join(root, 'content', 'artworks.yaml');
  const manifest = parse(await readFile(sourcePath, 'utf8'));
  const registry = validateMockupRegistry(JSON.parse(await readFile(registryPath(root), 'utf8')));
  const artworks = validateArtworkManifest(manifest, registry);
  for (const [index, artwork] of artworks.entries()) {
    const selections = resolveMockupSelections(artwork, index, registry);
    for (const [size, selectedScenes] of Object.entries(selections)) {
      const sizeKey = MOCKUP_SIZE_SOURCE_KEYS[size];
      for (const scene of selectedScenes) {
        const template = registry.scenes
          .find(({ id }) => id === scene.sceneId)
          .variants.find(
            (variant) => variant.orientation === artwork.orientation && variant.size === size,
          ).template;
        try {
          await access(
            path.join(root, 'scripts', 'asset-sources', 'artwork-scenes', 'approved', template),
          );
        } catch {
          fail(index, `scene ${scene.sceneId} ${sizeKey} template does not exist: ${template}`);
        }
      }
    }
  }
  const sharp = (await import('sharp')).default;
  const imageDimensions = new Map();
  for (const artwork of artworks) {
    const derivative = path.join(
      root,
      'public',
      'images',
      'artworks',
      artwork.assetBase,
      'flat-720.jpg',
    );
    try {
      const { width, height } = await sharp(derivative).metadata();
      if (width && height) imageDimensions.set(artwork.assetBase, { width, height });
    } catch {
      // New artwork can use the orientation fallback until its derivatives are generated.
    }
  }
  const outputs = deriveOutputs(artworks, registry, imageDimensions);
  await writeFile(
    path.join(root, 'src', 'data', 'artworks.json'),
    `${JSON.stringify({ ...generated, artworks: outputs.catalogue }, null, 2)}\n`,
  );
  await writeFile(
    path.join(root, 'data', 'assets', 'artworks.json'),
    `${JSON.stringify(outputs.assets, null, 2)}\n`,
  );
  return outputs;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  await buildMetadata();
  console.log('Generated catalogue and asset metadata.');
}
