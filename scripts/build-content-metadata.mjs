import { readFile, writeFile, access } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import { parse } from 'yaml';
import {
  MOCKUP_SIZE_SOURCE_KEYS,
  resolveMockupSelections,
  validateMockupRegistry,
} from './mockup-registry.mjs';

export const projectRoot = path.resolve(import.meta.dirname, '..');
const priceFields = ['small', 'medium', 'large'];
const watermarkProfiles = ['standard', 'high-contrast'];
const productFamilies = ['artwork', 'greeting-card'];
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

export function validateCollabManifest(input) {
  if (input === undefined) return [];
  if (!Array.isArray(input)) throw new Error('Collab manifest must be an array.');
  const ids = new Set();
  const assetBases = new Set();
  return input.map((collab, index) => {
    const failCollab = (message) => {
      throw new Error(`Collab ${index + 1}: ${message}`);
    };
    if (!collab || typeof collab !== 'object') failCollab('must be an object.');
    for (const field of [
      'id',
      'title',
      'partner',
      'propertyName',
      'placeName',
      'story',
      'websiteUrl',
      'websiteRedirect',
      'instagramRedirect',
      'reelUrl',
    ]) {
      if (typeof collab[field] !== 'string' || !collab[field].trim())
        failCollab(`has an invalid ${field}.`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collab.id)) failCollab('has an invalid id.');
    if (ids.has(collab.id)) failCollab('duplicates a collab id.');
    for (const field of ['websiteUrl', 'reelUrl']) {
      let url;
      try {
        url = new URL(collab[field]);
      } catch {
        failCollab(`has an invalid ${field}.`);
      }
      if (url.protocol !== 'https:') failCollab(`has an invalid ${field}; expected HTTPS.`);
    }
    if (!/^\/redirect\/[a-z0-9-]+$/.test(collab.instagramRedirect)) {
      failCollab('has an invalid instagramRedirect.');
    }
    if (!/^\/redirect\/[a-z0-9-]+$/.test(collab.websiteRedirect)) {
      failCollab('has an invalid websiteRedirect.');
    }
    if (!Array.isArray(collab.artworks) || collab.artworks.length === 0)
      failCollab('must contain artwork.');
    const artworkIds = new Set();
    const artworks = collab.artworks.map((artwork, artworkIndex) => {
      const failArtwork = (message) => {
        throw new Error(`Collab ${index + 1} artwork ${artworkIndex + 1}: ${message}`);
      };
      if (!artwork || typeof artwork !== 'object') failArtwork('must be an object.');
      for (const field of [
        'id',
        'title',
        'description',
        'placeName',
        'alt',
        'assetBase',
        'driveFileId',
      ]) {
        if (typeof artwork[field] !== 'string' || !artwork[field].trim())
          failArtwork(`has an invalid ${field}.`);
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artwork.id) || artworkIds.has(artwork.id))
        failArtwork('has an invalid or duplicate id.');
      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artwork.assetBase) ||
        assetBases.has(artwork.assetBase)
      )
        failArtwork('has an invalid or duplicate assetBase.');
      if (artwork.collabGroup !== collab.id) failArtwork('has an invalid collabGroup.');
      for (const field of ['showInProductSearch', 'showInCommissions', 'showInCollabs']) {
        if (artwork[field] !== undefined && typeof artwork[field] !== 'boolean')
          failArtwork(`has an invalid ${field}; expected a boolean.`);
      }
      if (
        artwork.showInProductSearch !== false ||
        artwork.showInCommissions !== false ||
        artwork.showInCollabs !== true
      ) {
        failArtwork('must be visible only in Collabs.');
      }
      if (!['landscape', 'portrait'].includes(artwork.orientation))
        failArtwork('has an invalid orientation.');
      if (artwork.watermark !== undefined && !watermarkProfiles.includes(artwork.watermark)) {
        failArtwork('has an invalid watermark profile.');
      }
      if (!Number.isInteger(artwork.order) || artwork.order < 1)
        failArtwork('has an invalid order.');
      artworkIds.add(artwork.id);
      assetBases.add(artwork.assetBase);
      return { ...artwork, watermark: artwork.watermark ?? 'standard' };
    });
    ids.add(collab.id);
    return { ...collab, artworks: artworks.sort((left, right) => left.order - right.order) };
  });
}

async function writeGeneratedJson(filePath, value) {
  const options = (await prettier.resolveConfig(filePath)) ?? {};
  const content = await prettier.format(`${JSON.stringify(value, null, 2)}\n`, {
    ...options,
    filepath: filePath,
  });
  await writeFile(filePath, content);
}

function fail(index, message) {
  throw new Error(`Artwork ${index + 1}: ${message}`);
}

