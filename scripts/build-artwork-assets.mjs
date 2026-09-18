import { access, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const projectRoot = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(
  await readFile(path.join(projectRoot, 'data', 'assets', 'artworks.json'), 'utf8'),
);
const masterDirectory = process.env.PAPERSEAL_MASTER_DIR;

if (!masterDirectory) {
  throw new Error('Set PAPERSEAL_MASTER_DIR to the approved local master directory.');
}

const formats = [
  ['jpg', 'jpeg', { quality: 86, mozjpeg: true }],
  ['webp', 'webp', { quality: 84, effort: 5 }],
  ['avif', 'avif', { quality: 62, effort: 5 }],
];

const textureSvg = (width, height, tone) =>
  Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="23"/><feColorMatrix values="0 0 0 0 .45 0 0 0 0 .40 0 0 0 0 .34 0 0 0 .08 0"/></filter>
    <rect width="100%" height="100%" fill="${tone}"/><rect width="100%" height="100%" filter="url(#paper)" opacity=".32"/>
  </svg>`);

const botanicalsSvg = (width, height) =>
  Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <g fill="none" stroke="#40513d" stroke-width="8" stroke-linecap="round" opacity=".82">
      <path d="M125 ${height} Q155 ${height * 0.62} 260 ${height * 0.38}"/><path d="M145 ${height * 0.8}q-85-70-75-155"/><path d="M170 ${height * 0.68}q105-65 128-145"/>
    </g>
    <g fill="#586c4d" opacity=".88"><ellipse cx="85" cy="${height * 0.62}" rx="36" ry="75" transform="rotate(-35 85 ${height * 0.62})"/><ellipse cx="235" cy="${height * 0.52}" rx="36" ry="82" transform="rotate(38 235 ${height * 0.52})"/><ellipse cx="165" cy="${height * 0.73}" rx="42" ry="88" transform="rotate(18 165 ${height * 0.73})"/></g>
    <rect x="62" y="${height - 205}" width="180" height="205" rx="34" fill="#b8a78e"/><path d="M62 ${height - 155}h180" stroke="#938069" stroke-width="5" opacity=".55"/>
  </svg>`);

const shadowSvg = (width, height, radius = 30) =>
  Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><filter id="s" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="26" stdDeviation="${radius}" flood-color="#241d17" flood-opacity=".28"/></filter></defs><rect x="55" y="35" width="${width - 110}" height="${height - 120}" rx="5" fill="#f7f1e7" filter="url(#s)"/></svg>`);

async function compose(masterPath, kind, orientation) {
  const canvas = { width: 1600, height: 1200 };
  const portrait = orientation === 'portrait';
  const artBox =
    kind === 'detail'
      ? { width: portrait ? 610 : 1120, height: portrait ? 930 : 720 }
      : { width: portrait ? 560 : 1020, height: portrait ? 880 : 640 };
  const art = await sharp(masterPath)
    .resize({ ...artBox, fit: 'contain', background: '#ebe6dc' })
    .jpeg({ quality: 94, mozjpeg: true })
    .toBuffer();

  if (kind === 'detail') {
    const paperWidth = artBox.width + 150;
    const paperHeight = artBox.height + 190;
    const left = Math.round((canvas.width - paperWidth) / 2);
    const top = Math.round((canvas.height - paperHeight) / 2);
    return sharp(textureSvg(canvas.width, canvas.height, '#d8c8b6'))
      .composite([
        { input: shadowSvg(paperWidth, paperHeight, 24), left, top },
        { input: art, left: left + 75, top: top + 70 },
        {
          input: Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${paperWidth}" height="90"><text x="75" y="55" fill="#0b2541" font-family="Georgia" font-size="28" letter-spacing="4">PAPERSEAL · EAST SUSSEX</text><path d="M${paperWidth - 190} 50h110" stroke="#9b8a75" stroke-width="2"/></svg>`,
          ),
          left,
          top: top + paperHeight - 105,
        },
      ])
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
  }

  const frameWidth = artBox.width + 160;
  const frameHeight = artBox.height + 180;
  const left = Math.round((canvas.width - frameWidth) / 2) + (kind === 'room' ? 75 : 0);
  const top = kind === 'room' ? 115 : Math.round((canvas.height - frameHeight) / 2);
  const composites = [
    { input: shadowSvg(frameWidth, frameHeight), left, top },
    { input: art, left: left + 80, top: top + 70 },
  ];
  if (kind === 'room') {
    composites.unshift({ input: botanicalsSvg(340, 610), left: 0, top: 590 });
    composites.push({
      input: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="180"><rect width="1600" height="180" fill="#775b42"/><rect y="8" width="1600" height="9" fill="#9b7958" opacity=".55"/></svg>',
      ),
      left: 0,
      top: 1050,
    });
  }
  return sharp(textureSvg(canvas.width, canvas.height, kind === 'room' ? '#cec0af' : '#e5d9c9'))
    .composite(composites)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

for (const artwork of manifest.artworks) {
  const masterPath = path.join(masterDirectory, artwork.masterFile);
  await access(masterPath);
  const outputDirectory = path.join(projectRoot, 'public', 'images', 'artworks', artwork.assetBase);
  await mkdir(outputDirectory, { recursive: true });

  for (const kind of ['room', 'mounted', 'detail']) {
    const composite = await compose(masterPath, kind, artwork.orientation);
    for (const width of [720, 1440]) {
      for (const [extension, method, options] of formats) {
        const outputPath = path.join(outputDirectory, `${kind}-${width}.${extension}`);
        await sharp(composite)
          .resize({ width, withoutEnlargement: true })
          [method](options)
          .toFile(outputPath);
      }
    }
  }
  process.stdout.write(`Built display derivatives for ${artwork.assetBase}\n`);
}
