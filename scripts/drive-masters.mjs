import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const windowsDriveLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

async function discoverDriveMetadataDatabases({ localAppData, platform = process.platform } = {}) {
  if (platform !== 'win32' || !localAppData) return [];

  const accountsDirectory = path.join(localAppData, 'Google', 'DriveFS');
  try {
    const entries = await readdir(accountsDirectory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
      .map((entry) => path.join(accountsDirectory, entry.name, 'metadata_sqlite_db'));
  } catch {
    return [];
  }
}

async function discoverDriveMounts({ platform = process.platform } = {}) {
  if (platform !== 'win32') return [];
  const candidates = windowsDriveLetters.split('').map((letter) => `${letter}:\\My Drive`);
  const mounts = [];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      mounts.push(candidate);
    } catch {
      // This drive letter is not a mounted Google Drive.
    }
  }
  return mounts;
}

function findPathInDriveIndex(databasePath, driveFileId) {
  let database;
  try {
    database = new DatabaseSync(databasePath, { readOnly: true });
    const findItem = database.prepare(
      'SELECT stable_id, local_title, is_folder FROM items WHERE id = ? AND is_tombstone = 0',
    );
    const findParents = database.prepare(
      'SELECT i.stable_id, i.local_title, i.is_folder FROM stable_parents p JOIN items i ON i.stable_id = p.parent_stable_id WHERE p.item_stable_id = ?',
    );

    const walk = (item, visited = new Set()) => {
      if (item.local_title === 'My Drive' && item.is_folder) return [];
      if (visited.has(item.stable_id)) return null;
      const nextVisited = new Set(visited).add(item.stable_id);
      for (const parent of findParents.all(item.stable_id)) {
        const parentPath = walk(parent, nextVisited);
        if (parentPath) return [...parentPath, item.local_title];
      }
      return null;
    };

    const item = findItem.get(driveFileId);
    return item ? walk(item) : null;
  } catch {
    return null;
  } finally {
    database?.close();
  }
}

export async function resolveDriveMasterPath(
  artwork,
  {
    databasePaths,
    mountRoots,
    localAppData = process.env.LOCALAPPDATA,
    platform = process.platform,
  } = {},
) {
  const { driveFileId } = artwork;
  if (typeof driveFileId !== 'string' || !driveFileId.trim()) {
    throw new Error(`Master for "${artwork.title ?? artwork.id}" has no Google Drive file ID.`);
  }
  if (platform !== 'win32') {
    throw new Error(
      'Resolving private Drive masters currently requires Google Drive for desktop on Windows.',
    );
  }

  const databases =
    databasePaths ?? (await discoverDriveMetadataDatabases({ localAppData, platform }));
  const mounts = mountRoots ?? (await discoverDriveMounts({ platform }));
  if (databases.length === 0 || mounts.length === 0) {
    throw new Error(
      `Google Drive for desktop is not available for master "${artwork.title ?? artwork.id}" (${driveFileId}). Start Drive and sync this file locally.`,
    );
  }

  for (const databasePath of databases) {
    const relativePath = findPathInDriveIndex(databasePath, driveFileId);
    if (!relativePath) continue;
    for (const mountRoot of mounts) {
      const candidate = path.resolve(mountRoot, ...relativePath);
      const relative = path.relative(mountRoot, candidate);
      if (relative.startsWith('..') || path.isAbsolute(relative)) continue;
      try {
        await access(candidate);
        return candidate;
      } catch {
        // Try another mounted Drive root or account index.
      }
    }
  }

  throw new Error(
    `Could not resolve Google Drive master for "${artwork.title ?? artwork.id}" (${driveFileId}). Make sure the file is available in Google Drive for desktop.`,
  );
}
