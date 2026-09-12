import type { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db";
import { User, type IUser } from "@/models/User";
import { Folder, type IFolder } from "@/models/Folder";
import { File, type IFile } from "@/models/File";
import type { ILock } from "@/models/Lock";
import { telegramAPI } from "./telegram";
import { checkRateLimitByIdentifier, RATE_LIMITS } from "./ratelimit";
import { parseRangeHeader } from "./file-utils";
import { iterateChunkBytes, type ChunkRef } from "./chunk-stream";

// Re-exported so existing importers keep working; the implementation is
// shared with lib/download-file.ts (it used to be duplicated verbatim, and
// neither copy handled suffix ranges).
export { parseRangeHeader };

export const WEBDAV_PREFIX = "/webdav";

export class DavError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "DavError";
  }
}

const CRLF = "\r\n";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function toHttpDate(date: Date): string {
  return date.toUTCString();
}

export function toIsoDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Encode a path segment for use inside <D:href>. */
function encodeSeg(seg: string): string {
  return encodeURIComponent(seg).replace(/#/g, "%23");
}

export function hrefFor(segments: string[]): string {
  return `${WEBDAV_PREFIX}/${segments.map(encodeSeg).join("/")}`;
}

/**
 * Extract the decoded path segments from a WebDAV request. Handles both
 * direct hits on /api/webdav/... and the /webdav/... proxy rewrite (where
 * the next.js pages router does NOT populate req.query.path).
 */
export function getPathSegments(req: IncomingMessage): string[] {
  const query = (req as unknown as { query?: Record<string, unknown> }).query;
  const q = query?.path;
  if (Array.isArray(q)) {
    return q.map((s) => String(s));
  }
  const pathname = new URL(req.url || "/", "http://local").pathname;
  let rest = pathname;
  for (const prefix of ["/api/webdav", "/webdav"]) {
    if (rest === prefix) return [];
    if (rest.startsWith(`${prefix}/`)) {
      rest = rest.slice(prefix.length);
      break;
    }
  }
  return rest
    .split("/")
    .filter(Boolean)
    .map(decodeSegment);
}

/**
 * Percent-decode one path segment, turning malformed encoding into a 400.
 * A bare `decodeURIComponent` throws URIError, which surfaced as a 500.
 */
function decodeSegment(seg: string): string {
  try {
    return decodeURIComponent(seg);
  } catch {
    throw new DavError("Malformed percent-encoding in path", 400);
  }
}

/** Parse a WebDAV Depth header; returns "0" | "1" | "infinity" (default infinity). */
export function getDepth(req: IncomingMessage): string {
  const depth = req.headers.depth;
  if (typeof depth === "string" && (depth === "0" || depth === "1" || depth === "infinity")) {
    return depth;
  }
  return "infinity";
}

/** Extract the authenticated user from a Basic Authorization header. */
export async function authenticateWebDav(req: IncomingMessage): Promise<IUser> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Basic ")) {
    throw new DavError("Authentication required", 401);
  }
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
  } catch {
    throw new DavError("Invalid authorization header", 401);
  }
  const sep = decoded.indexOf(":");
  if (sep === -1) throw new DavError("Invalid authorization header", 401);
  const email = decoded.slice(0, sep).trim().toLowerCase();
  const token = decoded.slice(sep + 1);
  if (!email || !token) throw new DavError("Invalid authorization header", 401);

  // Throttle by the account being attacked, not by client IP: the WebDAV
  // handler had no rate limiting at all, leaving bcrypt.compare below open to
  // unthrottled brute force. Keying on the email also means a spoofed
  // X-Forwarded-For cannot be rotated to bypass the limit.
  const limit = checkRateLimitByIdentifier(
    email,
    RATE_LIMITS.WEBDAV,
    "webdav-auth",
  );
  if (!limit.allowed) {
    console.error(`WebDAV auth rate limit exceeded for ${email}`);
    throw new DavError("Too many authentication attempts", 429);
  }

  await connectToDatabase();
  const user = await User.findByEmail(email);
  const hash = user?.webdavTokenHash;
  if (!user || !hash) {
    console.error(`WebDAV auth failed for ${email}: no webdav token configured`);
    throw new DavError("Authentication failed", 401);
  }
  const valid = await bcrypt.compare(token, hash);
  if (!valid) {
    console.error(`WebDAV auth failed for ${email}: token mismatch (client may hold a revoked/rotated token)`);
    throw new DavError("Authentication failed", 401);
  }
  return user;
}

