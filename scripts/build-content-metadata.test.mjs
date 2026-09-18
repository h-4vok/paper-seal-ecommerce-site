import { describe, expect, it } from 'vitest';
import { deriveOutputs, validateArtworkManifest } from './build-content-metadata.mjs';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const source = parse(await readFile(new URL('../content/artworks.yaml', import.meta.url), 'utf8'));

describe('artwork content metadata', () => {
  it('derives the committed catalogue and asset shapes deterministically', () => {
    const artworks = validateArtworkManifest(source);
    const outputs = deriveOutputs(artworks);
    expect(outputs.catalogue).toHaveLength(17);
    expect(outputs.catalogue[0]).not.toHaveProperty('masterFile');
    expect(outputs.assets.artworks[0]).toMatchObject({
      assetBase: 'flower-bed',
      masterFile: 'flower-bed.png',
    });
    expect(JSON.stringify(deriveOutputs(artworks))).toBe(JSON.stringify(deriveOutputs(artworks)));
  });

  it.each([
    [{ title: '' }, 'invalid title'],
    [{ handle: 'bad' }, 'invalid handle'],
    [{ orientation: 'square' }, 'invalid orientation'],
    [{ gallery: ['master'] }, 'invalid gallery'],
    [{ roomScene: { template: 'x', fit: 'cover', placement: { left: 1 } } }, 'placement'],
  ])('rejects invalid artwork fields: %s', (change, message) => {
    const candidate = { ...source.artworks[0], ...change };
    expect(() => validateArtworkManifest({ artworks: [candidate] })).toThrow(message);
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
