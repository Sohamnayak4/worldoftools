// Sizes use decimal units: 1 KB = 1,000 bytes and 1 MB = 1,000,000 bytes.
// This is the smaller reading of "MB", so a file that fits our number also
// fits a platform that counts in 1,024s.
export const KB = 1_000;
export const MB = 1_000_000;
export const GB = 1_000_000_000;

export function formatBytes(bytes: number): string {
  if (bytes >= GB) return `${trim(bytes / GB)} GB`;
  if (bytes >= MB) return `${trim(bytes / MB)} MB`;
  if (bytes >= KB) return `${trim(bytes / KB)} KB`;
  return `${bytes} bytes`;
}

function trim(n: number): string {
  return n >= 100 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, "");
}
