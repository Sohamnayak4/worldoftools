import { formatBytes } from "../format";
import { isJpeg, jpegOrientation, stripJpeg, stripPng } from "./imageMeta";
import type { EngineJob, EngineMessage, EngineRequest } from "./types";

// The image engine. It decodes with the browser's own image decoder and
// draws on an OffscreenCanvas, all inside this worker.

const post = (message: EngineMessage) => self.postMessage(message);

class Stop extends Error {
  hint: string;
  constructor(message: string, hint: string) {
    super(message);
    this.hint = hint;
  }
}

type Kind = "jpg" | "png" | "webp";
const MIME: Record<Kind, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Phones limit how large a canvas can be. Staying under this is safe on
// iPhone Safari, which has the lowest limit.
const MAX_PIXELS = 16_000_000;

function kindOf(file: File): Kind | null {
  const name = file.name.toLowerCase();
  if (file.type === "image/jpeg" || /\.jpe?g$/.test(name)) return "jpg";
  if (file.type === "image/png" || name.endsWith(".png")) return "png";
  if (file.type === "image/webp" || name.endsWith(".webp")) return "webp";
  return null;
}

function looksHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".heic") || name.endsWith(".heif") || file.type.includes("hei")
  );
}

async function decode(file: File, given?: ImageBitmap): Promise<ImageBitmap> {
  if (given) return given;
  try {
    // Photos from phones are often stored sideways with a note saying how
    // to turn them. "from-image" applies that note.
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    if (looksHeic(file)) {
      // Safari opens HEIC itself and never gets here. Other browsers need
      // a decoder, which is downloaded only now.
      post({ type: "progress", value: 0.1, note: "Loading the HEIC decoder" });
      try {
        const { heicTo } = await import("heic-to/next");
        return await heicTo({ blob: file, type: "bitmap" });
      } catch {
        throw new Stop(
          "This HEIC photo could not be opened.",
          "The file may be damaged, or it may use a feature the decoder does not know. Try exporting it again from your phone.",
        );
      }
    }
    throw new Stop(
      "This image could not be opened.",
      "It may be damaged, or in a format this browser does not know. Try a JPG or PNG.",
    );
  }
}

