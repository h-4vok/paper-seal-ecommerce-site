import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveDriveMasterPath } from './drive-masters.mjs';

let temporaryDirectory;

afterEach(async () => {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

async function createDriveIndexFixture() {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'paperseal-drive-master-'));
  const mountRoot = path.join(temporaryDirectory, 'My Drive');
  const folder = path.join(mountRoot, 'Artwork Masters');
  const masterPath = path.join(folder, 'Beach Huts.png');
  const databasePath = path.join(temporaryDirectory, 'metadata_sqlite_db');
  await mkdir(folder, { recursive: true });
  await writeFile(masterPath, 'master');

  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE items (
      stable_id INTEGER PRIMARY KEY,
      id TEXT UNIQUE NOT NULL,
      local_title TEXT NOT NULL,
      is_folder BOOLEAN NOT NULL,
      is_tombstone BOOLEAN NOT NULL
    );
    CREATE TABLE stable_parents (
      item_stable_id INTEGER NOT NULL,
      parent_stable_id INTEGER NOT NULL
    );
    INSERT INTO items VALUES (1, 'my-drive-id', 'My Drive', 1, 0);
    INSERT INTO items VALUES (2, 'folder-id', 'Artwork Masters', 1, 0);
    INSERT INTO items VALUES (3, 'beach-huts-drive-id', 'Beach Huts.png', 0, 0);
    INSERT INTO stable_parents VALUES (2, 1);
    INSERT INTO stable_parents VALUES (3, 2);
  `);
  database.close();
  return { databasePath, masterPath, mountRoot };
}

describe('Google Drive master resolution', () => {
  it('resolves a local synced file from its Drive file ID, independent of its filename', async () => {
    const fixture = await createDriveIndexFixture();
    await expect(
      resolveDriveMasterPath(
        { title: 'Beach Huts', driveFileId: 'beach-huts-drive-id' },
        {
          databasePaths: [fixture.databasePath],
          mountRoots: [fixture.mountRoot],
          platform: 'win32',
        },
      ),
    ).resolves.toBe(fixture.masterPath);
  });

  it('reports when the Drive ID is not present in the local Drive index', async () => {
    const fixture = await createDriveIndexFixture();
    await expect(
      resolveDriveMasterPath(
        { title: 'Missing artwork', driveFileId: 'unknown-drive-id' },
        {
          databasePaths: [fixture.databasePath],
          mountRoots: [fixture.mountRoot],
          platform: 'win32',
        },
      ),
    ).rejects.toThrow('Could not resolve Google Drive master for "Missing artwork"');
  });

  it('requires a Drive file ID', async () => {
    await expect(resolveDriveMasterPath({ title: 'Unlinked artwork' })).rejects.toThrow(
      'has no Google Drive file ID',
    );
  });
});
