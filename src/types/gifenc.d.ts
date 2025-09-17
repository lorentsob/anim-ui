declare module "gifenc" {
  type Palette = number[][];

  interface WriteFrameOptions {
    palette: Palette;
    delay?: number;
    transparent?: boolean;
    transparentIndex?: number;
  }

  interface GIFEncoderInstance {
    writeFrame(indexedPixels: Uint8Array, width: number, height: number, options: WriteFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    reset(): void;
  }

  export function GIFEncoder(options?: { auto?: boolean }): GIFEncoderInstance;
  export { GIFEncoder as default };
}
