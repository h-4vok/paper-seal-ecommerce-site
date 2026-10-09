import { readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');

export const MOCKUP_SIZES = ['7x5', 'a4', 'a3'];
export const MOCKUP_SIZE_LABELS = { '7x5': '7 × 5 in', a4: 'A4', a3: 'A3' };
export const MOCKUP_SIZE_SOURCE_KEYS = { '7x5': '7x5', a4: 'A4', a3: 'A3' };
export const MOCKUP_WIDTHS = [720, 1440];
const PAPER_DIMENSIONS = {
  '7x5': { landscape: [177.8, 127], portrait: [127, 177.8] },
  a4: { landscape: [297, 210], portrait: [210, 297] },
  a3: { landscape: [420, 297], portrait: [297, 420] },
};

export async function readMockupRegistry(root = projectRoot) {
  return JSON.parse(
    await readFile(
      path.join(root, 'scripts', 'asset-sources', 'artwork-scenes', 'approved', 'manifest.json'),
      'utf8',
    ),
  );
}

export function validateMockupRegistry(registry) {
  if (!registry || !Array.isArray(registry.scenes) || registry.scenes.length === 0) {
    throw new Error('Approved mockup scene manifest must contain scenes.');
  }
  if (
    !Array.isArray(registry.outputPixels) ||
    registry.outputPixels[0] !== 1440 ||
    registry.outputPixels[1] !== 1080
  ) {
    throw new Error('Approved mockup templates must use a 1440 × 1080 output canvas.');
  }
  if (registry.scenes.length !== 16) {
    throw new Error('Approved mockup registry must contain exactly the 16 selectable scenes.');
  }
  const ids = new Set();
  const slugs = new Set();
  for (const [sceneIndex, scene] of registry.scenes.entries()) {
    if (!/^\d{2}$/.test(scene.id) || ids.has(scene.id)) {
      throw new Error(`Mockup scene has an invalid or duplicate ID: ${scene.id}`);
    }
    if (scene.id !== String(sceneIndex + 1).padStart(2, '0')) {
      throw new Error(
        `Mockup scenes must keep their stable sequence from 01 to 16; found ${scene.id}.`,
      );
    }
    if (!/^[0-9]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scene.slug) || slugs.has(scene.slug)) {
      throw new Error(`Mockup scene ${scene.id} has an invalid or duplicate slug.`);
    }
    ids.add(scene.id);
    slugs.add(scene.slug);
    if (!Array.isArray(scene.variants))
      throw new Error(`Mockup scene ${scene.id} has no variants.`);
    const variants = new Set();
    for (const variant of scene.variants) {
      const key = `${variant.orientation}:${variant.size}`;
      if (variants.has(key)) throw new Error(`Mockup scene ${scene.id} duplicates ${key}.`);
      variants.add(key);
      const rect = variant.paperRectPx;
      if (
        !rect ||
        ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
        rect.left < 0 ||
        rect.top < 0 ||
        rect.width <= 0 ||
        rect.height <= 0 ||
        rect.left + rect.width > registry.outputPixels[0] ||
        rect.top + rect.height > registry.outputPixels[1]
      ) {
        throw new Error(`Mockup scene ${scene.id} has an invalid paper rectangle for ${key}.`);
      }
      const [paperWidth, paperHeight] = variant.paperMm ?? [];
      if (!(paperWidth > 0 && paperHeight > 0)) {
        throw new Error(
          `Mockup scene ${scene.id} has invalid physical paper dimensions for ${key}.`,
        );
      }
      const [expectedWidth, expectedHeight] =
        PAPER_DIMENSIONS[variant.size]?.[variant.orientation] ?? [];
      if (paperWidth !== expectedWidth || paperHeight !== expectedHeight) {
        throw new Error(
          `Mockup scene ${scene.id} has incorrect physical paper dimensions for ${key}.`,
        );
      }
      const pixelRatio = rect.width / rect.height;
      const paperRatio = paperWidth / paperHeight;
      if (Math.abs(pixelRatio / paperRatio - 1) > 0.005) {
        throw new Error(`Mockup scene ${scene.id} paper rectangle ratio does not match ${key}.`);
      }
      if (typeof variant.template !== 'string' || !variant.template) {
        throw new Error(`Mockup scene ${scene.id} has no template for ${key}.`);
      }
      if (variant.template !== `${scene.slug}/${variant.orientation}-${variant.size}.jpg`) {
        throw new Error(`Mockup scene ${scene.id} has an unexpected template path for ${key}.`);
      }
    }
    for (const orientation of ['landscape', 'portrait']) {
      for (const size of MOCKUP_SIZES) {
        if (!variants.has(`${orientation}:${size}`)) {
          throw new Error(
            `Mockup scene ${scene.id} is missing its ${orientation} ${size} template.`,
          );
        }
      }
    }
  }
  return registry;
}

function sceneName(scene) {
  return scene.slug
    .replace(/^\d{2}-/, '')
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export function resolveMockupSelections(artwork, index, registry) {
  const fail = (message) => {
    throw new Error(`Artwork ${index + 1}: ${message}`);
  };
  if (!artwork.mockups || typeof artwork.mockups !== 'object' || Array.isArray(artwork.mockups)) {
    fail('has invalid mockups; provide a non-empty scene list for 7x5, A4, and A3.');
  }
  const scenesById = new Map(registry.scenes.map((scene) => [scene.id, scene]));
  const selections = {};
  for (const size of MOCKUP_SIZES) {
    const sourceKey = MOCKUP_SIZE_SOURCE_KEYS[size];
    const values = artwork.mockups[sourceKey] ?? artwork.mockups[size];
    if (!Array.isArray(values) || values.length === 0) {
      fail(`has an empty or missing ${sourceKey} mockup list.`);
    }
    const seen = new Set();
    selections[size] = values.map((value) => {
      const id = typeof value === 'string' ? value : value?.sceneId;
      if (typeof id !== 'string' || !id)
        fail(`has an invalid scene ID in its ${sourceKey} mockup list.`);
      if (seen.has(id)) fail(`duplicates scene ${id} in its ${sourceKey} mockup list.`);
      seen.add(id);
      const scene = scenesById.get(id);
      if (!scene) fail(`references unknown mockup scene ${id} for ${sourceKey}.`);
      const variant = scene.variants.find(
        (candidate) => candidate.orientation === artwork.orientation && candidate.size === size,
      );
      if (!variant) {
        fail(`scene ${id} has no ${artwork.orientation} ${sourceKey} mockup variant.`);
      }
      return { sceneId: id, sceneName: sceneName(scene), sceneSlug: scene.slug };
    });
  }
  return selections;
}

export function mockupFilename(size, sceneId, width) {
  if (!MOCKUP_SIZES.includes(size) || !/^\d{2}$/.test(sceneId) || !MOCKUP_WIDTHS.includes(width)) {
    throw new Error(`Invalid mockup output path dimensions: ${size}/${sceneId}/${width}.`);
  }
  return `mock-${size}-${sceneId}-${width}.jpg`;
}