// Draws the picture at a size, on white when the output has no transparency.
function draw(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  onWhite: boolean,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot draw the image.");
  if (onWhite) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

async function encode(
  canvas: OffscreenCanvas,
  kind: Kind,
  quality?: number,
): Promise<Blob> {
  const blob = await canvas.convertToBlob({ type: MIME[kind], quality });
  if (blob.type !== MIME[kind]) {
    throw new Stop(
      `This browser cannot save ${kind.toUpperCase()} images.`,
      "Use a current version of Chrome, Edge or Firefox for this format.",
    );
  }
  return blob;
}

// Size to draw at, kept under the canvas limit.
function fit(width: number, height: number, scale = 1) {
  const pixels = width * height * scale * scale;
  const cap = pixels > MAX_PIXELS ? Math.sqrt(MAX_PIXELS / pixels) : 1;
  return {
    width: Math.max(1, Math.round(width * scale * cap)),
    height: Math.max(1, Math.round(height * scale * cap)),
    capped: cap < 1,
  };
}

function finish(
  file: File,
  blob: Blob,
  suffix: string,
  kind: Kind,
  details: string[],
) {
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  post({
    type: "done",
    blob,
    fileName: suffix ? `${base}-${suffix}.${kind}` : `${base}.${kind}`,
    details,
  });
}

// ---- Compress to a target size ----

const QUALITY_FLOOR = 0.6;
const QUALITY_TOP = 0.92;

async function runTargetSize(file: File, bitmap: ImageBitmap, targetBytes: number) {
  let scale = 1;
  let best: { blob: Blob; width: number; height: number; quality: number } | null = null;

  for (let round = 1; round <= 10; round++) {
    const size = fit(bitmap.width, bitmap.height, scale);
    const canvas = draw(bitmap, size.width, size.height, true);
    post({
      type: "progress",
      value: Math.min(0.95, round / 6),
      note: `Trying ${size.width} by ${size.height} pixels`,
    });

    // Quality first: the highest quality at this size that fits.
    const floor = await encode(canvas, "jpg", QUALITY_FLOOR);
    if (floor.size <= targetBytes) {
      let low = QUALITY_FLOOR;
      let high = QUALITY_TOP;
      let fitting = floor;
      let fittingQuality = QUALITY_FLOOR;
      const top = await encode(canvas, "jpg", QUALITY_TOP);
      if (top.size <= targetBytes) {
        fitting = top;
        fittingQuality = QUALITY_TOP;
      } else {
        for (let step = 0; step < 6; step++) {
          const middle = (low + high) / 2;
          const attempt = await encode(canvas, "jpg", middle);
          if (attempt.size <= targetBytes) {
            fitting = attempt;
            fittingQuality = middle;
            low = middle;
          } else {
            high = middle;
          }
        }
      }
      best = { blob: fitting, ...size, quality: fittingQuality };
      break;
    }

    // Still too big at the lowest quality we accept. Make the picture
    // smaller. Size falls roughly with the pixel count.
    if (Math.min(size.width, size.height) <= 16) break;
    scale *= Math.max(0.3, Math.min(0.9, Math.sqrt(targetBytes / floor.size) * 0.95));
  }

  if (!best) {
    throw new Stop(
      `This image could not be made smaller than ${formatBytes(targetBytes)}.`,
      "Type a larger target, or crop the image first.",
    );
  }
  const resized = best.width < bitmap.width;
  finish(file, best.blob, "compressed", "jpg", [
    resized
      ? `Resized from ${bitmap.width} by ${bitmap.height} to ${best.width} by ${best.height} pixels.`
      : `Kept at ${best.width} by ${best.height} pixels.`,
    `Saved as JPG at quality ${Math.round(best.quality * 100)}.`,
  ]);
}

// ---- Convert, resize, remove metadata ----

async function runConvert(file: File, bitmap: ImageBitmap, kind: Kind, quality: number) {
  post({ type: "progress", value: 0.3, note: "Converting" });
  const size = fit(bitmap.width, bitmap.height);
  const canvas = draw(bitmap, size.width, size.height, kind === "jpg");
  const blob = await encode(canvas, kind, kind === "png" ? undefined : quality);
  const details = [`${size.width} by ${size.height} pixels.`];
  if (kind === "png") details.push("PNG is lossless, so no detail was removed.");
  else details.push(`Saved at quality ${Math.round(quality * 100)}.`);
  if (kind === "jpg") details.push("Any see-through areas are now white.");
  if (size.capped) details.push("The picture was reduced to fit the size browsers allow.");
  finish(file, blob, "", kind, details);
}

async function runResize(
  file: File,
  bitmap: ImageBitmap,
  width: number,
  height: number,
) {
  if (width * height > MAX_PIXELS) {
    throw new Stop(
      `${width} by ${height} pixels is too large for a browser to draw.`,
      "Type a smaller width or height. The limit is about 16 million pixels.",
    );
  }
  post({ type: "progress", value: 0.3, note: "Resizing" });
  const kind = kindOf(file) ?? "jpg";
  const canvas = draw(bitmap, width, height, kind === "jpg");
  const blob = await encode(canvas, kind, kind === "png" ? undefined : 0.9);
  finish(file, blob, `${width}x${height}`, kind, [
    `Resized from ${bitmap.width} by ${bitmap.height} to ${width} by ${height} pixels.`,
    kind === "png" ? "Saved as PNG." : `Saved as ${kind.toUpperCase()} at quality 90.`,
  ]);
}

const list = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

async function runStripMetadata(file: File) {
  post({ type: "progress", value: 0.2, note: "Reading the file" });
  const bytes = new Uint8Array(await file.arrayBuffer());

  // A sideways JPEG relies on its EXIF note to look upright. Removing the
  // note alone would turn the photo, so that case is redrawn instead.
  const upright = !isJpeg(bytes) || jpegOrientation(bytes) === 1;
  const stripped = upright ? (stripJpeg(bytes) ?? stripPng(bytes)) : null;
  if (stripped) {
    const kind = isJpeg(bytes) ? "jpg" : "png";
    finish(file, new Blob([stripped.bytes], { type: MIME[kind] }), "clean", kind, [
      stripped.removed.length > 0
        ? `Removed ${list(stripped.removed)}.`
        : "No metadata was found in this file.",
      "The picture itself was not re-encoded, so quality is unchanged.",
    ]);
    return;
  }

  post({ type: "progress", value: 0.5, note: "Redrawing the picture" });
  const bitmap = await decode(file);
  const kind = kindOf(file) ?? "jpg";
  const size = fit(bitmap.width, bitmap.height);
  const canvas = draw(bitmap, size.width, size.height, kind === "jpg");
  const blob = await encode(canvas, kind, kind === "png" ? undefined : 0.95);
  bitmap.close();
  finish(file, blob, "clean", kind, [
    "Removed all metadata by redrawing the picture.",
    isJpeg(bytes)
      ? "The photo was stored sideways, so it was turned upright and saved at quality 95."
      : `Saved as ${kind.toUpperCase()}.`,
  ]);
}

// ---- Crop, and photo specs ----

type Area = { x: number; y: number; width: number; height: number };

function drawArea(
  bitmap: ImageBitmap,
  area: Area,
  width: number,
  height: number,
  onWhite: boolean,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot draw the image.");
  if (onWhite) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(
    bitmap,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height,
  );
  return canvas;
}

function clampArea(bitmap: ImageBitmap, area: Area): Area {
  const x = Math.max(0, Math.min(bitmap.width - 1, Math.round(area.x)));
  const y = Math.max(0, Math.min(bitmap.height - 1, Math.round(area.y)));
  return {
    x,
    y,
    width: Math.max(1, Math.min(bitmap.width - x, Math.round(area.width))),
    height: Math.max(1, Math.min(bitmap.height - y, Math.round(area.height))),
  };
}

async function runCrop(file: File, bitmap: ImageBitmap, wanted: Area) {
  post({ type: "progress", value: 0.4, note: "Cropping" });
  const area = clampArea(bitmap, wanted);
  const kind = kindOf(file) ?? "jpg";
  const canvas = drawArea(bitmap, area, area.width, area.height, kind === "jpg");
  const blob = await encode(canvas, kind, kind === "png" ? undefined : 0.92);
  finish(file, blob, "cropped", kind, [
    `Cropped to ${area.width} by ${area.height} pixels. Nothing was scaled.`,
    kind === "png" ? "Saved as PNG." : `Saved as ${kind.toUpperCase()} at quality 92.`,
  ]);
}

// Cuts out an area, resizes it to an exact size, and saves a JPG whose
// file size is inside the allowed range.
async function runSpec(
  file: File,
  bitmap: ImageBitmap,
  wanted: Area,
  output: NonNullable<EngineJob["output"]>,
) {
  post({ type: "progress", value: 0.3, note: "Cropping and resizing" });
  const area = clampArea(bitmap, wanted);
  const canvas = drawArea(bitmap, area, output.width, output.height, true);
  const max = output.maxBytes ?? Infinity;
  const min = output.minBytes ?? 0;

  let quality = 0.92;
  let blob = await encode(canvas, "jpg", quality);
  if (blob.size > max) {
    // Too big: find the highest quality that fits.
    let low = 0.3;
    let high = quality;
    let fitting: Blob | null = null;
    for (let step = 0; step < 7; step++) {
      const middle = (low + high) / 2;
      const attempt = await encode(canvas, "jpg", middle);
      if (attempt.size <= max) {
        fitting = attempt;
        quality = middle;
        low = middle;
      } else {
        high = middle;
      }
    }
    if (!fitting) {
      const lowest = await encode(canvas, "jpg", 0.3);
      if (lowest.size > max) {
        throw new Stop(
          `At ${output.width} by ${output.height} pixels this photo cannot go under ${formatBytes(max)}.`,
          "Type a larger maximum file size, or a smaller width and height.",
        );
      }
      fitting = lowest;
      quality = 0.3;
    }
    blob = fitting;
  } else if (blob.size < min) {
    // Too small: raise the quality as far as it goes.
    quality = 1;
    blob = await encode(canvas, "jpg", quality);
    if (blob.size < min) {
      throw new Stop(
        `This photo comes out at ${formatBytes(blob.size)}, which is under the ${formatBytes(min)} minimum.`,
        "Use a sharper, more detailed photo, or crop a larger area. A blurry or very plain photo makes a small file.",
      );
    }
  }

  const details = [
    `${output.width} by ${output.height} pixels, saved as JPG at quality ${Math.round(quality * 100)}.`,
  ];
  if (area.width < output.width) {
    details.push(
      `The cropped area was only ${area.width} pixels wide, so it was enlarged and may look soft.`,
    );
  }
  if (output.maxBytes !== undefined) {
    details.push(
      min > 0
        ? `File size is inside ${formatBytes(min)} to ${formatBytes(max)}.`
        : `File size is under ${formatBytes(max)}.`,
    );
  }
  finish(file, blob, `${output.width}x${output.height}`, "jpg", details);
}

// ---- Image to PDF ----

const MAX_PDF_IMAGES = 50;
const PDF_LONG_SIDE = 3000;
const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};
const PAGE_MARGIN = 36;

