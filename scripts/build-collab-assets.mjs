import { access, mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { resolveDriveMasterPath } from './drive-masters.mjs';

export const COLLAB_IMAGE_WIDTHS = [720, 1440];
export const projectRoot = path.resolve(import.meta.dirname, '..');

export async function writeCollabArtworkDerivatives(masterPath, outputDirectory, artwork) {
  const input = sharp(masterPath, { failOn: 'error' });
  const metadata = await input.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Master for ${artwork.title} has invalid image dimensions.`);
  }
  const portrait = metadata.height > metadata.width;
  if ((artwork.orientation === 'portrait') !== portrait) {
    throw new Error(`Master orientation does not match artwork "${artwork.title}".`);
  }
  await mkdir(outputDirectory, { recursive: true });
  for (const width of COLLAB_IMAGE_WIDTHS) {
    await sharp(masterPath, { failOn: 'error' })
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(path.join(outputDirectory, `flat-${width}.jpg`));
  }
  return { width: metadata.width, height: metadata.height };
}

export async function buildCollabAssets({ root = projectRoot, driveRoots } = {}) {
  const manifestPath = path.join(root, 'data', 'assets', 'collabs.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.artworks) || manifest.artworks.length === 0) {
    throw new Error('Collab asset metadata must contain at least one artwork.');
  }
  const imagesRoot = path.join(root, 'public', 'images');
  const stagingRoot = await mkdtemp(path.join(imagesRoot, '.collab-assets-stage-'));
  const processed = [];
  try {
    for (const artwork of manifest.artworks) {
      const masterPath = await resolveDriveMasterPath(artwork, { driveRoots });
      const stagedDirectory = path.join(
        stagingRoot,
        'output',
        artwork.collabGroup,
        artwork.assetBase,
      );
      const dimensions = await writeCollabArtworkDerivatives(masterPath, stagedDirectory, artwork);
      processed.push({ artwork, stagedDirectory, dimensions });
    }

    const published = [];
    try {
      for (const entry of processed) {
        const destination = path.join(
          imagesRoot,
          'collabs',
          entry.artwork.collabGroup,
          entry.artwork.assetBase,
        );
        const backup = path.join(
          stagingRoot,
          'backup',
          entry.artwork.collabGroup,
          entry.artwork.assetBase,
        );
        await mkdir(path.dirname(destination), { recursive: true });
        try {
          await access(destination);
          await mkdir(path.dirname(backup), { recursive: true });
          await rename(destination, backup);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
        published.push({ destination, backup });
        await rename(entry.stagedDirectory, destination);
      }
    } catch (error) {
      for (const { destination, backup } of published.reverse()) {
        await rm(destination, { recursive: true, force: true });
        try {
          await rename(backup, destination);
        } catch (restoreError) {
          if (restoreError.code !== 'ENOENT') throw restoreError;
        }
      }
      throw error;
    }
    for (const { artwork, dimensions } of processed) {
      process.stdout.write(
        `Built ${COLLAB_IMAGE_WIDTHS.join('px and ')}px images for ${artwork.title} (${dimensions.width}×${dimensions.height})\n`,
      );
    }
  } finally {
    const relative = path.relative(imagesRoot, stagingRoot);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('Collab asset staging path escaped the image workspace.');
    }
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  await buildCollabAssets();
}
