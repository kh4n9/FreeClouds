/// <reference types="node" />

declare module "archiver" {
  import { Writable, Readable } from "stream";
  import { EventEmitter } from "events";

  type ArchiverFormat = "zip" | "tar" | string;

  interface ZlibOptions {
    level?: number;
  }

  interface ArchiverOptions {
    zlib?: ZlibOptions;
    store?: boolean;
    forceLocalTime?: boolean;
    gzip?: boolean;
    gzipOptions?: Record<string, any>;
    // allow additional options
    [key: string]: any;
  }

  interface AppendData {
    name?: string;
    prefix?: string;
    date?: Date;
    mode?: number;
    stats?: any;
    modeOwner?: string;
    // size is useful for some archive formats
    size?: number;
    // other archive-specific options
    [key: string]: any;
  }

  interface Archiver extends EventEmitter {
    // Append a stream, buffer or string with optional entry data
    append(source: Readable | Buffer | string, data?: AppendData): this;

    // Add a file from disk
    file(filePath: string, data?: AppendData): this;

    // Add a directory from disk
    directory(dirPath: string, destPath?: string): this;

    // Finalize archive (returns Promise in many usages; archiver emits events too)
    finalize(): Promise<void> | void;

    // Pipe archive output to writable stream
    pipe(dest: Writable): Writable;

    // Abort the current archive generation
    abort(): void;

    // Event overloads for TypeScript friendliness
    on(event: "warning", listener: (err: Error) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "progress", listener: (progress: any) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    // Allow indexing to access undocumented internals if necessary
    [key: string]: any;
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
