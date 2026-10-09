import { access } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MOCKUP_SIZES,
  mockupFilename,
  readMockupRegistry,
  resolveMockupSelections,
  validateMockupRegistry,
} from './mockup-registry.mjs';
import { validateArtworkManifest } from './build-content-metadata.mjs';
import { parse } from 'yaml';
import { readFile } from 'node:fs/promises';

const registry = await readMockupRegistry();
const source = parse(await readFile(new URL('../content/artworks.yaml', import.meta.url), 'utf8'));

describe('approved mockup registry', () => {
  it('contains 16 stable scenes and 96 measured variants with versioned source images', async () => {
    expect(registry.scenes).toHaveLength(16);
    expect(new Set(registry.scenes.map(({ id }) => id)).size).toBe(16);
    expect(registry.scenes.flatMap(({ variants }) => variants)).toHaveLength(96);
    expect(validateMockupRegistry(registry)).toBe(registry);
    await Promise.all(
      registry.scenes.flatMap((scene) =>
        scene.variants.map(({ template }) =>
          access(
            path.join(
              path.resolve(import.meta.dirname, '..'),
              'scripts/asset-sources/artwork-scenes/approved',
              template,
            ),
          ),
        ),
      ),
    );
  });

  it('rejects a paper rectangle outside its template', () => {
    const invalid = structuredClone(registry);
    invalid.scenes[0].variants[0].paperRectPx.left = 1440;
    expect(() => validateMockupRegistry(invalid)).toThrow('invalid paper rectangle');
  });

  it('rejects a physical paper ratio that differs from the measured rectangle', () => {
    const invalid = structuredClone(registry);
    invalid.scenes[0].variants[0].paperMm = [1, 1];
    expect(() => validateMockupRegistry(invalid)).toThrow('incorrect physical paper dimensions');
  });

  it('rejects unsupported sizes and keeps output paths stable across list order changes', () => {
    expect(mockupFilename('a4', '13', 720)).toBe('mock-a4-13-720.jpg');
    expect(mockupFilename('a4', '13', 1440)).toBe('mock-a4-13-1440.jpg');
    expect(() => mockupFilename('letter', '13', 720)).toThrow('Invalid mockup output path');
    expect(MOCKUP_SIZES).toEqual(['7x5', 'a4', 'a3']);
  });

  it('requires a non-empty list for every product size and validates scene IDs and orientations', () => {
    const artwork = source.artworks[0];
    expect(() =>
      validateArtworkManifest(
        { artworks: [{ ...artwork, mockups: { '7x5': ['15'], A4: ['15'] } }] },
        registry,
      ),
    ).toThrow('empty or missing A3');
    expect(() =>
      resolveMockupSelections(
        { ...artwork, mockups: { '7x5': ['99'], A4: ['15'], A3: ['15'] } },
        0,
        registry,
      ),
    ).toThrow('unknown mockup scene 99');
    expect(() =>
      resolveMockupSelections(
        { ...artwork, mockups: { '7x5': ['15', '15'], A4: ['15'], A3: ['15'] } },
        0,
        registry,
      ),
    ).toThrow('duplicates scene 15');
    const withoutLandscape = {
      ...registry,
      scenes: registry.scenes.map((scene) =>
        scene.id === '15'
          ? {
              ...scene,
              variants: scene.variants.filter(({ orientation }) => orientation === 'portrait'),
            }
          : scene,
      ),
    };
    expect(() => resolveMockupSelections(artwork, 0, withoutLandscape)).toThrow(
      'scene 15 has no landscape 7x5 mockup variant',
    );
  });

  it('preserves multiple scene choices in YAML order per size', () => {
    const selection = resolveMockupSelections(
      { ...source.artworks[0], mockups: { '7x5': ['13', '01'], A4: ['15'], A3: ['15'] } },
      0,
      registry,
    );
    expect(selection['7x5'].map(({ sceneId }) => sceneId)).toEqual(['13', '01']);
  });
});
