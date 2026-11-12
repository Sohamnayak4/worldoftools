// Reading and removing metadata in JPEG and PNG files, byte by byte.
// No picture data is decoded or re-encoded here, so removal is lossless.

export type StripResult = {
  bytes: Uint8Array<ArrayBuffer>;
  // Plain names of what was taken out, for the result line.
  removed: string[];
};

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

export function isPng(bytes: Uint8Array): boolean {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 3) === "PNG"
  );
}

// Walks the JPEG header segments up to the picture data.
function* jpegSegments(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return;
    const marker = bytes[offset + 1];
    // Start of scan: the compressed picture follows, to the end.
    if (marker === 0xda) {
      yield { marker, start: offset, end: bytes.length };
      return;
    }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    const end = offset + 2 + length;
    if (length < 2 || end > bytes.length) return;
    yield { marker, start: offset, end };
    offset = end;
  }
}

// The EXIF orientation of a JPEG, 1 to 8. 1 means upright.
export function jpegOrientation(bytes: Uint8Array): number {
  for (const segment of jpegSegments(bytes)) {
    if (segment.marker !== 0xe1) continue;
    const data = segment.start + 4;
    if (ascii(bytes, data, 4) !== "Exif") continue;
    const tiff = data + 6;
    const little = ascii(bytes, tiff, 2) === "II";
    const u16 = (at: number) =>
      little ? bytes[at] | (bytes[at + 1] << 8) : (bytes[at] << 8) | bytes[at + 1];
    const u32 = (at: number) =>
      little
        ? (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0
        : ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
    const directory = tiff + u32(tiff + 4);
    if (directory + 2 > segment.end) return 1;
    const count = u16(directory);
    for (let i = 0; i < count; i++) {
      const entry = directory + 2 + i * 12;
      if (entry + 12 > segment.end) return 1;
      if (u16(entry) === 0x0112) {
        const value = u16(entry + 8);
        return value >= 1 && value <= 8 ? value : 1;
      }
    }
    return 1;
  }
  return 1;
}

// Removes EXIF, XMP, IPTC and comments from a JPEG. Keeps the color
// profile and the segments the decoder needs.
export function stripJpeg(bytes: Uint8Array): StripResult | null {
  if (!isJpeg(bytes)) return null;
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  const removed = new Set<string>();
  let sawScan = false;

  for (const segment of jpegSegments(bytes)) {
    const { marker, start, end } = segment;
    const data = start + 4;
    let drop = false;
    if (marker === 0xe1) {
      drop = true;
      removed.add(ascii(bytes, data, 4) === "Exif" ? "EXIF data" : "XMP data");
    } else if (marker === 0xed) {
      drop = true;
      removed.add("IPTC data");
    } else if (marker === 0xfe) {
      drop = true;
      removed.add("comments");
    } else if (marker === 0xe2) {
      // Keep the color profile. Drop other APP2 data such as extra images.
      drop = ascii(bytes, data, 11) !== "ICC_PROFILE";
      if (drop) removed.add("extra embedded data");
    } else if (marker >= 0xe3 && marker <= 0xef && marker !== 0xee) {
      // APP14 (0xee) tells the decoder how colors are stored. Keep it.
      drop = true;
      removed.add("app-specific data");
    }
    if (!drop) parts.push(bytes.subarray(start, end));
    if (marker === 0xda) sawScan = true;
  }
  if (!sawScan) return null;

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return { bytes: out, removed: [...removed] };
}

const PNG_TEXT_CHUNKS = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

// Removes text, EXIF and time chunks from a PNG.
export function stripPng(bytes: Uint8Array): StripResult | null {
  if (!isPng(bytes)) return null;
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  const removed = new Set<string>();
  let offset = 8;
  let sawEnd = false;
  while (offset + 12 <= bytes.length) {
    const length =
      ((bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3]) >>>
      0;
    const type = ascii(bytes, offset + 4, 4);
    const end = offset + 12 + length;
    if (end > bytes.length) return null;
    if (PNG_TEXT_CHUNKS.has(type)) {
      removed.add(
        type === "eXIf" ? "EXIF data" : type === "tIME" ? "the saved time" : "text notes",
      );
    } else {
      parts.push(bytes.subarray(offset, end));
    }
    offset = end;
    if (type === "IEND") {
      sawEnd = true;
      break;
    }
  }
  if (!sawEnd) return null;
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return { bytes: out, removed: [...removed] };
}
