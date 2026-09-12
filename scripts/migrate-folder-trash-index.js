/**
 * One-time migration: make the folder name unique index trash-aware.
 *
 * Why: folders are now soft-deleted (moved to trash) instead of hard-deleted.
 * The old unique index was { owner, name, parent } — it does not include
 * deletedAt, so a trashed folder keeps occupying its name and the user gets a
 * spurious "a folder with this name already exists" when recreating it, or a
 * raw E11000 from Mongo.
 *
 * The schema now declares { owner, name, parent, deletedAt }. Live folders all
 * share deletedAt: null and still collide with each other as before; a trashed
 * folder carries a distinct timestamp and no longer blocks the name.
 *
 * Mongoose does not drop indexes that are no longer in the schema, so this has
 * to be run once against an existing database. Safe to re-run.
 *
 *   node scripts/migrate-folder-trash-index.js
 *
 * Also removes the files.trashExpiresAt TTL index: the mongod TTL monitor was
 * deleting trashed file rows on its own schedule without running the Telegram /
 * Blob cleanup, orphaning storage permanently. Expiry is now driven solely by
 * File.cleanupExpiredTrash() (see lib/maintenance.ts).
 */
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

async function dropIfExists(collection, indexName, label) {
  try {
    await collection.dropIndex(indexName);
    console.log(`  dropped ${label}: ${indexName}`);
  } catch (error) {
    if (error.code === 27 || error.codeName === 'IndexNotFound') {
      console.log(`  already gone (ok): ${indexName}`);
      return;
    }
    throw error;
  }
}

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL is not set (.env.local). Aborting.');
    process.exit(1);
  }

  await mongoose.connect(uri, { family: 4 });
  const db = mongoose.connection.db;
  console.log(`Connected to ${db.databaseName}\n`);

  console.log('folders:');
  const folders = db.collection('folders');
  const folderIndexes = await folders.indexes();
  const oldFolderUnique = folderIndexes.find(
    (ix) =>
      ix.unique &&
      ix.key &&
      Object.keys(ix.key).length === 3 &&
      ix.key.owner === 1 &&
      ix.key.name === 1 &&
      ix.key.parent === 1,
  );
  if (oldFolderUnique) {
    await dropIfExists(folders, oldFolderUnique.name, 'old unique index');
  } else {
    console.log('  no 3-field unique index found (ok)');
  }

  // Let the app's schema (autoIndex) build { owner, name, parent, deletedAt }.
  const hasNew = folderIndexes.some(
    (ix) =>
      ix.unique &&
      ix.key &&
      ix.key.deletedAt === 1 &&
      ix.key.name === 1 &&
      ix.key.parent === 1,
  );
  if (!hasNew) {
    console.log('  creating { owner, name, parent, deletedAt } unique index...');
    try {
      await folders.createIndex(
        { owner: 1, name: 1, parent: 1, deletedAt: 1 },
        { unique: true },
      );
      console.log('  created');
    } catch (error) {
      console.error(
        '  FAILED to create the new unique index — you probably have duplicate\n' +
          '  (owner, name, parent) rows among live folders. Resolve them, then re-run.',
        error.message,
      );
      throw error;
    }
  } else {
    console.log('  new unique index already present (ok)');
  }

  console.log('\nfiles:');
  const files = db.collection('files');
  const fileIndexes = await files.indexes();
  const ttl = fileIndexes.find(
    (ix) =>
      ix.expireAfterSeconds !== undefined &&
      ix.key &&
      Object.keys(ix.key).length === 1 &&
      ix.key.trashExpiresAt === 1,
  );
  if (ttl) {
    await dropIfExists(files, ttl.name, 'trashExpiresAt TTL index');
  } else {
    console.log('  no trashExpiresAt TTL index found (ok)');
  }

  console.log('\n✅ Migration complete');
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('\n❌ Migration failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
