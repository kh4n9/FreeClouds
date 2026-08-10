import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Folder, type IFolder } from "@/models/Folder";
import { File } from "@/models/File";
import {
  telegramAPI,
  isAllowedFileType,
  sanitizeFileName,
} from "@/lib/telegram";
import { getEffectiveStorageLimit } from "@/lib/quota";
import {
  DavError,
  authenticateWebDav,
  getDepth,
  getPathSegments,
  hrefFor,
  propfindResponse,
  resolvePath,
  sendStatus,
  sendXml,
  streamFileBody,
  parsePropfindProps,
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
  return rest.split("/").filter(Boolean).map(decodeURIComponent);
}

function shouldOverwrite(req: NextApiRequest): boolean {
  const overwrite = req.headers.overwrite;
  if (typeof overwrite === "string" && overwrite.toLowerCase() === "f") return false;
  return true;
}

async function deleteTargetFolder(userId: string, folderId: string) {
  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  if (folder) await folder.deleteRecursively();
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
        }> = [];

        const baseSegments = segments;

        if (resolved.kind === "file") {
          entries.push({
            href: hrefFor(baseSegments),
            isCollection: false,
            displayName: resolved.file.name,
            size: resolved.file.size,
            mime: resolved.file.mime,
            lastModified: resolved.file.createdAt,
            createdAt: resolved.file.createdAt,
          });
        } else {
          const isRoot = resolved.kind === "root";
          const folder = resolved.kind === "folder" ? resolved.folder : null;
          entries.push({
            href: hrefFor(baseSegments),
            isCollection: true,
            displayName: isRoot ? "/" : folder!.name,
            lastModified: folder?.createdAt || new Date(),
            createdAt: folder?.createdAt || new Date(),
          });

          if (depth === "1" || depth === "infinity") {
            const parentId = isRoot ? null : folder!._id.toString();
            const [subFolders, subFiles] = await Promise.all([
              Folder.find({ owner: userId, parent: parentId }).sort({ name: 1 }),
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
                lastModified: child.createdAt,
                createdAt: child.createdAt,
              });
            }
            for (const child of subFiles) {
              entries.push({
                href: hrefFor([...baseSegments, child.name]),
                isCollection: false,
                displayName: child.name,
                size: child.size,
                mime: child.mime,
                lastModified: child.createdAt,
                createdAt: child.createdAt,
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

        if (Number.isFinite(declaredSize) && declaredSize > 50 * 1024 * 1024) {
          throw new DavError("File too large (50MB limit)", 413);
        }

        const buffer = await readBodyBuffer(req, 50 * 1024 * 1024);
        if (buffer.length === 0) throw new DavError("Empty file not allowed", 400);

        let fileName = sanitizeFileName(name);

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

        const existing = resolved.kind === "file" ? resolved.file : null;

        const usage = await File.getStorageUsage(userId);
        const storageLimit = await getEffectiveStorageLimit(userId);
        const delta = buffer.length - (existing ? existing.size : 0);
        if ((usage.totalSize || 0) + delta > storageLimit) {
          throw new DavError("Insufficient storage", 507);
        }

        let telegramResponse;
        try {
          telegramResponse = await telegramAPI.sendDocument(buffer, fileName, mime);
        } catch (error) {
          console.error("WebDAV upload failed:", error);
          throw new DavError("Telegram upload failed", 502);
        }

        let telegramFilePath: string | null = null;
        try {
          const info = await telegramAPI.getFile(telegramResponse.document.file_id);
          telegramFilePath = info.file_path || null;
        } catch {}

        if (existing) {
          const oldMessageId = existing.telegramMessageId;
          existing.name = fileName;
          existing.size = buffer.length;
          existing.mime = mime;
          existing.fileId = telegramResponse.document.file_id;
          existing.telegramFilePath = telegramFilePath;
          existing.telegramMessageId = String(telegramResponse.message_id);
          if (originalExt !== null) existing.originalExt = originalExt;
          await existing.save();
          if (oldMessageId) {
            await telegramAPI.deleteMessage(oldMessageId).catch(() => {});
          }
          sendStatus(res, 204);
        } else {
          const record = new File({
            name: fileName,
            size: buffer.length,
            mime,
            fileId: telegramResponse.document.file_id,
            telegramFilePath,
            telegramMessageId: String(telegramResponse.message_id),
            owner: userId,
            folder: parentId,
            ...(originalExt !== null ? { originalExt } : {}),
          });
          await record.save();
          sendStatus(res, 201);
        }
        return;
      }

      case "DELETE": {
        if (resolved.kind === "missing") {
          throw new DavError("Not found", 404);
        }
        if (resolved.kind === "folder") {
          await resolved.folder.deleteRecursively();
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
        const folder = new Folder({ name: sanitizeFileName(name), owner: userId, parent: parentId });
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

        const destination = parseDestinationPath(req.headers.destination);
        const destName = destination[destination.length - 1];
        if (!destName) throw new DavError("Invalid destination", 400);

        const destResolved = await resolvePath(userId, destination);
        const destParentId = destination.length === 1 ? null : await resolveParentId(userId, destination);
        const overwrite = shouldOverwrite(req);

        // Destination parent must exist (must be an existing folder or root)
        if (destResolved.kind === "missing" && destResolved.name !== destName) {
          throw new DavError("Parent collection not found", 409);
        }

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
        if (resolved.kind !== "file") {
          throw new DavError("Only file copy is supported", 501);
        }
        const destination = parseDestinationPath(req.headers.destination);
        const destName = destination[destination.length - 1];
        if (!destName) throw new DavError("Invalid destination", 400);

        const destResolved = await resolvePath(userId, destination);
        // Destination parent must exist
        if (destResolved.kind === "missing" && destResolved.name !== destName) {
          throw new DavError("Parent collection not found", 409);
        }
        if (destResolved.kind === "file" || destResolved.kind === "folder") {
          if (!shouldOverwrite(req)) throw new DavError("Precondition failed", 412);
          if (destResolved.kind === "folder") {
            throw new DavError("Cannot copy over a collection", 409);
          }
          await deleteTargetFile(destResolved.file._id.toString());
        }

        // Read the source content fully, then re-upload as a new Telegram doc.
        const parts: Buffer[] = [];
        const isChunked = resolved.file.chunkedId && resolved.file.totalChunks && resolved.file.totalChunks > 1;
        if (isChunked) {
          const chunks = await File.find({
            chunkedId: resolved.file.chunkedId,
            chunkIndex: { $gte: 0 },
            owner: userId,
            deletedAt: null,
          }).sort({ chunkIndex: 1 });
          if (chunks.length !== resolved.file.totalChunks) {
            throw new DavError("File chunks not found", 404);
          }
          for (const chunk of chunks) {
            const result = await telegramAPI.getFileStream(chunk.fileId, chunk.telegramFilePath || undefined);
            const reader = result.stream.getReader();
            const buf: Uint8Array[] = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf.push(value);
            }
            reader.releaseLock();
            parts.push(Buffer.concat(buf));
          }
        } else {
          const result = await telegramAPI.getFileStream(
            resolved.file.fileId,
            resolved.file.telegramFilePath || undefined,
          );
          const reader = result.stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) parts.push(Buffer.from(value));
          }
          reader.releaseLock();
        }

        const buffer = Buffer.concat(parts);

        const usage = await File.getStorageUsage(userId);
        const storageLimit = await getEffectiveStorageLimit(userId);
        if ((usage.totalSize || 0) + buffer.length > storageLimit) {
          throw new DavError("Insufficient storage", 507);
        }

        const telegramResponse = await telegramAPI.sendDocument(buffer, resolved.file.name, resolved.file.mime);

        let telegramFilePath: string | null = null;
        try {
          const info = await telegramAPI.getFile(telegramResponse.document.file_id);
          telegramFilePath = info.file_path || null;
        } catch {}

        const record = new File({
          name: destName,
          size: buffer.length,
          mime: resolved.file.mime,
          fileId: telegramResponse.document.file_id,
          telegramFilePath,
          telegramMessageId: telegramResponse.message_id,
          owner: userId,
          folder: destination.length === 1 ? null : await resolveParentId(userId, destination),
          ...(resolved.file.originalExt ? { originalExt: resolved.file.originalExt } : {}),
        });
        await record.save();
        sendStatus(res, 201);
        return;
      }

      case "LOCK": {
        const token = `opaquelocktoken:${crypto.randomUUID()}`;
        const body =
          '<?xml version="1.0" encoding="utf-8"?>' + CRLF +
          '<D:prop xmlns:D="DAV:">' + CRLF +
          "<D:lockdiscovery>" + CRLF +
          "<D:activelock>" + CRLF +
          `<D:locktoken><D:href>${escapeXml(token)}</D:href></D:locktoken>` + CRLF +
          `<D:lockroot><D:href>${escapeXml(hrefFor(segments))}</D:href></D:lockroot>` + CRLF +
          `<D:depth>${escapeXml(getDepth(req))}</D:depth>` + CRLF +
          `<D:owner>${escapeXml(user.email)}</D:owner>` + CRLF +
          "</D:activelock>" + CRLF +
          "</D:lockdiscovery>" + CRLF +
          "</D:prop>";
        sendXml(res, 200, body);
        return;
      }

      case "UNLOCK": {
        sendStatus(res, 204);
        return;
      }

      case "PROPPATCH": {
        const body = await readBodyBuffer(req, 1 * 1024 * 1024);
        const props = parsePropfindProps(body.toString("utf8"));
        const responses = props.length
          ? props
              .map(
                (prop) =>
                  "<D:response>" + CRLF +
                  `<D:href>${escapeXml(hrefFor(segments))}</D:href>` + CRLF +
                  "<D:propstat>" + CRLF +
                  `<D:prop><D:${prop}/></D:prop>` + CRLF +
                  "<D:status>HTTP/1.1 403 Forbidden</D:status>" + CRLF +
                  "</D:propstat>" + CRLF +
                  "</D:response>",
              )
              .join(CRLF)
          : "";
        sendXml(res, 207, '<?xml version="1.0" encoding="utf-8"?>' + CRLF + '<D:multistatus xmlns:D="DAV:">' + CRLF + responses + CRLF + "</D:multistatus>");
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
    const folder: IFolder | null = await Folder.findOne({ owner: userId, parent: parentId, name });
    if (!folder) throw new DavError("Parent collection not found", 409);
    parentId = folder._id.toString();
  }
  return parentId;
}