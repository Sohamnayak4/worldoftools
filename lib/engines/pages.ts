// Reads page lists like "1-3, 5, 8-10" for the PDF tools.

export type PageList =
  | { ok: true; pages: number[] }
  | { ok: false; message: string };

// `count` is the number of pages in the PDF. Pages are numbered from 1.
// The result keeps the typed order and allows the same page twice.
export function parsePageList(text: string, count: number): PageList {
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  if (parts.length === 0) {
    return { ok: false, message: "Type at least one page, like 1-3, 5." };
  }

  const pages: number[] = [];
  for (const part of parts) {
    // People type all kinds of dashes. Accept them all.
    const match = part.match(/^(\d+)\s*(?:[-‐-―]\s*(\d+))?$/);
    if (!match) {
      return {
        ok: false,
        message: `"${part}" is not a page or a run of pages. Type pages like 1-3, 5.`,
      };
    }
    const first = Number(match[1]);
    const last = match[2] === undefined ? first : Number(match[2]);
    if (first < 1 || last < 1) {
      return { ok: false, message: "Pages start at 1." };
    }
    if (last < first) {
      return {
        ok: false,
        message: `In ${first}-${last} the first page must come first. Type ${last}-${first}.`,
      };
    }
    if (last > count) {
      return {
        ok: false,
        message: `Page ${last} is past the end. This PDF has ${count} ${count === 1 ? "page" : "pages"}.`,
      };
    }
    for (let page = first; page <= last; page++) pages.push(page);
  }
  return { ok: true, pages };
}

export const pageFileName = (page: number, extension: string) =>
  `page-${String(page).padStart(3, "0")}.${extension}`;
