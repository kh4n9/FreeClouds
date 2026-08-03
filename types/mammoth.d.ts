declare module "mammoth" {
  export interface MammothResult {
    value: string;
    messages: unknown[];
  }

  export interface MammothOptions {
    styleMap?: string[];
    includeDefaultStyleMap?: boolean;
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { path: string } | { buffer: Buffer },
    options?: MammothOptions,
  ): Promise<MammothResult>;
}
