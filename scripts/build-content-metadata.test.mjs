import { describe, expect, it } from 'vitest';
import { deriveOutputs, validateArtworkManifest } from './build-content-metadata.mjs';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { readMockupRegistry, resolveMockupSelections } from './mockup-registry.mjs';

const source = parse(await readFile(new URL('../content/artworks.yaml', import.meta.url), 'utf8'));
const registry = await readMockupRegistry();

describe('artwork content metadata', () => {
  it('derives the committed catalogue and asset shapes deterministically', () => {
    const artworks = validateArtworkManifest(source, registry);
    const outputs = deriveOutputs(artworks, registry);
    expect(outputs.catalogue).toHaveLength(16);
    expect(outputs.catalogue[0]).not.toHaveProperty('masterFile');
    expect(outputs.catalogue[0].price).toEqual({ small: 7, medium: 14, large: 28 });
    expect(outputs.catalogue[0].mockups['7x5'].map(({ sceneId }) => sceneId)).toEqual(['15']);
    expect(outputs.catalogue[0].imageDimensions).toMatchObject({ width: 720, height: 510 });
    expect(outputs.assets.artworks[0]).toMatchObject({
      assetBase: 'flower-bed',
      masterFile: 'flower-bed.png',
      mockups: { a3: [{ sceneId: '15' }] },
    });
    expect(JSON.stringify(deriveOutputs(artworks, registry))).toBe(
      JSON.stringify(deriveOutputs(artworks, registry)),
    );
  });

  it.each([
    [{ title: '' }, 'invalid title'],
    [{ handle: 'Bad Handle' }, 'invalid handle'],
    [{ handle: 'seven-sisters-wrong-sku-suffix' }, 'invalid handle'],
    [{ orientation: 'square' }, 'invalid orientation'],
    [{ mockups: { '7x5': [], A4: ['13'], A3: ['13'] } }, 'empty or missing 7x5'],
    [{ mockups: { '7x5': ['99'], A4: ['13'], A3: ['13'] } }, 'unknown mockup scene 99'],
    [{ mockups: { '7x5': ['13', '13'], A4: ['13'], A3: ['13'] } }, 'duplicates scene 13'],
    [{ mockups: { '7x5': ['13'], A4: ['13'] } }, 'empty or missing A3'],
    [
      { mockups: { '7x5': ['13'], A4: ['13'], A3: ['13'] }, orientation: 'square' },
      'invalid orientation',
    ],
    [{ price: { small: 7, medium: 0, large: 28 } }, 'invalid price'],
    [{ price: { small: 7, medium: 14 } }, 'invalid price'],
  ])('rejects invalid artwork fields: %s', (change, message) => {
    const candidate = { ...source.artworks[0], ...change };
    expect(() => validateArtworkManifest({ artworks: [candidate] }, registry)).toThrow(message);
  });

  it('preserves editorial ordering when an artwork uses multiple scenes at one size', () => {
    const artwork = {
      ...source.artworks[0],
      mockups: { '7x5': ['13', '01'], A4: ['15'], A3: ['15'] },
    };
    expect(
      resolveMockupSelections(artwork, 0, registry)['7x5'].map(({ sceneId }) => sceneId),
    ).toEqual(['13', '01']);
  });

  it('rejects a scene when its selected orientation and size variant is missing', () => {
    const incompleteScene = {
      ...registry,
      scenes: registry.scenes.map((scene) =>
        scene.id === '15'
          ? {
              ...scene,
              variants: scene.variants.filter((variant) => variant.orientation !== 'landscape'),
            }
          : scene,
      ),
    };
    expect(() => resolveMockupSelections(source.artworks[0], 0, incompleteScene)).toThrow(
      'scene 15 has no landscape 7x5 mockup variant',
    );
  });

  it('rejects duplicate stable identifiers', () => {
    expect(() =>
      validateArtworkManifest({
        artworks: [
          source.artworks[0],
          { ...source.artworks[1], assetBase: source.artworks[0].assetBase },
        ],
      }),
    ).toThrow('duplicates');
  });

  it('rejects missing manifests and empty collections', () => {
    expect(() => validateArtworkManifest(null)).toThrow('at least one artwork');
    expect(() =>
      validateArtworkManifest({ artworks: [{ ...source.artworks[0], collections: [] }] }),
    ).toThrow('collections');
  });
});
