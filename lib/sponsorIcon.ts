// Finds a sponsor's site icon and returns it as a data URL. This runs on the
// server when the sponsor list refreshes, so visitors' browsers never
// contact the sponsor's site or any icon service just to see an ad.

const TIMEOUT_MS = 4000;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_ICON_BYTES = 64 * 1024;
const IMAGE_TYPES = [
  "image/png",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/svg+xml",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

// Only public https hosts. No IP addresses, localhost or internal names.
function isPublicHttps(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    url.protocol === "https:" &&
    host.includes(".") &&
    !host.endsWith(".local") &&
    !host.endsWith(".internal") &&
    !/^[\d.]+$/.test(host) &&
    !host.includes(":") &&
    host !== "localhost"
  );
}

async function fetchCapped(
  url: URL,
  maxBytes: number,
): Promise<{ body: Uint8Array; type: string; finalUrl: URL } | null> {
  if (!isPublicHttps(url)) return null;
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "user-agent": "worldof.tools sponsor icon fetcher" },
    cache: "no-store",
  });
  const finalUrl = new URL(response.url || url);
  if (!response.ok || !response.body || !isPublicHttps(finalUrl)) return null;
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  return { body, type, finalUrl };
}

// Icon links in the page head, best first: apple-touch-icon (usually 180px),
// then the largest declared icon, then any icon.
function iconLinks(html: string, base: URL): URL[] {
  const end = html.search(/<\/head>/i);
  const head = end > 0 ? html.slice(0, end) : html;
  const found: { url: URL; score: number }[] = [];
  for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = /\brel\s*=\s*["']?([^"'>]+)/i.exec(tag)?.[1].toLowerCase() ?? "";
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href || !/\bicon\b/.test(rel)) continue;
    let url: URL;
    try {
      url = new URL(href.replace(/&amp;/g, "&"), base);
    } catch {
      continue;
    }
    const size = Number(/\bsizes\s*=\s*["']?(\d+)/i.exec(tag)?.[1] ?? 0);
    const svg = /\.svg(\?|$)/i.test(url.pathname) || /svg/i.test(tag);
    const score = rel.includes("apple-touch-icon") ? 1000 : svg ? 500 : size || 16;
    found.push({ url, score });
  }
  return found.sort((a, b) => b.score - a.score).map((item) => item.url);
}

function sniffType(body: Uint8Array, declared: string): string | null {
  if (body[0] === 0x89 && body[1] === 0x50) return "image/png";
  if (body[0] === 0xff && body[1] === 0xd8) return "image/jpeg";
  if (body[0] === 0x00 && body[1] === 0x00 && body[2] === 0x01) return "image/x-icon";
  if (body[0] === 0x47 && body[1] === 0x49) return "image/gif";
  if (body[0] === 0x52 && body[1] === 0x49 && body[8] === 0x57) return "image/webp";
  const start = new TextDecoder().decode(body.slice(0, 256)).trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg\b/i.test(start)) return "image/svg+xml";
  return IMAGE_TYPES.includes(declared) && declared !== "image/svg+xml" ? declared : null;
}

// Returns a data URL, or null if the site has no usable icon. Never throws.
export async function fetchSponsorIcon(siteUrl: string): Promise<string | null> {
  try {
    const site = new URL(siteUrl);
    const candidates: URL[] = [];
    const page = await fetchCapped(site, MAX_HTML_BYTES).catch(() => null);
    if (page && page.type.includes("html")) {
      candidates.push(...iconLinks(new TextDecoder().decode(page.body), page.finalUrl));
    }
    candidates.push(new URL("/favicon.ico", page?.finalUrl ?? site));

    for (const candidate of candidates.slice(0, 4)) {
      const icon = await fetchCapped(candidate, MAX_ICON_BYTES).catch(() => null);
      if (!icon || icon.body.byteLength === 0) continue;
      const type = sniffType(icon.body, icon.type);
      if (!type) continue;
      return `data:${type};base64,${Buffer.from(icon.body).toString("base64")}`;
    }
  } catch {
    // Bad URL or network trouble: the ad shows its first letter instead.
  }
  return null;
}
