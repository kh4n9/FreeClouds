import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Folder, type IFolder } from "@/models/Folder";
import { File } from "@/models/File";
import {
  telegramAPI,
  isAllowedFileType,
  validateFileName,
  sanitizeFileName,
} from "@/lib/telegram";
import { getEffectiveStorageLimit } from "@/lib/quota";
import { uploadBodyToTelegram, MAX_PUT_BYTES } from "@/lib/upload-chunks";
import { referenceCopyFile, referenceCopyFolder, sumFolderSize } from "@/lib/file-copy";
import {
  DavError,
  acquireLock,
  authenticateWebDav,
  enforceLock,
  getDepth,
  getPathSegments,
  hrefFor,
  parseLockTimeout,
  propfindResponse,
  releaseLock,
  resolvePath,
  sendStatus,
  sendXml,
  streamFileBody,
  parsePropfindProps,
  parseProppatchProps,
  escapeXml,
} from "@/lib/webdav";

// WebDAV methods go through this pages API route because Next.js app router
// route handlers only dispatch a fixed set of HTTP methods (GET/HEAD/OPTIONS/
// POST/PUT/DELETE/PATCH) and return 400 for PROPFIND/MKCOL/COPY/MOVE/LOCK/UNLOCK.
// Public /webdav/* URLs are rewritten here by proxy.ts.
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const CRLF = "\r\n";


function sendPlain(res: NextApiResponse, status: number, message: string) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  // Windows WebDAV mini-redirector cannot decode gzip'd responses.
  res.setHeader("Content-Encoding", "identity");
  res.status(status).end(message + CRLF);
}

function send401(res: NextApiResponse) {
  res.setHeader("WWW-Authenticate", 'Basic realm="FreeClouds"');
  sendPlain(res, 401, "Authentication required");
}

async function readBodyBuffer(req: NextApiRequest, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      throw new DavError("Request body too large", 413);
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

function parseDestinationPath(header: string | string[] | undefined): string[] {
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) throw new DavError("Missing Destination header", 400);
  const pathname = new URL(raw, "http://local").pathname;
  let rest = pathname;
  for (const prefix of ["/api/webdav", "/webdav"]) {
    if (rest === prefix) return [];
    if (rest.startsWith(`${prefix}/`)) {
      rest = rest.slice(prefix.length);
      break;
    }
  }
  return rest.split("/").filter(Boolean).map((seg) => {
    try {
      return decodeURIComponent(seg);
    } catch {
      // Malformed %-encoding: a clean 400 rather than a URIError-driven 500.
      throw new DavError("Malformed percent-encoding in Destination", 400);
    }
  });
}

function shouldOverwrite(req: NextApiRequest): boolean {
  const overwrite = req.headers.overwrite;
  if (typeof overwrite === "string" && overwrite.toLowerCase() === "f") return false;
  return true;
}

async function deleteTargetFolder(userId: string, folderId: string) {
  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  if (folder) await folder.softDeleteRecursively();
}

