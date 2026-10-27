import { describe, expect, it } from 'vitest';
import { collabs, validateCollabs } from './collabs';
import generatedCollabs from '../data/collabs.json';

describe('collab catalogue', () => {
  it('groups the six Comfort Season works in editorial order with their natural orientations', () => {
    const comfortSeason = collabs[0];
    expect(comfortSeason).toMatchObject({
      id: 'comfort-season-cotswolds',
      partner: 'Comfort Season Ltd',
      propertyName: 'The Minstrels',
      placeName: 'Moreton-in-Marsh, The Cotswolds',
      reelPoster: '/images/collabs/comfort-season-cotswolds/reel-cover.jpg',
    });
    expect(comfortSeason.artworks.map(({ title }) => title)).toEqual([
      'Bliss Tweed Mill',
      'Minster Lovell Road',
      'Snowshill at Broadway',
      'The Everyday Cotswolds',
      'The Old Swan Pub',
      'The Cotswolds Doorway',
    ]);
    expect(comfortSeason.artworks.map(({ orientation }) => orientation)).toEqual([
      'landscape',
      'landscape',
      'landscape',
      'landscape',
      'portrait',
      'portrait',
    ]);
    expect(comfortSeason.artworks[5]).toMatchObject({
      placeName: 'Stow-on-the-Wold',
      mapsQuery: "St Edward's Church, Stow-on-the-Wold, Gloucestershire, United Kingdom",
    });
    expect(
      comfortSeason.artworks.every(
        ({ showInProductSearch, showInCommissions, showInCollabs }) =>
          !showInProductSearch && !showInCommissions && showInCollabs,
      ),
    ).toBe(true);
    expect(comfortSeason.artworks.every(({ imageDimensions }) => imageDimensions.height > 0)).toBe(
      true,
    );
    expect(comfortSeason.artworks.every(({ mapsQuery }) => mapsQuery.trim().length > 0)).toBe(true);
    expect(comfortSeason.artworks.every((artwork) => !('price' in artwork))).toBe(true);
  });

  it('rejects a work assigned to a different collab group or a commerce visibility flag', () => {
    const [collab] = generatedCollabs.collabs;
    expect(() =>
      validateCollabs([
        { ...collab, artworks: [{ ...collab.artworks[0], collabGroup: 'another-collab' }] },
      ]),
    ).toThrow('invalid visibility or group metadata');
    expect(() =>
      validateCollabs([
        { ...collab, artworks: [{ ...collab.artworks[0], showInProductSearch: true }] },
      ]),
    ).toThrow('invalid visibility or group metadata');
  });

  it('rejects missing collaboration manifests and malformed group fields', () => {
    expect(() => validateCollabs(null)).toThrow('at least one collaboration');
    expect(() => validateCollabs([])).toThrow('at least one collaboration');
    expect(() => validateCollabs([null])).toThrow('must be an object');
    expect(() => validateCollabs([{ ...collabs[0], title: '' }])).toThrow('invalid title');
    expect(() => validateCollabs([{ ...collabs[0], id: 'Invalid Id' }])).toThrow(
      'invalid or duplicate id',
    );
    expect(() => validateCollabs([collabs[0], collabs[0]])).toThrow('invalid or duplicate id');
    expect(() => validateCollabs([{ ...collabs[0], websiteUrl: 'http://example.com' }])).toThrow(
      'invalid websiteUrl',
    );
    expect(() => validateCollabs([{ ...collabs[0], websiteRedirect: 'https://bad/path' }])).toThrow(
      'invalid websiteRedirect',
    );
    expect(() => validateCollabs([{ ...collabs[0], reelUrl: 'not a URL' }])).toThrow(
      'invalid reelUrl',
    );
    expect(() => validateCollabs([{ ...collabs[0], reelPoster: '/images/other.jpg' }])).toThrow(
      'invalid reelPoster',
    );
    expect(() => validateCollabs([{ ...collabs[0], instagramRedirect: '//bad/path' }])).toThrow(
      'invalid instagramRedirect',
    );
    expect(() => validateCollabs([{ ...collabs[0], artworks: [] }])).toThrow(
      'must contain artwork',
    );
    expect(() => validateCollabs([{ ...collabs[0], artworks: [null] }])).toThrow(
      'must be an object',
    );
  });

  it('rejects malformed artwork records before they can reach the gallery', () => {
    const collab = generatedCollabs.collabs[0];
    const work = collab.artworks[0];
    const invalid = (changes: Record<string, unknown>) =>
      validateCollabs([{ ...collab, artworks: [{ ...work, ...changes }] }]);

    expect(() => invalid({ alt: '' })).toThrow('invalid alt');
    expect(() => invalid({ mapsQuery: '' })).toThrow('invalid mapsQuery');
    expect(() => invalid({ id: 'Invalid Id' })).toThrow('invalid or duplicate id');
    expect(() => invalid({ assetBase: '../unsafe' })).toThrow('invalid or duplicate assetBase');
    expect(() => invalid({ orientation: 'square' })).toThrow('invalid orientation');
    expect(() => invalid({ order: 0 })).toThrow('invalid order');
    expect(() => invalid({ watermark: 'none' })).toThrow('invalid watermark profile');
    expect(() => invalid({ imageDimensions: { width: 0, height: 512 } })).toThrow(
      'invalid image dimensions',
    );
    expect(() => invalid({ driveFileId: '' })).toThrow('invalid driveFileId');
    expect(() =>
      validateCollabs([
        {
          ...collab,
          artworks: [work, { ...work, id: 'duplicate-asset', order: 2 }],
        },
      ]),
    ).toThrow('invalid or duplicate assetBase');
  });
});