export function validateProductManifest(input, registry = approvedRegistry) {
  if (
    !input ||
    typeof input !== 'object' ||
    !Array.isArray(input.products) ||
    input.products.length === 0
  ) {
    throw new Error('Content manifest must contain at least one product.');
  }
  const skus = new Set();
  const handles = new Set();
  const assets = new Set();

  for (const [index, product] of input.products.entries()) {
    if (!product || typeof product !== 'object') fail(index, 'must be an object.');
    for (const field of [
      'family',
      'sku',
      'title',
      'handle',
      'description',
      'placeName',
      'alt',
      'assetBase',
      'driveFileId',
    ]) {
      if (typeof product[field] !== 'string' || product[field].trim() === '')
        fail(index, `has an invalid ${field}.`);
    }
    if (!productFamilies.includes(product.family)) fail(index, 'has an invalid family.');
    if (!/^PS-[A-Z]{2,4}-\d{3}$/.test(product.sku)) fail(index, 'has an invalid sku.');
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.handle) ||
      !product.handle.endsWith(`-${product.sku.toLowerCase()}`)
    )
      fail(index, 'has an invalid handle.');
    if (
      skus.has(product.sku) ||
      handles.has(product.handle) ||
      assets.has(`${product.family}:${product.assetBase}`)
    )
      fail(index, 'duplicates a stable identifier.');
    if (!Number.isInteger(product.publishedOrder) || product.publishedOrder < 0)
      fail(index, 'has an invalid publishedOrder.');
    if (
      !Array.isArray(product.collections) ||
      product.collections.length === 0 ||
      product.collections.some((value) => typeof value !== 'string' || !value.trim())
    )
      fail(index, 'has invalid collections.');
    if (!['landscape', 'portrait'].includes(product.orientation))
      fail(index, 'has an invalid orientation.');
    for (const field of ['showInProductSearch', 'showInCommissions']) {
      if (product[field] !== undefined && typeof product[field] !== 'boolean')
        fail(index, `has an invalid ${field}; expected a boolean.`);
    }
    if (product.watermark !== undefined && !watermarkProfiles.includes(product.watermark))
      fail(index, 'has an invalid watermark profile.');
    if (product.family === 'artwork') {
      if (
        !product.price ||
        typeof product.price !== 'object' ||
        priceFields.some(
          (size) => !Number.isFinite(product.price[size]) || product.price[size] <= 0,
        )
      )
        fail(index, 'has invalid price values.');
      resolveMockupSelections(product, index, registry);
    } else {
      if (!Number.isFinite(product.price) || product.price <= 0)
        fail(index, 'has an invalid price.');
      if (
        product.orientation !== 'landscape' ||
        product.dimensions?.closed?.width !== 6 ||
        product.dimensions?.closed?.height !== 4 ||
        product.dimensions?.closed?.unit !== 'inches'
      ) {
        fail(index, 'has invalid closed greeting-card dimensions.');
      }
      if (
        product.included?.envelope !== true ||
        typeof product.included?.packaging !== 'string' ||
        !product.included.packaging.trim()
      ) {
        fail(index, 'has invalid greeting-card inclusions.');
      }
      for (const side of ['back', 'front']) {
        const panel = product.panels?.[side];
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
          fail(index, `has an invalid ${side} panel definition.`);
        }
      }
    }
    skus.add(product.sku);
    handles.add(product.handle);
    assets.add(`${product.family}:${product.assetBase}`);
  }
  return input.products.map((product) => ({
    ...product,
    watermark: product.watermark ?? 'standard',
    showInProductSearch: product.showInProductSearch ?? true,
    showInCommissions: product.showInCommissions ?? false,
  }));
}

export function deriveOutputs(products, registry = approvedRegistry, imageDimensions = new Map()) {
  const artworks = products.filter(({ family }) => family === 'artwork');
  const greetingCards = products.filter(({ family }) => family === 'greeting-card');
  const resolveDimensions = (assetBase, family, orientation) =>
    imageDimensions.get(`${family}:${assetBase}`) ?? {
      width: 720,
      height: family === 'greeting-card' ? 540 : orientation === 'portrait' ? 1280 : 510,
    };
  const assetMetadata = (product) => {
    const { sku, handle, collections, ...asset } = product;
    return asset.family === 'artwork'
      ? {
          ...asset,
          mockups: resolveMockupSelections(asset, 0, registry),
        }
      : asset;
  };
  return {
    catalogue: artworks.map(({ driveFileId, mockups, ...catalogue }, index) => ({
      ...catalogue,
      mockups: resolveMockupSelections({ ...catalogue, mockups }, index, registry),
      imageDimensions: resolveDimensions(
        catalogue.assetBase,
        catalogue.family,
        catalogue.orientation,
      ),
    })),
    greetingCardCatalogue: greetingCards.map(({ driveFileId, panels, ...catalogue }) => ({
      ...catalogue,
      imageDimensions: resolveDimensions(
        catalogue.assetBase,
        catalogue.family,
        catalogue.orientation,
      ),
    })),
    assets: {
      ...generated,
      provenance:
        'Display-only composites generated from approved Google Drive masters. Production masters are never committed or served.',
      artworks: artworks.map(assetMetadata),
      greetingCards: greetingCards.map(assetMetadata),
    },
  };
}