async function runImagesToPdf(files: File[], page: string) {
  if (files.length > MAX_PDF_IMAGES) {
    throw new Stop(
      `You picked ${files.length} images. One PDF can hold up to ${MAX_PDF_IMAGES} here.`,
      "Remove some images, or make two PDFs.",
    );
  }
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const pdf = await PDFDocument.create();

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    post({
      type: "progress",
      value: index / files.length,
      note: `Adding image ${index + 1} of ${files.length}`,
    });
    let bitmap: ImageBitmap;
    try {
      bitmap = await decode(file);
    } catch (error) {
      if (error instanceof Stop) {
        throw new Stop(`${file.name}: ${error.message}`, error.hint);
      }
      throw error;
    }
    const long = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, PDF_LONG_SIDE / long);
    const size = fit(bitmap.width, bitmap.height, scale);
    const canvas = draw(bitmap, size.width, size.height, true);
    bitmap.close();
    const jpg = await encode(canvas, "jpg", 0.9);
    const embedded = await pdf.embedJpg(new Uint8Array(await jpg.arrayBuffer()));

    if (page === "a4" || page === "letter") {
      const [short, tall] = PAGE_SIZES[page];
      // Wide pictures get a sideways page.
      const wide = size.width > size.height;
      const pageWidth = wide ? tall : short;
      const pageHeight = wide ? short : tall;
      const room = Math.min(
        (pageWidth - PAGE_MARGIN * 2) / size.width,
        (pageHeight - PAGE_MARGIN * 2) / size.height,
      );
      const width = size.width * room;
      const height = size.height * room;
      pdf.addPage([pageWidth, pageHeight]).drawImage(embedded, {
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width,
        height,
      });
    } else {
      // The page is as wide as an A4 sheet and as tall as the image needs.
      const width = PAGE_SIZES.a4[0];
      const height = (size.height * width) / size.width;
      pdf.addPage([width, height]).drawImage(embedded, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }
  }

  post({ type: "progress", value: 0.98, note: "Writing the PDF" });
  const bytes = await pdf.save();
  const base =
    files.length === 1
      ? files[0].name.replace(/\.[^.]+$/, "") || "images"
      : "images";
  post({
    type: "done",
    blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    fileName: `${base}.pdf`,
    details: [
      files.length === 1 ? "1 page." : `${files.length} pages, one image each.`,
      page === "a4"
        ? "A4 pages."
        : page === "letter"
          ? "US Letter pages."
          : "Each page has the shape of its image.",
    ],
  });
}

