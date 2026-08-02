/// <reference types="node" />

declare module "archiver" {
  import { Readable } from "stream";
  import { Stats } from "fs";
  import { ZlibOptions } from "zlib";

  type ArchiverFormat = "zip" | "tar" | string;

  interface ArchiverOptions {
    statConcurrency?: number;
    zlib?: ZlibOptions;
    store?: boolean;
    forceLocalTime?: boolean;
    gzip?: boolean;
    gzipOptions?: ZlibOptions;
  }

  interface EntryData {
    name?: string;
    prefix?: string;
    date?: Date;
    mode?: number;
    modeOwner?: string;
    stats?: Stats;
    size?: number;
  }

  interface Archiver extends Readable {
    append(source: Readable | Buffer | string, data?: EntryData): this;
    file(filePath: string, data?: EntryData): this;
    directory(dirPath: string, destPath?: string, data?: EntryData): this;
    symlink(filepath: string, target: string, mode?: number): this;
    finalize(): Promise<void>;
    abort(): void;
  }

  /**
   * Create an archiver instance
   *
   * Usage:
   *   const archive = archiver('zip', { zlib: { level: 9 } });
   */
  function archiver(format: ArchiverFormat, options?: ArchiverOptions): Archiver;

  export = archiver;
}