export function deriveCollabOutputs(collabs, imageDimensions = new Map()) {
  const visibleCollabs = collabs.map((collab) => ({
    ...collab,
    artworks: collab.artworks
      .filter(({ showInCollabs }) => showInCollabs)
      .map((artwork) => ({
        ...artwork,
        imageDimensions: imageDimensions.get(artwork.assetBase) ?? {
          width: 720,
          height: artwork.orientation === 'portrait' ? 1014 : 510,
        },
      })),
  }));
  return {
    collabs: visibleCollabs,
    assets: visibleCollabs.flatMap(({ id: collabGroup, artworks }) =>
      artworks.map(
        ({
          id,
          order,
          collabGroup: artworkGroup,
          showInProductSearch,
          showInCommissions,
          showInCollabs,
          ...artwork
        }) => ({
          ...artwork,
          id,
          order,
          collabGroup: artworkGroup ?? collabGroup,
          showInProductSearch,
          showInCommissions,
          showInCollabs,
        }),
      ),
    ),
  };
}

export async function buildMetadata({ root = projectRoot } = {}) {
  const sourcePath = path.join(root, 'content', 'artworks.yaml');
  const manifest = parse(await readFile(sourcePath, 'utf8'));
  const registry = validateMockupRegistry(JSON.parse(await readFile(registryPath(root), 'utf8')));
  const products = validateProductManifest(manifest, registry);
  const collabs = validateCollabManifest(manifest.collabs);
  const artworks = products.filter(({ family }) => family === 'artwork');
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
      if (width && height) imageDimensions.set(`artwork:${artwork.assetBase}`, { width, height });
    } catch {
      // New artwork can use the orientation fallback until its derivatives are generated.
    }
  }
  const greetingCards = products.filter(({ family }) => family === 'greeting-card');
  for (const card of greetingCards) {
    const derivative = path.join(
      root,
      'public',
      'images',
      'greeting-cards',
      card.assetBase,
      'search-720.jpg',
    );
    try {
      const { width, height } = await sharp(derivative).metadata();
      if (width && height)
        imageDimensions.set(`greeting-card:${card.assetBase}`, { width, height });
    } catch {
      // New cards can use the fixed 4:3 search-image fallback until their derivatives are generated.
    }
  }
  const outputs = deriveOutputs(products, registry, imageDimensions);
  const collabImageDimensions = new Map();
  for (const collab of collabs) {
    for (const artwork of collab.artworks) {
      const derivative = path.join(
        root,
        'public',
        'images',
        'collabs',
        collab.id,
        artwork.assetBase,
        'flat-720.jpg',
      );
      try {
        const { width, height } = await sharp(derivative).metadata();
        if (width && height) collabImageDimensions.set(artwork.assetBase, { width, height });
      } catch {
        // New collab artwork uses its orientation fallback until its derivatives are generated.
      }
    }
  }
  const collabOutputs = deriveCollabOutputs(collabs, collabImageDimensions);
  await writeGeneratedJson(path.join(root, 'src', 'data', 'artworks.json'), {
    ...generated,
    artworks: outputs.catalogue,
  });
  await writeGeneratedJson(path.join(root, 'src', 'data', 'greeting-cards.json'), {
    ...generated,
    greetingCards: outputs.greetingCardCatalogue,
  });
  await writeGeneratedJson(path.join(root, 'data', 'assets', 'artworks.json'), outputs.assets);
  await writeGeneratedJson(path.join(root, 'data', 'assets', 'greeting-cards.json'), {
    ...generated,
    cards: outputs.assets.greetingCards,
  });
  await writeGeneratedJson(path.join(root, 'src', 'data', 'collabs.json'), {
    ...generated,
    collabs: collabOutputs.collabs,
  });
  await writeGeneratedJson(path.join(root, 'data', 'assets', 'collabs.json'), {
    ...generated,
    provenance:
      'Optimised, watermarked-on-display derivatives generated from approved Google Drive masters. Production masters are never committed or served.',
    artworks: collabOutputs.assets,
  });
  return outputs;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  await buildMetadata();
  console.log('Generated catalogue and asset metadata.');
}