/**
 * Resolve a WebDAV path against a user's drive.
 * - kind "root": the user's root collection
 * - kind "folder": a folder
 * - kind "file": a file
 * - kind "missing": no resource at this name; parentId is the resolved parent
 */
export type ResolvedPath =
  | { kind: "root" }
  | { kind: "folder"; folder: IFolder }
  | { kind: "file"; file: IFile }
  | { kind: "missing"; parentId: string | null; name: string };

export async function resolvePath(
  userId: string,
  segments: string[],
): Promise<ResolvedPath> {
  await connectToDatabase();
  if (segments.length === 0) return { kind: "root" };

  let parentId: string | null = null;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]!;
    const folder: IFolder | null = await Folder.findOne({
      owner: userId,
      parent: parentId,
      name: seg,
      isHidden: { $ne: true },
      deletedAt: null,
    });
    if (!folder) return { kind: "missing", parentId, name: seg };
    parentId = folder._id.toString();
  }

  const name = segments[segments.length - 1]!;
  const folder = await Folder.findOne({
    owner: userId,
    parent: parentId,
    name,
    isHidden: { $ne: true },
    // Soft-deleted folders are in the trash: a mounted drive must not resolve
    // them, or a DELETE'd collection would stay reachable over WebDAV.
    deletedAt: null,
  });
  if (folder) return { kind: "folder", folder };

  const file = await File.findOne({
    owner: userId,
    folder: parentId,
    name,
    deletedAt: null,
    $or: [{ chunkedId: null }, { chunkIndex: -1 }],
  });
  if (file) return { kind: "file", file };

  return { kind: "missing", parentId, name };
}

/** Default LOCK lifetime when the client does not request one. */
export const DEFAULT_LOCK_TIMEOUT_SECONDS = 30 * 60;

/** Longest lock we will grant, however long the client asks for. */
const MAX_LOCK_TIMEOUT_SECONDS = 4 * 60 * 60;

/**
 * Pull the lock token out of an `If` header.
 *
 * Clients send the token back either as `If: (<token>)` (the RFC 4918 form) or
 * wrapped in angle brackets by misbehaving implementations, so accept both.
 */
function tokenFromIfHeader(ifHeader: string | string[] | undefined): string | null {
  if (!ifHeader) return null;
  const raw = Array.isArray(ifHeader) ? ifHeader.join(" ") : ifHeader;
  const match = raw.match(/\(<([^>]+)>\)/) ?? raw.match(/<([^>]+)>/);
  return match?.[1] ?? null;
}

/**
 * Is this path writable by the requester, given the lock state?
 *
 * Returns the blocking lock when someone else holds one and the request does
 * not present its token; the caller turns that into a 423 Locked. A request
 * that supplies the matching token (Lock-Token header, as UNLOCK does, or an
 * `If` header, as PUT/DELETE do) is allowed through — that is how the lock
 * owner writes to a resource it has locked.
 */
export async function findBlockingLock(
  ownerId: string,
  segments: string[],
  req: IncomingMessage,
): Promise<ILock | null> {
  const { Lock } = await import("@/models/Lock");
  const path = `/${segments.join("/")}`;

  const lock = await Lock.findOne({
    owner: ownerId,
    path,
    expiresAt: { $gt: new Date() },
  });
  if (!lock) return null;

  const presented =
    (typeof req.headers["lock-token"] === "string"
      ? req.headers["lock-token"]
      : null) ?? tokenFromIfHeader(req.headers.if);

  // Accept the bare token or the angle-bracketed form clients echo back.
  if (presented && presented.replace(/[<>]/g, "") === lock.token) return null;

  return lock;
}

