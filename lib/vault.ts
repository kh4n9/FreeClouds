import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Folder, IFolder } from "@/models/Folder";
import { env } from "./env";

/**
 * Vault (hidden folder) support.
 *
 * A hidden folder (`isHidden: true`) is excluded from normal listings:
 *  - it does not appear in GET /api/folders / the sidebar tree,
 *  - it is invisible to WebDAV,
 *  - files inside it are hidden from search / recent / favorites / trash.
 *
 * Access is granted through a signed, http-only cookie (`vault`) holding the
 * folder ids the user has unlocked. Unlocking a folder requires the correct
 * PIN (bcrypt hash on the folder doc); forgotten PINs are recoverable via an
 * email verification code (type "vault_pin_reset").
 */

export const VAULT_COOKIE_NAME = "vault";
export const VAULT_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
export const MAX_UNLOCKED_FOLDERS = 50;
const SALT_ROUNDS = 10;
const PIN_REGEX = /^\d{4,8}$/;

export interface VaultPayload {
  folderIds: string[];
  exp?: number;
}

export function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name && rest.length > 0) {
      cookies[name] = rest.join("=");
    }
  });
  return cookies;
}

/** Decode the vault cookie into the set of unlocked folder ids. */
export function readVaultFolderIds(request: Request): Set<string> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return new Set();

  const raw = parseCookieHeader(cookieHeader)[VAULT_COOKIE_NAME];
  if (!raw) return new Set();

  try {
    const decoded = jwt.verify(raw, env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as VaultPayload;
    if (!Array.isArray(decoded.folderIds)) return new Set();
    return new Set(decoded.folderIds.filter((id) => typeof id === "string"));
  } catch {
    return new Set();
  }
}

