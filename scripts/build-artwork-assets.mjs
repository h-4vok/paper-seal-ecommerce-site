import { access, cp, mkdir, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { resolveDriveMasterPath } from './drive-masters.mjs';
import {
  MOCKUP_SIZES,
  MOCKUP_WIDTHS,
  mockupFilename,
  resolveMockupSelections,
  validateMockupRegistry,
} from './mockup-registry.mjs';

export const projectRoot = path.resolve(import.meta.dirname, '..');
export const CATALOGUE_WIDTHS = [480, 960, 1440];

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readImageMetadata(filePath, label) {
  try {
    return await sharp(filePath, { failOn: 'error' }).metadata();
  } catch (error) {
    throw new Error(`Could not read ${label}: ${error.message}`, { cause: error });
  }
}

export async function validateAssetInputs({ root = projectRoot, manifest, registry, driveRoots }) {
  const validatedRegistry = validateMockupRegistry(registry);
  if (!Array.isArray(manifest.artworks) || manifest.artworks.length === 0) {
    throw new Error('Asset metadata must contain at least one artwork.');
  }
  const templatePaths = new Set(
    validatedRegistry.scenes.flatMap((scene) => scene.variants.map(({ template }) => template)),
  );
  for (const [index, artwork] of manifest.artworks.entries()) {
    resolveMockupSelections(artwork, index, validatedRegistry);
  }

  const inputs = [];
  for (const artwork of manifest.artworks) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artwork.assetBase)) {
      throw new Error(`Artwork ${artwork.title} has an invalid asset base.`);
    }
    const masterPath = await resolveDriveMasterPath(artwork, { driveRoots });
    const masterMetadata = await readImageMetadata(
      masterPath,
      `master for artwork "${artwork.title}"`,
    );
    if (!masterMetadata.width || !masterMetadata.height) {
      throw new Error(`Master for artwork "${artwork.title}" has invalid dimensions.`);
    }
    const isPortrait = masterMetadata.height > masterMetadata.width;
    if ((artwork.orientation === 'portrait') !== isPortrait) {
      throw new Error(
        `Master orientation does not match artwork "${artwork.title}" in the content manifest.`,
      );
    }
    inputs.push({ artwork, masterPath, masterMetadata });
  }

  for (const relativePath of templatePaths) {
    const templatePath = path.join(
      root,
      'scripts',
      'asset-sources',
      'artwork-scenes',
      'approved',
      relativePath,
    );
    if (!(await fileExists(templatePath))) {
      throw new Error(
        `Missing approved template for scene ${relativePath.split(path.sep)[0]}: ${templatePath}`,
      );
    }
    const metadata = await readImageMetadata(
      templatePath,
      `approved mockup template ${relativePath}`,
    );
    const [expectedWidth, expectedHeight] = validatedRegistry.outputPixels ?? [];
    if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
      throw new Error(
        `Approved template ${relativePath} is ${metadata.width}×${metadata.height}; expected ${expectedWidth}×${expectedHeight}.`,
      );
    }
  }
  return { inputs, registry: validatedRegistry, root };
}

export async function composeMockup(masterPath, templatePath, paperRectPx, artwork, sceneId, size) {
  let art = sharp(masterPath, { failOn: 'error' }).resize({
    width: paperRectPx.width,
    height: paperRectPx.height,
    fit: 'cover',
    position: sharp.strategy.attention,
  });
  const { data, info } = await art.png().toBuffer({ resolveWithObject: true });
  if (info.width !== paperRectPx.width || info.height !== paperRectPx.height) {
    throw new Error(
      `Artwork "${artwork.title}" did not fill the ${size} paper rectangle in scene ${sceneId}.`,
    );
  }
  try {
    const output = await sharp(templatePath, { failOn: 'error' })
      .composite([{ input: data, left: paperRectPx.left, top: paperRectPx.top }])
      .jpeg({ quality: 94, mozjpeg: true })
      .toBuffer();
    const metadata = await sharp(output).metadata();
    if (metadata.width !== 1440 || metadata.height !== 1080) {
      throw new Error(`Mockup for artwork "${artwork.title}" scene ${sceneId} is not 4:3.`);
    }
    return output;
  } catch (error) {
    throw new Error(
      `Could not compose artwork "${artwork.title}" with scene ${sceneId} at ${size}: ${error.message}`,
      { cause: error },
    );
  }
}

async function writeDerivatives(image, outputDirectory, filenameForWidth) {
  for (const width of MOCKUP_WIDTHS) {
    await image
      .clone()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 94, mozjpeg: true })
      .toFile(path.join(outputDirectory, filenameForWidth(width)));
  }
}