/** Throw 423 if the path is locked by a principal that did not present the token. */
export async function enforceLock(
  ownerId: string,
  segments: string[],
  req: IncomingMessage,
): Promise<void> {
  const blocking = await findBlockingLock(ownerId, segments, req);
  if (blocking) {
    throw new DavError("Locked: resource has an active lock", 423);
  }
}

/**
 * Take (or refresh) a lock on a path. Returns the token and its lifetime.
 *
 * A second LOCK from a *different* principal on an already-locked path is a
 * 423 rather than silently stealing the lock.
 */
export async function acquireLock(
  ownerId: string,
  segments: string[],
  req: IncomingMessage,
  requestedTimeoutSeconds?: number,
): Promise<{ token: string; timeoutSeconds: number; created: boolean }> {
  const { Lock } = await import("@/models/Lock");
  const path = `/${segments.join("/")}`;
  const now = new Date();

  const timeoutSeconds = Math.min(
    requestedTimeoutSeconds && requestedTimeoutSeconds > 0
      ? requestedTimeoutSeconds
      : DEFAULT_LOCK_TIMEOUT_SECONDS,
    MAX_LOCK_TIMEOUT_SECONDS,
  );
  const expiresAt = new Date(now.getTime() + timeoutSeconds * 1000);
  const presented =
    (typeof req.headers["lock-token"] === "string"
      ? req.headers["lock-token"]
      : null) ?? tokenFromIfHeader(req.headers.if);

  const existing = await Lock.findOne({
    owner: ownerId,
    path,
    expiresAt: { $gt: now },
  });

  if (existing) {
    const isOwnerOfLock =
      presented && presented.replace(/[<>]/g, "") === existing.token;
    if (!isOwnerOfLock) {
      throw new DavError("Locked: resource already has an active lock", 423);
    }
    existing.expiresAt = expiresAt;
    existing.depth = getDepth(req);
    await existing.save();
    return { token: existing.token, timeoutSeconds, created: false };
  }

  const token = `opaquelocktoken:${crypto.randomUUID()}`;
  await Lock.create({
    owner: ownerId,
    path,
    token,
    depth: getDepth(req),
    expiresAt,
  });

  return { token, timeoutSeconds, created: true };
}

/** Release a lock. Returns false when the token does not match the live lock. */
export async function releaseLock(
  ownerId: string,
  segments: string[],
  token: string,
): Promise<"released" | "no-lock" | "mismatch"> {
  const { Lock } = await import("@/models/Lock");
  const path = `/${segments.join("/")}`;

  const existing = await Lock.findOne({
    owner: ownerId,
    path,
    expiresAt: { $gt: new Date() },
  });
  if (!existing) return "no-lock";

  if (existing.token !== token.replace(/[<>]/g, "")) return "mismatch";

  await existing.deleteOne();
  return "released";
}

/** Parse a `Timeout: Second-N` / `Infinite` request header. */
export function parseLockTimeout(
  header: string | string[] | undefined,
): number | undefined {
  if (!header) return undefined;
  const raw = Array.isArray(header) ? header[0] : header;
  const match = raw?.match(/Second-(\d+)/i);
  if (!match?.[1]) return undefined;
  const seconds = parseInt(match[1], 10);
  return Number.isFinite(seconds) ? seconds : undefined;
}

/** Send a raw status response. */
export function sendStatus(res: ServerResponse, status: number = 200) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": "0",
    // Windows WebDAV mini-redirector cannot decode gzip'd DAV responses;
    // declaring identity stops the server compression layer from gzip'ing.
    "Content-Encoding": "identity",
  });
  res.end();
}

