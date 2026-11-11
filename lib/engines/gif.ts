import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { decompressFrame, parseGIF } from "gifuct-js";

// Reading and writing animated GIFs. Used by the GIF tools. This module is
// loaded only when one of them runs.

// Writes GIF frames. Pixels that did not change since the last frame are
// left transparent, which makes the file much smaller.
export class GifWriter {
  private gif = GIFEncoder();
  // What the viewer sees after the frames written so far.
  private shown: Uint8ClampedArray | null = null;
  frames = 0;

  constructor(
    private width: number,
    private height: number,
    private maxColors: number,
    // How different a pixel must be to count as changed. Sum of the red,
    // green and blue differences.
    private tolerance: number,
  ) {}

  add(rgba: Uint8ClampedArray, delayMs: number) {
    const { width, height } = this;
    const delay = Math.max(20, Math.round(delayMs / 10) * 10);
    const palette = quantize(rgba, this.maxColors - 1);
    const index = applyPalette(rgba, palette);
    const transparentIndex = palette.length;
    const full = [...palette, [0, 0, 0]];

    if (this.shown === null) {
      this.shown = new Uint8ClampedArray(rgba);
      this.gif.writeFrame(index, width, height, { palette: full, delay });
    } else {
      const shown = this.shown;
      for (let pixel = 0, i = 0; pixel < index.length; pixel++, i += 4) {
        const difference =
          Math.abs(rgba[i] - shown[i]) +
          Math.abs(rgba[i + 1] - shown[i + 1]) +
          Math.abs(rgba[i + 2] - shown[i + 2]);
        if (difference <= this.tolerance) {
          index[pixel] = transparentIndex;
        } else {
          shown[i] = rgba[i];
          shown[i + 1] = rgba[i + 1];
          shown[i + 2] = rgba[i + 2];
        }
      }
      this.gif.writeFrame(index, width, height, {
        palette: full,
        delay,
        transparent: true,
        transparentIndex,
        // Keep the last picture in place, so untouched pixels show through.
        dispose: 1,
      });
    }
    this.frames++;
  }

  finish(): Uint8Array {
    this.gif.finish();
    return this.gif.bytes();
  }
}

export type GifInfo = {
  width: number;
  height: number;
  frameCount: number;
};

type RawFrame = Parameters<typeof decompressFrame>[0];

// Reads a GIF and hands out each complete picture in turn. Frames are
// unpacked one at a time, so memory use stays low.
export function readGif(buffer: ArrayBuffer): {
  info: GifInfo;
  // The canvas holds the current complete picture after each step.
  canvas: OffscreenCanvas;
  frames: () => Generator<{ delayMs: number; number: number }>;
} {
  const parsed = parseGIF(buffer);
  const width = parsed.lsd.width;
  const height = parsed.lsd.height;
  const raw = parsed.frames.filter(
    (frame): frame is RawFrame => "image" in frame,
  );
  if (width <= 0 || height <= 0 || raw.length === 0) {
    throw new Error("The GIF has no pictures in it.");
  }

  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot draw the GIF.");

  function* frames() {
    let previous: {
      disposal: number;
      dims: { left: number; top: number; width: number; height: number };
      saved: ImageData | null;
    } | null = null;

    for (let number = 0; number < raw.length; number++) {
      const frame = decompressFrame(raw[number], parsed.gct, true);

      // Undo the last frame first, if it asked for that.
      if (previous?.disposal === 2) {
        const { left, top, width: w, height: h } = previous.dims;
        context!.clearRect(left, top, w, h);
      } else if (previous?.disposal === 3 && previous.saved) {
        context!.putImageData(previous.saved, 0, 0);
      }

      const saved =
        frame.disposalType === 3
          ? context!.getImageData(0, 0, width, height)
          : null;

      const { left, top, width: w, height: h } = frame.dims;
      if (w > 0 && h > 0) {
        const patch = new OffscreenCanvas(w, h);
        patch
          .getContext("2d")!
          .putImageData(
            new ImageData(new Uint8ClampedArray(frame.patch), w, h),
            0,
            0,
          );
        // drawImage blends, so transparent patch pixels keep what is below.
        context!.drawImage(patch, left, top);
      }

      previous = { disposal: frame.disposalType, dims: frame.dims, saved };
      yield { delayMs: frame.delay > 0 ? frame.delay : 100, number };
    }
  }

  return {
    info: { width, height, frameCount: raw.length },
    canvas,
    frames,
  };
}
