import { describe, expect, it } from 'vitest';
import { deriveOutputs, validateProductManifest } from './build-content-metadata.mjs';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { readMockupRegistry, resolveMockupSelections } from './mockup-registry.mjs';

const source = parse(await readFile(new URL('../content/artworks.yaml', import.meta.url), 'utf8'));
const registry = await readMockupRegistry();

describe('product content metadata', () => {
  it('derives catalogue and asset shapes for each family deterministically', () => {
    const products = validateProductManifest(source, registry);
    const outputs = deriveOutputs(products, registry);
    expect(outputs.catalogue).toHaveLength(19);
    expect(outputs.catalogue.map(({ sku }) => sku)).toEqual(
      expect.arrayContaining(['PS-PR-019', 'PS-PR-020', 'PS-PR-021']),
    );
    expect(outputs.greetingCardCatalogue).toHaveLength(11);
    expect(outputs.catalogue[0]).toMatchObject({
      family: 'artwork',
      price: { small: 7, medium: 14, large: 28 },
      watermark: 'standard',
      mockups: { '7x5': [{ sceneId: '14' }] },
      imageDimensions: { width: 720, height: 510 },
    });
    expect(outputs.assets.artworks[0]).toMatchObject({
      family: 'artwork',
      assetBase: 'flower-bed',
      driveFileId: '1OFz5NoIqnCis4zfcXbBr-KtzmKqZseVh',
      watermark: 'standard',
      mockups: { a3: [{ sceneId: '14' }] },
    });
    expect(outputs.catalogue.find(({ assetBase }) => assetBase === 'beach-huts')?.watermark).toBe(
      'high-contrast',
    );
    expect(
      outputs.assets.artworks.find(({ assetBase }) => assetBase === 'beach-huts')?.watermark,
    ).toBe('high-contrast');
    expect(outputs.greetingCardCatalogue[0]).toMatchObject({
      family: 'greeting-card',
      sku: 'PS-GC-001',
      assetBase: 'bodiam-castle',
      price: 2,
      imageDimensions: { width: 720, height: 540 },
    });
    expect(outputs.greetingCardCatalogue.map(({ assetBase }) => assetBase)).toEqual([
      'bodiam-castle',
      'high-and-over',
      'airbourne',
      'lewes-priory',
      'east-dean',
      'cuckmere-haven',
      'birling-gap',
      'royal-pavilion',
      'battle-abbey',
      'pevensey-castle',
      'church-square-rye',
    ]);
    expect(outputs.assets.greetingCards[0]).toMatchObject({
      family: 'greeting-card',
      driveFileId: '17rkhgD2Eby1lJ_KtMqUVhG5JfWSNuX43',
      panels: { back: { rotation: 270 }, front: { rotation: 90 } },
    });
    expect(JSON.stringify(deriveOutputs(products, registry))).toBe(
      JSON.stringify(deriveOutputs(products, registry)),
    );
  });

  it.each([
    [{ title: '' }, 'invalid title'],
    [{ handle: 'Bad Handle' }, 'invalid handle'],
    [{ handle: 'seven-sisters-wrong-sku-suffix' }, 'invalid handle'],
    [{ family: 'unknown' }, 'invalid family'],
    [{ orientation: 'square' }, 'invalid orientation'],
    [{ watermark: 'unknown' }, 'invalid watermark profile'],
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
    const candidate = { ...source.products[0], ...change };
    expect(() => validateProductManifest({ products: [candidate] }, registry)).toThrow(message);
  });

  it('preserves editorial ordering when an artwork uses multiple scenes at one size', () => {
    const artwork = {
      ...source.products[0],
      mockups: { '7x5': ['13', '01'], A4: ['14'], A3: ['14'] },
    };
    expect(
      resolveMockupSelections(artwork, 0, registry)['7x5'].map(({ sceneId }) => sceneId),
    ).toEqual(['13', '01']);
  });

  it('rejects a scene when its selected orientation and size variant is missing', () => {
    const incompleteScene = {
      ...registry,
      scenes: registry.scenes.map((scene) =>
        scene.id === '14'
          ? {
              ...scene,
              variants: scene.variants.filter((variant) => variant.orientation !== 'landscape'),
            }
          : scene,
      ),
    };
    expect(() => resolveMockupSelections(source.products[0], 0, incompleteScene)).toThrow(
      'scene 14 has no landscape 7x5 mockup variant',
    );
  });

  it('rejects duplicate stable identifiers across families', () => {
    expect(() =>
      validateProductManifest(
        {
          products: [
            source.products[0],
            { ...source.products[1], assetBase: source.products[0].assetBase },
          ],
        },
        registry,
      ),
    ).toThrow('duplicates');
  });

  it('rejects invalid greeting-card price and panel metadata', () => {
    const card = source.products.find(({ family }) => family === 'greeting-card');
    expect(() =>
      validateProductManifest({ products: [{ ...card, price: { single: 2 } }] }, registry),
    ).toThrow('invalid price');
    expect(() =>
      validateProductManifest(
        {
          products: [
            {
              ...card,
              panels: { ...card.panels, front: { ...card.panels.front, left: 1 } },
            },
          ],
        },
        registry,
      ),
    ).toThrow('invalid front panel');
  });

  it('rejects missing manifests and empty collections', () => {
    expect(() => validateProductManifest(null)).toThrow('at least one product');
    expect(() =>
      validateProductManifest({ products: [{ ...source.products[0], collections: [] }] }),
    ).toThrow('collections');
  });
});