/** Send an XML response. */
export function sendXml(
  res: ServerResponse,
  status: number,
  body: string,
  extraHeaders: Record<string, string> = {},
): void {
  // Headers must be set via res.setHeader (not writeHead): the dev-server
  // compression layer honors pre-set Content-Encoding and skips the response.
  res.setHeader("Content-Type", 'application/xml; charset="utf-8"');
  res.setHeader("Content-Length", String(Buffer.byteLength(body, "utf8")));
  // Windows WebDAV mini-redirector cannot decode gzip'd 207 Multi-Status
  // (shows "Could not find this item"); declaring identity stops the
  // server compression layer from gzip'ing these responses.
  res.setHeader("Content-Encoding", "identity");
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
  res.statusCode = status;
  res.end(body);
}

export const PROPFIND_MULTISTATUS_XML =
  '<?xml version="1.0" encoding="utf-8"?>' + CRLF +
  '<D:multistatus xmlns:D="DAV:">' + CRLF +
  "%s" +
  "</D:multistatus>";

interface PropEntry {
  href: string;
  isCollection: boolean;
  displayName: string;
  size?: number;
  mime?: string;
  lastModified: Date;
  createdAt: Date;
  /**
   * Entity tag. Must be the same value GET/HEAD return as their ETag header,
   * otherwise clients that cache on PROPFIND and revalidate on GET see a
   * mismatch. Both are the resource's _id.
   */
  etag: string;
}

/** PROPFIND response: all properties when no body, or the requested props. */
export function propfindResponse(
  entries: PropEntry[],
  requestedProps: string[] = [],
): string {
  const wanted = new Set(requestedProps.map((p) => p.toLowerCase()));
  const allProps = [
    "resourcetype",
    "displayname",
    "getetag",
    "getcontentlength",
    "getcontenttype",
    "getlastmodified",
    "creationdate",
    "supportedlock",
    "lockdiscovery",
  ];
  const wantAll = wanted.size === 0 || wanted.has("allprop");
  const wantedProps = wantAll ? allProps : allProps.filter((p) => wanted.has(p));

  const responses = entries.map((entry) => {
    const props: string[] = [];
    for (const prop of wantedProps) {
      switch (prop) {
        case "resourcetype":
          props.push(`<D:resourcetype>${entry.isCollection ? "<D:collection/>" : ""}</D:resourcetype>`);
          break;
        case "displayname":
          props.push(`<D:displayname>${escapeXml(entry.displayName)}</D:displayname>`);
          break;
        case "getetag":
          props.push(`<D:getetag>"${escapeXml(entry.etag)}"</D:getetag>`);
          break;
        case "creationdate":
          props.push(`<D:creationdate>${toIsoDate(entry.createdAt)}</D:creationdate>`);
          break;
        case "getcontentlength":
          if (!entry.isCollection) props.push(`<D:getcontentlength>${entry.size ?? 0}</D:getcontentlength>`);
          break;
        case "getcontenttype":
          if (!entry.isCollection) props.push(`<D:getcontenttype>${escapeXml(entry.mime || "application/octet-stream")}</D:getcontenttype>`);
          break;
        case "getlastmodified":
          props.push(`<D:getlastmodified>${escapeXml(toHttpDate(entry.lastModified))}</D:getlastmodified>`);
          break;
        case "supportedlock":
          props.push("<D:supportedlock/>");
          break;
        case "lockdiscovery":
          props.push("<D:lockdiscovery/>");
          break;
        default:
          break;
      }
    }

    return (
      "<D:response>" + CRLF +
      `<D:href>${escapeXml(entry.href)}</D:href>` + CRLF +
      "<D:propstat>" + CRLF +
      "<D:prop>" + CRLF +
      props.join(CRLF) + CRLF +
      "</D:prop>" + CRLF +
      "<D:status>HTTP/1.1 200 OK</D:status>" + CRLF +
      "</D:propstat>" + CRLF +
      "</D:response>" + CRLF
    );
  });

  return PROPFIND_MULTISTATUS_XML.replace("%s", responses.join(""));
}