export async function writeCatalogueDerivatives(masterPath, outputDirectory) {
  const image = sharp(masterPath, { failOn: 'error' });
  const metadata = await image.metadata();
  if ((metadata.width ?? 0) < 1440 || (metadata.height ?? 0) < 1080) {
    throw new Error(`Catalogue master must be at least 1440×1080: ${masterPath}`);
  }

  const crop = await image
    .resize(1440, 1080, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  for (const width of CATALOGUE_WIDTHS) {
    const resized = sharp(crop).resize(width, (width * 3) / 4);
    await resized
      .clone()
      .webp({ quality: 82, effort: 5 })
      .toFile(path.join(outputDirectory, `card-${width}.webp`));
    await resized
      .clone()
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(path.join(outputDirectory, `card-${width}.jpg`));
  }
}

async function publishStagedDirectories(stagingRoot, publicDirectory, stagedDirectoryNames) {
  const backupRoot = path.join(stagingRoot, 'backup');
  await mkdir(backupRoot, { recursive: true });
  const journal = [];
  try {
    for (const name of stagedDirectoryNames) {
      const destination = path.join(publicDirectory, name);
      const staged = path.join(stagingRoot, 'output', name);
      const backup = path.join(backupRoot, name);
      const hadPrevious = await fileExists(destination);
      if (hadPrevious) await rename(destination, backup);
      journal.push({ destination, backup, staged, hadPrevious, published: false });
      await rename(staged, destination);
      journal.at(-1).published = true;
    }
  } catch (error) {
    for (const entry of journal.reverse()) {
      if (entry.published) await rm(entry.destination, { recursive: true, force: true });
      if (entry.hadPrevious && (await fileExists(entry.backup)))
        await rename(entry.backup, entry.destination);
    }
    throw error;
  }
}

export async function buildArtworkAssets({
  root = projectRoot,
  manifest,
  registry,
  driveRoots,
} = {}) {
  if (!manifest) {
    manifest = JSON.parse(
      await readFile(path.join(root, 'data', 'assets', 'artworks.json'), 'utf8'),
    );
  }
  if (manifest.generated !== true || !Array.isArray(manifest.artworks)) {
    throw new Error(
      'Asset metadata is generated and must be rebuilt with `bun run content:build:metadata`.',
    );
  }
  if (!registry) {
    registry = JSON.parse(
      await readFile(
        path.join(root, 'scripts', 'asset-sources', 'artwork-scenes', 'approved', 'manifest.json'),
        'utf8',
      ),
    );
  }

  const inputs = await validateAssetInputs({ root, manifest, registry, driveRoots });
  const outputDirectoryRoot = path.join(root, 'public', 'images', 'artworks');
  const templatesDirectory = path.join(
    root,
    'scripts',
    'asset-sources',
    'artwork-scenes',
    'approved',
  );
  const stagingRoot = path.join(root, 'public', 'images', `.artworks-stage-${process.pid}`);
  await rm(stagingRoot, { recursive: true, force: true });
  const stagedRoot = path.join(stagingRoot, 'output');
  await mkdir(stagedRoot, { recursive: true });
  try {
    for (const { artwork, masterPath } of inputs.inputs) {
      const outputDirectory = path.join(stagedRoot, artwork.assetBase);
      await mkdir(outputDirectory, { recursive: true });
      const previousDirectory = path.join(outputDirectoryRoot, artwork.assetBase);
      if (await fileExists(previousDirectory)) {
        await cp(previousDirectory, outputDirectory, { recursive: true, force: true });
      }
      const flat = sharp(masterPath, { failOn: 'error' }).resize({
        width: 2400,
        withoutEnlargement: true,
      });
      await writeDerivatives(flat, outputDirectory, (width) => `flat-${width}.jpg`);
      await writeCatalogueDerivatives(masterPath, outputDirectory);
      const selections = artwork.mockups;
      for (const size of MOCKUP_SIZES) {
        for (const selection of selections[size]) {
          const scene = inputs.registry.scenes.find(({ id }) => id === selection.sceneId);
          const variant = scene.variants.find(
            ({ orientation, size: variantSize }) =>
              orientation === artwork.orientation && variantSize === size,
          );
          const templatePath = path.join(templatesDirectory, variant.template);
          const composite = await composeMockup(
            masterPath,
            templatePath,
            variant.paperRectPx,
            artwork,
            selection.sceneId,
            size,
          );
          await writeDerivatives(sharp(composite), outputDirectory, (width) =>
            mockupFilename(size, selection.sceneId, width),
          );
        }
      }
      process.stdout.write(
        `Built flat and catalogue images plus ${Object.values(selections).flat().length} selected mockups for ${artwork.assetBase}\n`,
      );
    }
    await mkdir(outputDirectoryRoot, { recursive: true });
    await publishStagedDirectories(
      stagingRoot,
      outputDirectoryRoot,
      inputs.inputs.map(({ artwork }) => artwork.assetBase),
    );
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  await buildArtworkAssets();
}
