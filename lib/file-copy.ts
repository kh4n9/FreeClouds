import { File, type IFile } from "@/models/File";
import { Folder } from "@/models/Folder";
import crypto from "crypto";

/**
 * Reference-copy: creates a new File record that points at the same Telegram
 * document (fileId / telegramFilePath) as the source — instant and free of
 * quota cost on Telegram. The copy gets NO telegramMessageId, so permanently
 * deleting it cannot delete the original's Telegram message.
 * Chunked sources clone their part rows under a fresh chunkedId.
 */
export async function referenceCopyFile(
  source: IFile,
  ownerId: string,
  destFolderId: string | null,
): Promise<IFile> {
  const chunked =
    source.chunkedId && source.totalChunks && source.totalChunks > 1;

  if (chunked) {
    const chunkedId = crypto.randomUUID();
    const chunks = await File.find({
      chunkedId: source.chunkedId,
      chunkIndex: { $gte: 0 },
      owner: ownerId,
      deletedAt: null,
    }).sort({ chunkIndex: 1 });

    if (chunks.length !== source.totalChunks) {
      throw new Error("File chunks not found");
    }

    await File.insertMany(
      chunks.map((c) => ({
        name: c.name,
        size: c.size,
        mime: c.mime,
        fileId: c.fileId,
        telegramFilePath: c.telegramFilePath,
        owner: ownerId,
        folder: destFolderId,
        chunkedId,
        chunkIndex: c.chunkIndex,
        totalChunks: c.totalChunks,
        originalExt: c.originalExt,
      })),
    );

    const parent = new File({
      name: source.name,
      size: source.size,
      mime: source.mime,
      fileId: `chunked_parent_${chunkedId}`,
      owner: ownerId,
      folder: destFolderId,
      chunkedId,
      chunkIndex: -1,
      totalChunks: source.totalChunks,
      originalExt: source.originalExt,
    });
    await parent.save();
    return parent;
  }

  const copy = new File({
    name: source.name,
    size: source.size,
    mime: source.mime,
    fileId: source.fileId,
    telegramFilePath: source.telegramFilePath,
    owner: ownerId,
    folder: destFolderId,
    originalExt: source.originalExt,
  });
  await copy.save();
  return copy;
}

/**
 * Total storage that would be added by copying a folder subtree: sum of all
 * non-chunk parent records (chunk parts are already excluded from usage).
 */
export async function sumFolderSize(
  ownerId: string,
  folderId: string,
): Promise<number> {
  const [subFolders, subFiles] = await Promise.all([
    Folder.find({ owner: ownerId, parent: folderId }),
    File.find({
      owner: ownerId,
      folder: folderId,
      deletedAt: null,
      $or: [{ chunkedId: null }, { chunkIndex: -1 }],
    }),
  ]);
  let total = subFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  for (const folder of subFolders) {
    total += await sumFolderSize(ownerId, folder._id.toString());
  }
  return total;
}

/**
 * Deep-copy a folder tree (folders + all files, reference-copied). Used by
 * WebDAV COPY on collections.
 */
export async function referenceCopyFolder(
  sourceFolderId: string,
  ownerId: string,
  destParentId: string | null,
  destName?: string,
): Promise<string> {
  const source = await Folder.findById(sourceFolderId);
  if (!source) throw new Error("Source folder not found");

  const dest = new Folder({
    name: destName ?? source.name,
    owner: ownerId,
    parent: destParentId,
  });
  await dest.save();
  const destId = dest._id.toString();

  const [subFolders, subFiles] = await Promise.all([
    Folder.find({ owner: ownerId, parent: source._id }),
    File.find({
      owner: ownerId,
      folder: source._id,
      deletedAt: null,
      $or: [{ chunkedId: null }, { chunkIndex: -1 }],
    }),
  ]);

  for (const file of subFiles) {
    await referenceCopyFile(file, ownerId, destId);
  }
  for (const folder of subFolders) {
    await referenceCopyFolder(folder._id.toString(), ownerId, destId);
  }

  return destId;
}