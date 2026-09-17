import { access, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const projectRoot = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(projectRoot, 'data', 'assets', 'home-scenes.json');
const masterDirectory = process.env.PAPERSEAL_MASTER_DIR;

if (!masterDirectory) {
  throw new Error(
    'Set PAPERSEAL_MASTER_DIR to a local directory containing the approved production masters.',
  );
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

for (const scene of manifest.scenes) {
  const scenePath = path.join(projectRoot, scene.scene);
  const masterPath = path.join(masterDirectory, scene.masterFile);
  const outputPath = path.join(projectRoot, scene.output);

  await Promise.all([access(scenePath), access(masterPath)]);
  await mkdir(path.dirname(outputPath), { recursive: true });

  const { left, top, width, height } = scene.placement;
  const artwork = await sharp(masterPath)
    .resize({ width, height, fit: 'contain', background: '#e7e5e0' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  await sharp(scenePath)
    .composite([{ input: artwork, left, top }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(outputPath);

  process.stdout.write(`Built ${path.relative(projectRoot, outputPath)}\n`);
}