// ---- Favicon ----

async function squarePng(
  bitmap: ImageBitmap,
  size: number,
  onWhite: boolean,
): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot draw the image.");
  if (onWhite) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
  }
  context.imageSmoothingQuality = "high";
  // Fit the whole picture inside the square, centered, never stretched.
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await blob.arrayBuffer());
}

const FAVICON_HTML = `Put the files from this ZIP in the top folder of your website.
Then paste these lines inside the <head> of your pages:

<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

favicon.ico holds 16, 32 and 48 pixel icons for browser tabs.
apple-touch-icon.png is used when someone adds the site to an iPhone home screen.
icon-192.png and icon-512.png are listed in site.webmanifest for Android.
Open site.webmanifest and change "name" and "short_name" to your site's name.
`;

const FAVICON_MANIFEST = `{
  "name": "My site",
  "short_name": "My site",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
`;

async function runFavicon(file: File, bitmap: ImageBitmap) {
  post({ type: "progress", value: 0.3, note: "Drawing the icons" });
  const { icoFromPngs, zipStore } = await import("./pack");
  const encoder = new TextEncoder();
  const ico = icoFromPngs([
    { size: 16, png: await squarePng(bitmap, 16, false) },
    { size: 32, png: await squarePng(bitmap, 32, false) },
    { size: 48, png: await squarePng(bitmap, 48, false) },
  ]);
  post({ type: "progress", value: 0.7, note: "Packing the ZIP" });
  const zip = zipStore([
    { name: "favicon.ico", data: ico },
    // iPhones show black where an icon is see-through, so this one is on white.
    { name: "apple-touch-icon.png", data: await squarePng(bitmap, 180, true) },
    { name: "icon-192.png", data: await squarePng(bitmap, 192, false) },
    { name: "icon-512.png", data: await squarePng(bitmap, 512, false) },
    { name: "site.webmanifest", data: encoder.encode(FAVICON_MANIFEST) },
    { name: "how-to-use.txt", data: encoder.encode(FAVICON_HTML) },
  ]);
  const details = [
    "The ZIP holds favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest and how-to-use.txt.",
  ];
  if (bitmap.width !== bitmap.height) {
    details.push("The picture is not square, so it was centered with space around it.");
  }
  if (Math.min(bitmap.width, bitmap.height) < 512) {
    details.push("The picture is under 512 pixels, so the largest icon may look soft.");
  }
  post({
    type: "done",
    blob: new Blob([zip], { type: "application/zip" }),
    fileName: "favicon.zip",
    details,
  });
}