async function deleteTargetFile(fileId: string) {
  const file = await File.findById(fileId);
  if (file) await file.softDelete();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = (req.method || "GET").toUpperCase();

  try {
    if (method === "OPTIONS") {
      res.setHeader("DAV", "1, 2");
      res.setHeader("Allow", "OPTIONS, GET, HEAD, PUT, DELETE, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK");
      res.setHeader("MS-Author-Via", "DAV");
      res.setHeader("Content-Length", "0");
      res.status(200).end();
      return;
    }

    const user = await authenticateWebDav(req);
    const userId = user._id.toString();
    await connectToDatabase();
    const segments = getPathSegments(req);
    const resolved = await resolvePath(userId, segments);

    switch (method) {
      case "GET":
      case "HEAD": {
        if (resolved.kind !== "file") {
          throw new DavError("Method not allowed on collections", 405);
        }
        await streamFileBody(res, resolved.file);
        return;
      }

      case "PROPFIND": {
        if (resolved.kind === "missing") {
          throw new DavError("Not found", 404);
        }
        const body = await readBodyBuffer(req, 2 * 1024 * 1024);
        const requestedProps = parsePropfindProps(body.toString("utf8"));
        const depth = getDepth(req);
        const entries: Array<{
          href: string;
          isCollection: boolean;
          displayName: string;
          size?: number;
          mime?: string;
          lastModified: Date;
          createdAt: Date;
          etag: string;
        }> = [];

        const baseSegments = segments;

        if (resolved.kind === "file") {
          entries.push({
            href: hrefFor(baseSegments),
            isCollection: false,
            displayName: resolved.file.name,
            size: resolved.file.size,
            mime: resolved.file.mime,
            // updatedAt, not createdAt: a PUT-overwrite must change
            // getlastmodified or sync clients miss the update entirely.
            lastModified: resolved.file.updatedAt ?? resolved.file.createdAt,
            createdAt: resolved.file.createdAt,
            etag: resolved.file._id.toString(),
          });
        } else {
          const isRoot = resolved.kind === "root";
          const folder = resolved.kind === "folder" ? resolved.folder : null;
          entries.push({
            href: hrefFor(baseSegments),
            isCollection: true,
            displayName: isRoot ? "/" : folder!.name,
            lastModified:
              folder?.updatedAt ?? folder?.createdAt ?? new Date(),
            createdAt: folder?.createdAt || new Date(),
            etag: folder ? folder._id.toString() : "root",
          });

          if (depth === "1" || depth === "infinity") {
            const parentId = isRoot ? null : folder!._id.toString();
            const [subFolders, subFiles] = await Promise.all([
              Folder.find({
                owner: userId,
                parent: parentId,
                isHidden: { $ne: true },
                // Soft-deleted collections live in the trash and must not show
                // up in a mounted drive's directory listing.
                deletedAt: null,
              }).sort({ name: 1 }),
              File.find({
                owner: userId,
                folder: parentId,
                deletedAt: null,
                $or: [{ chunkedId: null }, { chunkIndex: -1 }],
              }).sort({ name: 1 }),
            ]);

            for (const child of subFolders) {
              entries.push({
                href: hrefFor([...baseSegments, child.name]),
                isCollection: true,
                displayName: child.name,
                lastModified: child.updatedAt ?? child.createdAt,
                createdAt: child.createdAt,
                etag: child._id.toString(),
              });
            }
            for (const child of subFiles) {
              entries.push({
                href: hrefFor([...baseSegments, child.name]),
                isCollection: false,
                displayName: child.name,
                size: child.size,
                mime: child.mime,
                lastModified: child.updatedAt ?? child.createdAt,
                createdAt: child.createdAt,
                etag: child._id.toString(),
              });
            }
          }
        }

        const xml = propfindResponse(entries, requestedProps);
        sendXml(res, 207, xml);
        return;
      }

      case "PUT": {
        const name = segments[segments.length - 1]!;
        if (!name) throw new DavError("No file name provided", 400);

        // A locked resource only accepts writes that present the lock token.
        await enforceLock(userId, segments, req);

        // Some WebDAV clients (Windows Map Drive, curl >= 7.20) send
        // `Expect: 100-continue` and refuse to stream the body until the
        // server acknowledges. Without an explicit continue, uploads deadlock.
        if (typeof req.headers.expect === "string" && req.headers.expect.toLowerCase().includes("100-continue")) {
          if (typeof (res as unknown as { writeContinue?: () => void }).writeContinue === "function") {
            (res as unknown as { writeContinue: () => void }).writeContinue();
          }
        }

        if (resolved.kind === "folder") {
          throw new DavError("A collection exists at this path", 409);
        }
        if (resolved.kind === "missing" && resolved.name !== name) {
          throw new DavError("Parent collection not found", 409);
        }

        const parentId = segments.length === 1 ? null : await resolveParentId(userId, segments);

        const contentType = typeof req.headers["content-type"] === "string" ? req.headers["content-type"] : "";
        const mime = contentType.split(";")[0]!.trim().toLowerCase() || "application/octet-stream";
        const declaredSize = typeof req.headers["content-length"] === "string" ? parseInt(req.headers["content-length"], 10) : NaN;

        if (Number.isFinite(declaredSize) && declaredSize > MAX_PUT_BYTES) {
          throw new DavError("File too large (2GB limit)", 413);
        }

        const existing = resolved.kind === "file" ? resolved.file : null;
        const isOverwrite = !!existing;

        const usage = await File.getStorageUsage(userId);
        const storageLimit = await getEffectiveStorageLimit(userId);
        if (Number.isFinite(declaredSize)) {
          const delta = declaredSize - (existing ? existing.size : 0);
          if ((usage.totalSize || 0) + delta > storageLimit) {
            throw new DavError("Insufficient storage", 507);
          }
        }

        // Sanitize only when the name is truly invalid (like the upload API
        // does). Clients like RaiDrive PUT hidden temp files ("._tmp_...")
        // then MOVE them — stripping leading dots renames the file and the
        // follow-up MOVE/DELETE 404s.
        let fileName = validateFileName(name) ? name : sanitizeFileName(name);

        let originalExt: string | null = null;
        if (!isAllowedFileType(mime, fileName)) {
          const dot = fileName.lastIndexOf(".");
          if (dot !== -1) {
            originalExt = fileName.substring(dot);
            fileName = fileName.substring(0, dot) + ".bin";
          } else {
            originalExt = "";
            fileName = fileName + ".bin";
          }
        }

        // Stream the body and upload to Telegram (auto-split into 15MB parts
        // past the single-message limit, parts upload concurrently).
        let result;
        try {
          result = await uploadBodyToTelegram(req, fileName, mime, { maxBytes: MAX_PUT_BYTES });
        } catch (error) {
          if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
            throw new DavError("File too large (2GB limit)", 413);
          }
          console.error("WebDAV upload failed:", error);
          throw new DavError("Telegram upload failed", 502);
        }

        if (result.totalBytes === 0) {
          throw new DavError("Empty file not allowed", 400);
        }

        if (!Number.isFinite(declaredSize)) {
          const delta = result.totalBytes - (existing ? existing.size : 0);
          if ((usage.totalSize || 0) + delta > storageLimit) {
            await Promise.allSettled(
              result.meta.map((m) =>
                m.telegramMessageId ? telegramAPI.deleteMessage(m.telegramMessageId) : Promise.resolve(),
              ),
            );
            throw new DavError("Insufficient storage", 507);
          }
        }

        const wasChunked = !!(existing?.chunkedId && existing?.totalChunks && existing.totalChunks > 1);
        const oldMessageId = existing?.telegramMessageId || null;
        const oldChunkMessages = wasChunked
          ? (
              await File.find({
                chunkedId: existing!.chunkedId,
                chunkIndex: { $gte: 0 },
                owner: userId,
              })
            )
              .map((c) => c.telegramMessageId)
              .filter(Boolean)
          : [];

        if (result.meta.length === 1) {
          const part = result.meta[0]!;
          if (existing) {
            if (wasChunked) {
              await File.deleteMany({ chunkedId: existing.chunkedId, chunkIndex: { $gte: 0 } }).catch(() => {});
            }
            existing.name = fileName;
            existing.size = result.totalBytes;
            existing.mime = mime;
            existing.fileId = part.fileId;
            existing.telegramFilePath = part.telegramFilePath;
            existing.telegramMessageId = part.telegramMessageId;
            existing.chunkedId = null;
            existing.chunkIndex = null;
            existing.totalChunks = null;
            existing.blobCacheUrl = null;
            if (originalExt !== null) existing.originalExt = originalExt;
            await existing.save();
          } else {
            const record = new File({
              name: fileName,
              size: result.totalBytes,
              mime,
              fileId: part.fileId,
              telegramFilePath: part.telegramFilePath,
              telegramMessageId: part.telegramMessageId,
              owner: userId,
              folder: parentId,
              ...(originalExt !== null ? { originalExt } : {}),
            });
            await record.save();
          }
        } else {
          const chunkedId = crypto.randomUUID();
          const totalChunks = result.meta.length;
          const chunkDocs = result.meta.map((part, i) => ({
            name: `${fileName}.part${i + 1}`,
            size: part.size,
            mime,
            fileId: part.fileId,
            telegramFilePath: part.telegramFilePath,
            telegramMessageId: part.telegramMessageId,
            owner: userId,
            folder: parentId,
            chunkedId,
            chunkIndex: i,
            totalChunks,
            ...(originalExt !== null ? { originalExt } : {}),
          }));

          try {
            await File.insertMany(chunkDocs);
          } catch (err) {
            console.error("WebDAV chunk save failed:", err);
            await Promise.allSettled(
              chunkDocs.map((d) => telegramAPI.deleteMessage(d.telegramMessageId!)),
            );
            throw new DavError("Failed to save file chunks", 500);
          }

          if (existing) {
            if (wasChunked) {
              await File.deleteMany({ chunkedId: existing.chunkedId, chunkIndex: { $gte: 0 } }).catch(() => {});
            }
            existing.name = fileName;
            existing.size = result.totalBytes;
            existing.mime = mime;
            existing.fileId = `chunked_parent_${chunkedId}`;
            existing.telegramFilePath = null;
            existing.telegramMessageId = null;
            existing.chunkedId = chunkedId;
            existing.chunkIndex = -1;
            existing.totalChunks = totalChunks;
            existing.blobCacheUrl = null;
            if (originalExt !== null) existing.originalExt = originalExt;
            await existing.save();
          } else {
            const parentFile = new File({
              name: fileName,
              size: result.totalBytes,
              mime,
              fileId: `chunked_parent_${chunkedId}`,
              owner: userId,
              folder: parentId,
              chunkedId,
              chunkIndex: -1,
              totalChunks,
              ...(originalExt !== null ? { originalExt } : {}),
            });
            try {
              await parentFile.save();
            } catch (err) {
              console.error("WebDAV parent save failed, cleaning up chunks:", err);
              await File.deleteMany({ chunkedId, chunkIndex: { $gte: 0 } }).catch(() => {});
              throw new DavError("Failed to finalize file upload", 500);
            }
          }
        }

        if (oldMessageId) {
          await telegramAPI.deleteMessage(oldMessageId).catch(() => {});
        }
        await Promise.allSettled(
          oldChunkMessages.map((messageId) => telegramAPI.deleteMessage(messageId!)),
        );

        sendStatus(res, isOverwrite ? 204 : 201);
        return;
      }

      case "DELETE": {
        if (resolved.kind === "missing") {
          throw new DavError("Not found", 404);
        }
        await enforceLock(userId, segments, req);
        if (resolved.kind === "folder") {
          await resolved.folder.softDeleteRecursively();
        } else if (resolved.kind === "file") {
          await resolved.file.softDelete();
        } else {
          throw new DavError("Cannot delete root", 405);
        }
        sendStatus(res, 204);
        return;
      }

      case "MKCOL": {
        const name = segments[segments.length - 1];
        if (!name) throw new DavError("No folder name provided", 400);
        if (resolved.kind === "folder" || resolved.kind === "file") {
          throw new DavError("Resource already exists", 405);
        }
        if (resolved.kind === "missing" && resolved.name !== name) {
          // The deepest missing segment is not the leaf: a parent collection
          // along the path does not exist.
          throw new DavError("Parent collection not found", 409);
        }
        const parentId = resolved.kind === "missing" ? resolved.parentId : null;
        const folder = new Folder({ name: validateFileName(name) ? name : sanitizeFileName(name), owner: userId, parent: parentId });
        try {
          await folder.save();
        } catch (error) {
          if (error instanceof Error && (error.message.includes("E11000") || error.message.includes("duplicate key"))) {
            throw new DavError("Resource already exists", 405);
          }
          throw error;
        }
        sendStatus(res, 201);
        return;
      }

      case "MOVE": {
        if (resolved.kind === "missing") throw new DavError("Not found", 404);
        if (resolved.kind === "root") throw new DavError("Cannot move root", 405);

        // Source must be unlocked by the requester.
        await enforceLock(userId, segments, req);

        const destination = parseDestinationPath(req.headers.destination);
        const destName = destination[destination.length - 1];
        if (!destName) throw new DavError("Invalid destination", 400);

        const destResolved = await resolvePath(userId, destination);
        const overwrite = shouldOverwrite(req);

        // Destination parent must exist (must be an existing folder or root)
        if (destResolved.kind === "missing" && destResolved.name !== destName) {
          throw new DavError("Parent collection not found", 409);
        }

        // Now resolve the destination parent ID (safe: parent verified above)
        const destParentId = destination.length === 1 ? null : await resolveParentId(userId, destination);

        // Destination exists: only proceed when Overwrite: T
        if (destResolved.kind === "file" || destResolved.kind === "folder") {
          if (!overwrite) throw new DavError("Precondition failed", 412);
          if (destResolved.kind === "folder") {
            if (resolved.kind === "folder" && destResolved.folder._id.equals(resolved.folder._id)) {
              throw new DavError("Source and destination are the same", 403);
            }
            await deleteTargetFolder(userId, destResolved.folder._id.toString());
          } else {
            await deleteTargetFile(destResolved.file._id.toString());
          }
        }

        if (resolved.kind === "folder") {
          if (resolved.folder.parent?.toString() === destParentId && resolved.folder.name === destName) {
            throw new DavError("Source and destination are the same", 403);
          }
          // Reject moving a folder into itself or one of its descendants
          let cursor: string | null = destParentId;
          const visited = new Set<string>();
          while (cursor) {
            if (cursor === resolved.folder._id.toString()) {
              throw new DavError("Cannot move a folder into itself", 409);
            }
            if (visited.has(cursor)) break;
            visited.add(cursor);
            const parent = await Folder.findById(cursor);
            cursor = parent?.parent?.toString() || null;
          }
          // Same hidden-folder blind spot as COPY: a rename onto a name that
          // only a hidden collection occupies would otherwise E11000 -> 500.
          const clash = await Folder.findOne({
            owner: userId,
            parent: destParentId,
            name: destName,
            deletedAt: null,
            _id: { $ne: resolved.folder._id },
          });
          if (clash) {
            throw new DavError("Destination already exists", 409);
          }
          resolved.folder.parent = destParentId
            ? new mongoose.Types.ObjectId(destParentId)
            : null;
          resolved.folder.name = destName;
          await resolved.folder.save();
        } else {
          if (resolved.file.folder?.toString() === destParentId && resolved.file.name === destName) {
            throw new DavError("Source and destination are the same", 403);
          }
          resolved.file.folder = destParentId
            ? new mongoose.Types.ObjectId(destParentId)
            : null;
          resolved.file.name = destName;
          await resolved.file.save();
        }

        sendStatus(res, 201);
        return;
      }

      case "COPY": {
        if (resolved.kind === "missing") {
          throw new DavError("Not found", 404);
        }
        if (resolved.kind === "root") {
          throw new DavError("Cannot copy root", 405);
        }
        const destination = parseDestinationPath(req.headers.destination);
        const destName = destination[destination.length - 1];
        if (!destName) throw new DavError("Invalid destination", 400);

        const destResolved = await resolvePath(userId, destination);
        // Destination parent must exist
        if (destResolved.kind === "missing" && destResolved.name !== destName) {
          throw new DavError("Parent collection not found", 409);
        }
        // Now resolve the destination parent ID (safe: parent verified above)
        const destParentId = destination.length === 1 ? null : await resolveParentId(userId, destination);

        if (destResolved.kind === "file" || destResolved.kind === "folder") {
          if (!shouldOverwrite(req)) throw new DavError("Precondition failed", 412);
          if (destResolved.kind === "folder") {
            throw new DavError("Cannot copy over a collection", 409);
          }
          await deleteTargetFile(destResolved.file._id.toString());
        }

        // resolvePath() filters out hidden folders, so a hidden collection at
        // the destination resolves as "missing". Creating over it would hit the
        // unique {owner, name, parent} index and surface as a raw E11000 -> 500.
        // Check explicitly and answer 409.
        if (resolved.kind === "folder" && destResolved.kind === "missing") {
          const clash = await Folder.findOne({
            owner: userId,
            parent: destParentId,
            name: destName,
            deletedAt: null,
          });
          if (clash) {
            throw new DavError("Destination already exists", 409);
          }
        }

        // Quota check before duplicating any records.
        //
        // Note: reference copies share the source's Telegram document, yet
        // getStorageUsage() sums the size of every live File row, so a copy does
        // count against quota. That is consistent (the check matches how usage
        // is computed), so this reserves the copy's logical size rather than
        // excluding it — making quota physical-only is a product decision, not a
        // bug fix.
        const usage = await File.getStorageUsage(userId);
        const storageLimit = await getEffectiveStorageLimit(userId);
        const copySize =
          resolved.kind === "file"
            ? resolved.file.size || 0
            : await sumFolderSize(userId, resolved.folder._id.toString());
        if ((usage.totalSize || 0) + copySize > storageLimit) {
          throw new DavError("Insufficient storage", 507);
        }

        if (resolved.kind === "folder") {
          // Reject copying a folder into itself or one of its descendants.
          let cursor: string | null = destParentId;
          const visited = new Set<string>();
          while (cursor) {
            if (cursor === resolved.folder._id.toString()) {
              throw new DavError("Cannot copy a folder into itself", 409);
            }
            if (visited.has(cursor)) break;
            visited.add(cursor);
            const parent = await Folder.findById(cursor);
            cursor = parent?.parent?.toString() || null;
          }
          const destId = await referenceCopyFolder(
            resolved.folder._id.toString(),
            userId,
            destParentId,
            destName,
          );
        } else {
          const copy = await referenceCopyFile(resolved.file, userId, destParentId);
          if (destName !== resolved.file.name) {
            copy.name = destName;
            await copy.save();
          }
        }

        sendStatus(res, 201);
        return;
      }

      case "LOCK": {
        // Consume the body (clients send a <lockinfo> element) but we only need
        // the requested timeout; ownership comes from the authenticated user.
        const lockBody = await readBodyBuffer(req, 64 * 1024).catch(() => Buffer.alloc(0));
        const requestedTimeout =
          parseLockTimeout(req.headers.timeout) ??
          parseLockTimeout(
            /<D:timeout>\s*([^<]+?)\s*<\/D:timeout>/i.exec(
              lockBody.toString("utf8"),
            )?.[1],
          );

        const { token, timeoutSeconds, created } = await acquireLock(
          userId,
          segments,
          req,
          requestedTimeout,
        );

        res.setHeader("Lock-Token", `<${token}>`);
        const body =
          '<?xml version="1.0" encoding="utf-8"?>' + CRLF +
          '<D:prop xmlns:D="DAV:">' + CRLF +
          "<D:lockdiscovery>" + CRLF +
          "<D:activelock>" + CRLF +
          `<D:locktoken><D:href>${escapeXml(token)}</D:href></D:locktoken>` + CRLF +
          `<D:lockroot><D:href>${escapeXml(hrefFor(segments))}</D:href></D:lockroot>` + CRLF +
          `<D:depth>${escapeXml(getDepth(req))}</D:depth>` + CRLF +
          `<D:owner>${escapeXml(user.email)}</D:owner>` + CRLF +
          `<D:timeout>Second-${timeoutSeconds}</D:timeout>` + CRLF +
          "</D:activelock>" + CRLF +
          "</D:lockdiscovery>" + CRLF +
          "</D:prop>";
        // 200 for a refresh of an existing lock, 201 when newly created.
        sendXml(res, created ? 201 : 200, body);
        return;
      }

      case "UNLOCK": {
        const token = req.headers["lock-token"];
        if (typeof token !== "string") {
          sendPlain(res, 400, "Bad Request: Lock-Token header required for UNLOCK");
          return;
        }
        const outcome = await releaseLock(userId, segments, token);
        if (outcome === "no-lock") {
          sendPlain(res, 409, "Conflict: no active lock on this resource");
          return;
        }
        if (outcome === "mismatch") {
          sendPlain(res, 409, "Conflict: lock token mismatch");
          return;
        }
        sendStatus(res, 204);
        return;
      }

      case "PROPPATCH": {
        await enforceLock(userId, segments, req);
        const body = await readBodyBuffer(req, 1 * 1024 * 1024);
        // PROPPATCH bodies need their own parser: the PROPFIND one returned the
        // container elements, so clients were told 403 about "propertyupdate".
        const props = parseProppatchProps(body.toString("utf8"));
        // This server keeps no writable dead properties, so every requested
        // property is refused — but it must be refused with the client's own
        // qualified name under the client's namespace.
        const responses = props.length
          ? props
              .map(
                (prop) =>
                  "<D:response>" + CRLF +
                  `<D:href>${escapeXml(hrefFor(segments))}</D:href>` + CRLF +
                  "<D:propstat>" + CRLF +
                  `<D:prop><${prop}/></D:prop>` + CRLF +
                  "<D:status>HTTP/1.1 403 Forbidden</D:status>" + CRLF +
                  "</D:propstat>" + CRLF +
                  "</D:response>",
              )
              .join(CRLF)
          : "";
        // xmlns:D is declared on the multistatus root; a property using another
        // prefix would need its namespace declared too, so declare the common
        // office/vendor prefixes that real clients use.
        const nsDecls =
          ' xmlns:D="DAV:"' +
          ' xmlns:Z="urn:schemas-microsoft-com:"' +
          ' xmlns:Win32="http://www.microsoft.com/"' +
          ' xmlns:MAC="http://www.apple.com/webdav/"';
        sendXml(res, 207, '<?xml version="1.0" encoding="utf-8"?>' + CRLF + `<D:multistatus${nsDecls}>` + CRLF + responses + CRLF + "</D:multistatus>");
        return;
      }

      default:
        throw new DavError("Method not allowed", 405);
    }
  } catch (error) {
    if (error instanceof DavError) {
      if (error.status === 401) {
        send401(res);
      } else {
        sendPlain(res, error.status, error.message);
      }
      return;
    }
    console.error("WebDAV error:", error);
    sendPlain(res, 500, "Internal server error");
  }
}

/** Resolve the parent folder id for the path up to (but excluding) the leaf. */
async function resolveParentId(
  userId: string,
  segments: string[],
): Promise<string | null> {
  if (segments.length <= 1) return null;
  let parentId: string | null = null;
  for (const name of segments.slice(0, -1)) {
    // Hidden folders are invisible to WebDAV (PIN-gated vault).
    const folder: IFolder | null = await Folder.findOne({ owner: userId, parent: parentId, name, isHidden: { $ne: true }, deletedAt: null });
    if (!folder) throw new DavError("Parent collection not found", 409);
    parentId = folder._id.toString();
  }
  return parentId;
}