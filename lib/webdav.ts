import type { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db";
import { User, type IUser } from "@/models/User";
import { Folder, type IFolder } from "@/models/Folder";
import { File, type IFile } from "@/models/File";
import { telegramAPI } from "./telegram";

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
  return rest.split("/").filter(Boolean).map(decodeURIComponent);
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

  await connectToDatabase();
  const user = await User.findByEmail(email);
  const hash = user?.webdavTokenHash;
  if (!user || !hash) {
    throw new DavError("Authentication failed", 401);
  }
  const valid = await bcrypt.compare(token, hash);
  if (!valid) {
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
    });
    if (!folder) return { kind: "missing", parentId, name: seg };
    parentId = folder._id.toString();
  }

  const name = segments[segments.length - 1]!;
  const folder = await Folder.findOne({ owner: userId, parent: parentId, name });
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

/** Send a raw status response. */
export function sendStatus(res: ServerResponse, status: number = 200) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": "0",
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
  const headers: Record<string, string> = {
    "Content-Type": 'application/xml; charset="utf-8"',
    "Content-Length": String(Buffer.byteLength(body, "utf8")),
    ...extraHeaders,
  };
  res.writeHead(status, headers);
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
          props.push(`<D:getetag>"${escapeXml(entry.href)}"</D:getetag>`);
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

/** Stream a file body to the response (used by GET/HEAD). */
export async function streamFileBody(
  res: ServerResponse,
  file: IFile,
): Promise<void> {
  const displayName = file.originalExt
    ? file.name.replace(/\.bin$/i, "") + file.originalExt
    : file.name;
  const headers: Record<string, string> = {
    "Content-Type": file.mime || "application/octet-stream",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(displayName)}`,
    "Content-Length": String(file.size ?? 0),
    "ETag": `"${file._id.toString()}"`,
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
  };

  const chunked = file.chunkedId && file.totalChunks && file.totalChunks > 1;

  if (chunked) {
    // Assemble chunked files into a buffer then stream.
    try {
      const chunks = await File.find({
        chunkedId: file.chunkedId,
        chunkIndex: { $gte: 0 },
        owner: file.owner,
        deletedAt: null,
      }).sort({ chunkIndex: 1 });
      if (chunks.length !== file.totalChunks) throw new DavError("File chunks not found", 404);
      const parts: Buffer[] = [];
      for (const c of chunks) {
        const result = await telegramAPI.getFileStream(c.fileId, c.telegramFilePath || undefined);
        if (!c.telegramFilePath && result.filePath) {
          File.updateOne({ _id: c._id }, { telegramFilePath: result.filePath }).catch(() => {});
        }
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
      const assembled = Buffer.concat(parts);
      res.writeHead(200, headers);
      res.end(assembled);
      return;
    } catch (error) {
      if (error instanceof DavError) throw error;
      throw new DavError("Failed to assemble file", 500);
    }
  }

  // Non-chunked: stream directly from Telegram.
  let stream: ReadableStream<Uint8Array>;
  let knownSize: number | undefined;
  try {
    const cached = file.telegramFilePath;
    const result = await telegramAPI.getFileStream(file.fileId, cached || undefined);
    stream = result.stream;
    knownSize = result.size;
    if (!cached && result.filePath) {
      File.updateOne({ _id: file._id }, { telegramFilePath: result.filePath }).catch(() => {});
    }
  } catch (error) {
    console.error("WebDAV download failed:", error);
    throw new DavError("File temporarily unavailable", 503);
  }

  if (knownSize !== undefined) {
    headers["Content-Length"] = String(knownSize);
  }

  res.writeHead(200, headers);
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