// ---- Dispatch ----

async function run(
  file: File,
  files: File[],
  job: EngineJob,
  given?: ImageBitmap,
) {
  const { preset, settings } = job;
  if (typeof OffscreenCanvas === "undefined") {
    throw new Stop(
      "This browser cannot work with images here.",
      "Update your browser. Safari needs version 16.4 or later.",
    );
  }
  if (preset.kind === "strip-metadata") return runStripMetadata(file);
  if (preset.kind === "pdf" && preset.operation === "from-images") {
    return runImagesToPdf(files, settings.page ?? "fit");
  }

  post({ type: "progress", value: 0.05, note: "Opening the image" });
  const bitmap = await decode(file, given);
  try {
    if (preset.kind === "target-size") {
      return await runTargetSize(file, bitmap, job.targetBytes ?? preset.targetBytes);
    }
    if (preset.kind === "crop") {
      if (!job.crop) throw new Error("No crop area was given.");
      return job.output
        ? await runSpec(file, bitmap, job.crop, job.output)
        : await runCrop(file, bitmap, job.crop);
    }
    if (preset.kind === "favicon") return await runFavicon(file, bitmap);
    if (preset.kind === "resize") {
      if (!job.size) throw new Error("No width and height were given.");
      return await runResize(file, bitmap, job.size.width, job.size.height);
    }
    if (preset.kind === "convert") {
      const kind = preset.outputFormat;
      if (kind !== "jpg" && kind !== "png" && kind !== "webp") {
        throw new Error(`The image engine cannot make ${kind} files.`);
      }
      return await runConvert(file, bitmap, kind, Number(settings.quality ?? 90) / 100);
    }
    throw new Error(`The image engine has no job called ${preset.kind}.`);
  } finally {
    bitmap.close();
  }
}

self.onmessage = (event: MessageEvent<EngineRequest>) => {
  const { file, files, job, bitmap } = event.data;
  run(file, files ?? [file], job, bitmap).catch((error: unknown) => {
    if (error instanceof Stop) {
      post({ type: "error", message: error.message, hint: error.hint });
      return;
    }
    const detail = error instanceof Error ? error.message : String(error);
    post({
      type: "error",
      message: "The image could not be processed.",
      hint: `Try again, or try a different browser. Technical detail: ${detail}`,
    });
  });
};

export {};
