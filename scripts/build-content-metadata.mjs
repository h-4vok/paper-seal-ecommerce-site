import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';

export const projectRoot = path.resolve(import.meta.dirname, '..');
const galleryKinds = ['flat', 'room'];
const generated = {
  generated: true,
  source: 'content/artworks.yaml',
  generator: 'content:build:metadata',
};

function fail(index, message) {
  throw new Error(`Artwork ${index + 1}: ${message}`);
}

export function validateArtworkManifest(input) {
  if (
    !input ||
    typeof input !== 'object' ||
    !Array.isArray(input.artworks) ||
    input.artworks.length === 0
  ) {
    throw new Error('Content manifest must contain at least one artwork.');
  }
  const codes = new Set();
  const handles = new Set();
  const assets = new Set();

  for (const [index, item] of input.artworks.entries()) {
    if (!item || typeof item !== 'object') fail(index, 'must be an object.');
    for (const field of [
      'artworkCode',
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
    if (!/^PS-\d{3}$/.test(item.artworkCode)) fail(index, 'has an invalid artworkCode.');
    if (!/^[a-z0-9-]+-ps-\d{3}$/.test(item.handle)) fail(index, 'has an invalid handle.');
    if (codes.has(item.artworkCode) || handles.has(item.handle) || assets.has(item.assetBase))
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
      !Array.isArray(item.gallery) ||
      item.gallery.length === 0 ||
      item.gallery.some((value) => !galleryKinds.includes(value))
    )
      fail(index, 'has an invalid gallery.');
    const scene = item.roomScene;
    if (
      !scene ||
      typeof scene.template !== 'string' ||
      !scene.template ||
      scene.fit !== 'cover' ||
      !scene.placement ||
      ['left', 'top', 'width', 'height'].some(
        (key) => !Number.isFinite(scene.placement[key]) || scene.placement[key] <= 0,
      )
    )
      fail(index, 'has invalid roomScene placement configuration.');
    codes.add(item.artworkCode);
    handles.add(item.handle);
    assets.add(item.assetBase);
  }
  return input.artworks;
}

export function deriveOutputs(artworks) {
  return {
    catalogue: artworks.map(({ masterFile, driveFileId, roomScene, ...catalogue }) => ({
      ...catalogue,
      gallery: ['room'],
    })),
    assets: {
      ...generated,
      provenance:
        'Display-only composites generated from approved Google Drive masters. Production masters are never committed or served.',
      artworks: artworks.map(
        ({
          artworkCode,
          title,
          handle,
          description,
          placeName,
          publishedOrder,
          collections,
          alt,
          gallery,
          ...asset
        }) => asset,
      ),
    },
  };
}

export async function buildMetadata({ root = projectRoot } = {}) {
  const sourcePath = path.join(root, 'content', 'artworks.yaml');
  const manifest = parse(await readFile(sourcePath, 'utf8'));
  const artworks = validateArtworkManifest(manifest);
  for (const [index, artwork] of artworks.entries()) {
    try {
      await access(path.join(root, artwork.roomScene.template));
    } catch {
      fail(index, `roomScene template does not exist: ${artwork.roomScene.template}`);
    }
  }
  const outputs = deriveOutputs(artworks);
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