/** Build a Set-Cookie header value for the vault cookie. */
export function buildVaultCookie(folderIds: string[]): string {
  const unique = Array.from(new Set(folderIds)).slice(0, MAX_UNLOCKED_FOLDERS);
  const token = jwt.sign({ folderIds: unique } satisfies VaultPayload, env.JWT_SECRET, {
    expiresIn: VAULT_COOKIE_MAX_AGE,
    algorithm: "HS256",
  });

  const secure = env.NODE_ENV === "production";
  return [
    `${VAULT_COOKIE_NAME}=${token}`,
    `Max-Age=${VAULT_COOKIE_MAX_AGE}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** Build the vault cookie with the given folder id added (or removed). */
export function addVaultFolder(request: Request, folderId: string): string {
  const unlocked = readVaultFolderIds(request);
  unlocked.add(folderId);
  return buildVaultCookie(Array.from(unlocked));
}

export function removeVaultFolder(request: Request, folderId: string): string {
  const unlocked = readVaultFolderIds(request);
  unlocked.delete(folderId);
  return buildVaultCookie(Array.from(unlocked));
}

/**
 * A folder is accessible when every hidden folder along its parent chain is
 * in the unlocked set (the vault cookie).
 */
export async function isFolderUnlocked(
  request: Request,
  folder: IFolder | null,
): Promise<boolean> {
  if (!folder) return false;

  const unlocked = readVaultFolderIds(request);
  let current: IFolder | null = folder;
  const visited = new Set<string>();

  while (current) {
    const id = (current._id as unknown as { toString(): string }).toString();
    if (visited.has(id)) break;
    visited.add(id);

    if (current.isHidden && !unlocked.has(id)) {
      return false;
    }

    if (current.parent) {
      current = await Folder.findById(current.parent);
      if (!current) return false;
    } else {
      break;
    }
  }

  return true;
}

/**
 * Whether the requester may place a NEW hidden folder under `folder`: the
 * chain must contain an already-unlocked hidden ancestor (otherwise the new
 * hidden folder would be unreachable from the vault section, which only lists
 * hidden root folders).
 */
export async function isInsideUnlockedVault(
  request: Request,
  folder: IFolder | null,
): Promise<boolean> {
  if (!folder) return true; // root — hidden folders are always allowed at root

  const unlocked = readVaultFolderIds(request);
  let current: IFolder | null = folder;
  const visited = new Set<string>();

  while (current) {
    const id = (current._id as unknown as { toString(): string }).toString();
    if (visited.has(id)) break;
    visited.add(id);

    if (current.isHidden) {
      return unlocked.has(id);
    }

    if (current.parent) {
      current = await Folder.findById(current.parent);
      if (!current) return false;
    } else {
      break;
    }
  }

  return false;
}

/** Resolve a folder by id and check ownership + vault access in one step. */
export async function getAccessibleFolder(
  request: Request,
  folderId: string,
  ownerId: string,
): Promise<IFolder | null> {
  const folder = await Folder.findOne({
    _id: folderId,
    owner: ownerId,
  });
  if (!folder) return null;
  if (!(await isFolderUnlocked(request, folder))) return null;
  return folder;
}

/**
 * Filter a flat list of folders, keeping only those whose parent chain is
 * visible to the requester (no hidden ancestor that is still locked).
 */
export async function filterVisibleFolders(
  request: Request,
  folders: IFolder[],
): Promise<IFolder[]> {
  if (folders.length === 0) return [];

  const unlocked = readVaultFolderIds(request);
  const byId = new Map<string, IFolder>();
  for (const folder of folders) {
    byId.set((folder._id as unknown as { toString(): string }).toString(), folder);
  }

  const visible: IFolder[] = [];
  for (const folder of folders) {
    let current: IFolder | null = folder;
    const visited = new Set<string>();
    let ok = true;

    while (current) {
      const id = (current._id as unknown as { toString(): string }).toString();
      if (visited.has(id)) break;
      visited.add(id);

      if (current.isHidden && !unlocked.has(id)) {
        ok = false;
        break;
      }

      if (current.parent) {
        current = byId.get(current.parent.toString()) || null;
      } else {
        break;
      }
    }

    if (ok) visible.push(folder);
  }

  return visible;
}

/**
 * Compute the set of folder ids the requester may NOT see (locked hidden
 * folders plus everything nested underneath). Used to filter files in
 * cross-folder listings (search, recent, favorites).
 */
export async function getInaccessibleFolderIds(
  request: Request,
  ownerId: string,
): Promise<string[]> {
  const all = await Folder.find({ owner: ownerId });
  if (all.length === 0) return [];

  const unlocked = readVaultFolderIds(request);
  const byId = new Map<string, IFolder>();
  for (const folder of all) {
    byId.set((folder._id as unknown as { toString(): string }).toString(), folder);
  }

  const inaccessible = new Set<string>();

  for (const folder of all) {
    const id = (folder._id as unknown as { toString(): string }).toString();
    if (inaccessible.has(id)) continue;

    let current: IFolder | null = folder;
    const visited = new Set<string>();
    let locked = false;

    while (current) {
      const curId = (current._id as unknown as { toString(): string }).toString();
      if (visited.has(curId)) break;
      visited.add(curId);

      if (current.isHidden && !unlocked.has(curId)) {
        locked = true;
        break;
      }

      if (current.parent) {
        current = byId.get(current.parent.toString()) || null;
      } else {
        break;
      }
    }

    if (locked) {
      // Mark every descendant of the locked chain entry as inaccessible.
      const mark = (node: IFolder) => {
        const nodeId = (node._id as unknown as { toString(): string }).toString();
        inaccessible.add(nodeId);
        for (const child of all) {
          if (
            child.parent &&
            child.parent.toString() === nodeId &&
            !inaccessible.has((child._id as unknown as { toString(): string }).toString())
          ) {
            mark(child);
          }
        }
      };
      mark(folder);
    }
  }

  return Array.from(inaccessible);
}

/** List hidden root folders with lock state for the vault sidebar section. */
export async function getVaultEntries(
  request: Request,
  ownerId: string,
): Promise<
  Array<{ id: string; name: string; locked: boolean; unlocked: boolean }>
> {
  const hiddenRoots = await Folder.find({
    owner: ownerId,
    parent: null,
    isHidden: true,
  }).sort({ name: 1 });

  const unlocked = readVaultFolderIds(request);

  return hiddenRoots.map((folder) => {
    const id = (folder._id as unknown as { toString(): string }).toString();
    const isUnlocked = unlocked.has(id);
    return {
      id,
      name: folder.name,
      locked: !!folder.pinHash,
      unlocked: isUnlocked,
    };
  });
}