import generatedCollabs from '../data/collabs.json';
import type { Orientation, WatermarkProfile } from './catalogue';

export interface CollabArtwork {
  id: string;
  collabGroup: string;
  showInProductSearch: false;
  showInCommissions: false;
  showInCollabs: true;
  order: number;
  title: string;
  description: string;
  placeName: string;
  mapsQuery: string;
  orientation: Orientation;
  alt: string;
  assetBase: string;
  driveFileId: string;
  watermark: WatermarkProfile;
  imageDimensions: { width: number; height: number };
}

export interface CollabGroup {
  id: string;
  title: string;
  partner: string;
  propertyName: string;
  placeName: string;
  story: string;
  websiteUrl: string;
  websiteRedirect: string;
  instagramRedirect: string;
  reelUrl: string;
  artworks: CollabArtwork[];
}

export function validateCollabs(input: unknown): CollabGroup[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('Collab catalogue must contain at least one collaboration.');
  }
  const ids = new Set<string>();
  const assetBases = new Set<string>();
  return input.map((candidate, index) => {
    if (!candidate || typeof candidate !== 'object') {
      throw new Error(`Collab ${index + 1} must be an object.`);
    }
    const item = candidate as Record<string, unknown>;
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
      if (typeof item[field] !== 'string' || !item[field].trim()) {
        throw new Error(`Collab ${index + 1} has an invalid ${field}.`);
      }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id as string) || ids.has(item.id as string)) {
      throw new Error(`Collab ${index + 1} has an invalid or duplicate id.`);
    }
    for (const field of ['websiteUrl', 'reelUrl']) {
      try {
        if (new URL(item[field] as string).protocol !== 'https:') throw new Error();
      } catch {
        throw new Error(`Collab ${index + 1} has an invalid ${field}.`);
      }
    }
    if (!/^\/redirect\/[a-z0-9-]+$/.test(item.instagramRedirect as string)) {
      throw new Error(`Collab ${index + 1} has an invalid instagramRedirect.`);
    }
    if (!/^\/redirect\/[a-z0-9-]+$/.test(item.websiteRedirect as string)) {
      throw new Error(`Collab ${index + 1} has an invalid websiteRedirect.`);
    }
    if (!Array.isArray(item.artworks) || item.artworks.length === 0) {
      throw new Error(`Collab ${index + 1} must contain artwork.`);
    }
    const artworkIds = new Set<string>();
    const artworks = item.artworks.map((candidateArtwork, artworkIndex) => {
      if (!candidateArtwork || typeof candidateArtwork !== 'object') {
        throw new Error(`Collab ${index + 1} artwork ${artworkIndex + 1} must be an object.`);
      }
      const artwork = candidateArtwork as Record<string, unknown>;
      for (const field of [
        'id',
        'title',
        'description',
        'placeName',
        'mapsQuery',
        'alt',
        'assetBase',
      ]) {
        if (typeof artwork[field] !== 'string' || !artwork[field].trim()) {
          throw new Error(
            `Collab ${index + 1} artwork ${artworkIndex + 1} has an invalid ${field}.`,
          );
        }
      }
      if (
        typeof artwork.id !== 'string' ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artwork.id) ||
        artworkIds.has(artwork.id)
      ) {
        throw new Error(
          `Collab ${index + 1} artwork ${artworkIndex + 1} has an invalid or duplicate id.`,
        );
      }
      if (
        artwork.collabGroup !== item.id ||
        artwork.showInProductSearch !== false ||
        artwork.showInCommissions !== false ||
        artwork.showInCollabs !== true
      ) {
        throw new Error(
          `Collab ${index + 1} artwork ${artworkIndex + 1} has invalid visibility or group metadata.`,
        );
      }
      if (
        typeof artwork.assetBase !== 'string' ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artwork.assetBase) ||
        assetBases.has(artwork.assetBase)
      ) {
        throw new Error(
          `Collab ${index + 1} artwork ${artworkIndex + 1} has an invalid or duplicate assetBase.`,
        );
      }
      if (artwork.orientation !== 'landscape' && artwork.orientation !== 'portrait') {
        throw new Error(
          `Collab ${index + 1} artwork ${artworkIndex + 1} has an invalid orientation.`,
        );
      }
      if (!Number.isInteger(artwork.order) || Number(artwork.order) < 1) {
        throw new Error(`Collab ${index + 1} artwork ${artworkIndex + 1} has an invalid order.`);
      }
      if (artwork.watermark !== 'standard' && artwork.watermark !== 'high-contrast') {
        throw new Error(
          `Collab ${index + 1} artwork ${artworkIndex + 1} has an invalid watermark profile.`,
        );
      }
      const dimensions = artwork.imageDimensions as Record<string, unknown> | undefined;
      if (
        !dimensions ||
        !Number.isInteger(dimensions.width) ||
        Number(dimensions.width) <= 0 ||
        !Number.isInteger(dimensions.height) ||
        Number(dimensions.height) <= 0
      ) {
        throw new Error(
          `Collab ${index + 1} artwork ${artworkIndex + 1} has invalid image dimensions.`,
        );
      }
      if (typeof artwork.driveFileId !== 'string' || !artwork.driveFileId.trim()) {
        throw new Error(
          `Collab ${index + 1} artwork ${artworkIndex + 1} has an invalid driveFileId.`,
        );
      }
      artworkIds.add(artwork.id);
      assetBases.add(artwork.assetBase);
      return artwork as unknown as CollabArtwork;
    });
    ids.add(item.id as string);
    return {
      ...(item as unknown as Omit<CollabGroup, 'artworks'>),
      artworks: artworks.sort((left, right) => left.order - right.order),
    };
  });
}

export const collabs = validateCollabs(generatedCollabs.collabs);
