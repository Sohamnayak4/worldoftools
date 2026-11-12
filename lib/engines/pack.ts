// Small file-format writers: a ZIP archive without compression, and an ICO
// icon file. Written by hand so no library is needed for them.

type Bytes = Uint8Array<ArrayBuffer>;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function join(parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

// Builds a little-endian record from [value, byteCount] pairs.
function record(fields: [number, 1 | 2 | 4][]): Bytes {
  const out = new Uint8Array(fields.reduce((sum, [, size]) => sum + size, 0));
  const view = new DataView(out.buffer);
  let offset = 0;
  for (const [value, size] of fields) {
    if (size === 1) view.setUint8(offset, value);
    else if (size === 2) view.setUint16(offset, value, true);
    else view.setUint32(offset, value, true);
    offset += size;
  }
  return out;
}

export type PackedFile = { name: string; data: Uint8Array };

// A ZIP archive with the files stored as they are. PNG and ICO data is
// already compressed, so storing loses nothing.
export function zipStore(files: PackedFile[]): Bytes {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  // A fixed date keeps the output the same for the same input.
  const dosTime = 0;
  const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;
    const local = record([
      [0x04034b50, 4],
      [20, 2],
      [0x0800, 2],
      [0, 2],
      [dosTime, 2],
      [dosDate, 2],
      [crc, 4],
      [size, 4],
      [size, 4],
      [name.length, 2],
      [0, 2],
    ]);
    locals.push(local, name, file.data);
    centrals.push(
      record([
        [0x02014b50, 4],
        [20, 2],
        [20, 2],
        [0x0800, 2],
        [0, 2],
        [dosTime, 2],
        [dosDate, 2],
        [crc, 4],
        [size, 4],
        [size, 4],
        [name.length, 2],
        [0, 2],
        [0, 2],
        [0, 2],
        [0, 2],
        [0, 4],
        [offset, 4],
      ]),
      name,
    );
    offset += local.length + name.length + size;
  }

  const central = join(centrals);
  const end = record([
    [0x06054b50, 4],
    [0, 2],
    [0, 2],
    [files.length, 2],
    [files.length, 2],
    [central.length, 4],
    [offset, 4],
    [0, 2],
  ]);
  return join([...locals, central, end]);
}

// An ICO file that holds PNG pictures, one per size.
export function icoFromPngs(icons: { size: number; png: Uint8Array }[]): Bytes {
  const header = record([
    [0, 2],
    [1, 2],
    [icons.length, 2],
  ]);
  const entries: Uint8Array[] = [];
  let offset = header.length + icons.length * 16;
  for (const icon of icons) {
    entries.push(
      record([
        [icon.size >= 256 ? 0 : icon.size, 1],
        [icon.size >= 256 ? 0 : icon.size, 1],
        [0, 1],
        [0, 1],
        [1, 2],
        [32, 2],
        [icon.png.length, 4],
        [offset, 4],
      ]),
    );
    offset += icon.png.length;
  }
  return join([header, ...entries, ...icons.map((icon) => icon.png)]);
}