/** Parse `bytes=a-b` / `bytes=a-` against a known size; null when invalid. */

/** Stream a file body to the response (used by GET/HEAD). */
export async function streamFileBody(
  res: ServerResponse,
  file: IFile,
): Promise<void> {
  const displayName = file.originalExt
    ? file.name.replace(/\.bin$/i, "") + file.originalExt
    : file.name;
  const size = file.size ?? 0;
  const rangeHeader = res.req.headers.range;
  const parsedRange = parseRangeHeader(rangeHeader, size);
  const status = parsedRange ? 206 : 200;
  const headers: Record<string, string> = {
    "Content-Type": file.mime || "application/octet-stream",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(displayName)}`,
    "ETag": `"${file._id.toString()}"`,
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
  };
  if (parsedRange) {
    headers["Content-Range"] = `bytes ${parsedRange.start}-${parsedRange.end}/${size}`;
    headers["Content-Length"] = String(parsedRange.end - parsedRange.start + 1);
  } else if (size > 0) {
    headers["Content-Length"] = String(size);
  }

  const chunked = file.chunkedId && file.totalChunks && file.totalChunks > 1;

  // Chunked files are assembled from their Telegram parts on demand.
  // Instead of buffering the entire file in memory, we stream chunks
  // sequentially so memory usage stays bounded regardless of file size.
  if (chunked) {
    // HEAD never writes a body; GET must still send the headers computed above,
    // otherwise the response is an implicit 200 with no Content-Type,
    // Content-Disposition, Content-Length, ETag or Accept-Ranges, and a ranged
    // request is answered 200 instead of 206 (so resumable reads — the whole
    // point of mounting a drive — silently break for every file over 50MB).
    if (res.req.method === "HEAD") {
      res.writeHead(status, headers);
      res.end();
      return;
    }
    try {
      await streamChunkedFile(res, file, parsedRange, status, headers);
      return;
    } catch (error) {
      if (error instanceof DavError) throw error;
      throw new DavError("Failed to assemble file", 500);
    }
  }

  // Non-chunked: stream directly from Telegram, forwarding ranged requests
  // one-to-one (Telegram honors Range headers).
  let stream: ReadableStream<Uint8Array>;
  try {
    const cached = file.telegramFilePath;
    const result = parsedRange
      ? await telegramAPI.getFileStream(
          file.fileId,
          cached || undefined,
          { start: parsedRange.start, end: parsedRange.end },
        )
      : await telegramAPI.getFileStream(file.fileId, cached || undefined);
    stream = result.stream;
    if (!cached && result.filePath) {
      File.updateOne({ _id: file._id }, { telegramFilePath: result.filePath }).catch(() => {});
    }
  } catch (error) {
    console.error("WebDAV download failed:", error);
    throw new DavError("File temporarily unavailable", 503);
  }

  if (rangeHeader && !parsedRange) {
    headers["Content-Range"] = `bytes */${size}`;
    res.writeHead(416, headers);
    res.end();
    return;
  }

  res.writeHead(status, headers);
  if (res.req.method === "HEAD") {
    res.end();
    return;
  }
  const nodeStream = Readable.fromWeb(stream as never);
  nodeStream.pipe(res);
}

/** Parse an RFC 4918 request body string (XML) into prop names requested. */
export function parsePropfindProps(body: string): string[] {
  if (!body || !body.trim()) return [];
  const found = new Set<string>();
  const propPattern = /<\s*\w*:?(\w+)\s[^>]*>.*?<\s*\/\s*\w*:?\1\s*>/g;
  let match;
  while ((match = propPattern.exec(body)) !== null) {
    found.add(match[1]!);
  }
  const simplePattern = /<\s*\w*:?(\w+)\s*\/?\s*>/g;
  while ((match = simplePattern.exec(body)) !== null) {
    found.add(match[1]!);
  }
  return Array.from(found);
}

/**
 * Extract the property names from a PROPPATCH body.
 *
 * PROPPATCH uses a different shape from PROPFIND:
 *   <D:propertyupdate><D:set><D:prop><D:displayname>x</D:displayname></D:prop></D:set>
 *                      </D:propertyupdate>
 *
 * Running parsePropfindProps() over that yields the container elements
 * ("propertyupdate", "set", "prop") and never the real property names, so the
 * response used to report 403 for the wrong properties. This walks the <prop>
 * blocks and returns their direct children instead.
 *
 * Names are returned fully qualified (e.g. "D:getlastmodified") so the response
 * can echo the client's own namespace prefix rather than assuming DAV:.
 */
export function parseProppatchProps(body: string): string[] {
  if (!body || !body.trim()) return [];

  const names: string[] = [];
  const seen = new Set<string>();

  // Non-greedy match of each <prefix:prop ...> ... </prefix:prop> block.
  const propBlock = /<\s*([\w-]+:)?prop[^>]*>([\s\S]*?)<\s*\/\s*?prop\s*>/gi;
  let block: RegExpExecArray | null;

  while ((block = propBlock.exec(body)) !== null) {
    const inner = block[2] ?? "";
    // Direct children: either self-closing or with content.
    const child = /<\s*([\w-]+(?::[\w-]+)?)[^>]*?\/?\s*>/g;
    let el: RegExpExecArray | null;
    while ((el = child.exec(inner)) !== null) {
      const name = el[1]!;
      // Skip container-looking noise; a real property is never these.
      if (/^(?:prop|set|remove)$/i.test(name.split(":").pop() ?? "")) continue;
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }

  return names;
}

/**
 * Stream a chunked file from its Telegram parts sequentially, so memory
 * stays bounded (only one part is buffered at a time). Supports optional
 * byte-range requests by skipping bytes before the range start.
 */
async function streamChunkedFile(
  res: ServerResponse,
  file: IFile,
  parsedRange: { start: number; end: number } | null,
  status: number,
  headers: Record<string, string>,
): Promise<void> {
  const chunks = await File.find({
    chunkedId: file.chunkedId!,
    chunkIndex: { $gte: 0 },
    owner: file.owner,
    deletedAt: null,
  }).sort({ chunkIndex: 1 });
  if (chunks.length !== file.totalChunks) {
    throw new DavError("File chunks not found", 404);
  }

  const chunkRefs: ChunkRef[] = chunks.map((c) => ({
    fileId: c.fileId,
    telegramFilePath: c.telegramFilePath || null,
    size: c.size || 0,
  }));

  // Headers only once the chunk set is known to be complete: a DavError thrown
  // above still needs to reach the caller's error handler so it can send a
  // proper 404 rather than a half-written response.
  res.writeHead(status, headers);

  // Sequential read via the shared helper, honouring backpressure with an
  // explicit drain wait. Range handling (suffix ranges included) now lives in
  // planChunkSlices() and is shared with the HTTP download path instead of
  // being reimplemented here.
  try {
    for await (const buf of iterateChunkBytes(
      chunkRefs,
      parsedRange,
      async (chunk, index) => {
        const result = await telegramAPI.getFileStream(
          chunk.fileId,
          chunk.telegramFilePath || undefined,
        );
        if (!chunk.telegramFilePath && result.filePath) {
          const doc = chunks[index];
          if (doc) {
            File.updateOne(
              { _id: doc._id },
              { telegramFilePath: result.filePath },
            ).catch(() => {});
          }
        }
        return { stream: result.stream, filePath: result.filePath ?? null };
      },
    )) {
      if (!res.write(buf)) {
        await new Promise<void>((resolve) =>
          res.once("drain", () => resolve()),
        );
      }
    }
    res.end();
  } catch (error) {
    if (error instanceof DavError) throw error;
    console.error("WebDAV chunked stream failed:", error);
    // The status line and headers are already on the wire, so the only honest
    // signal left is to abort the connection — a truncated body with a
    // Content-Length would otherwise look like a complete download.
    res.destroy();
  }
}