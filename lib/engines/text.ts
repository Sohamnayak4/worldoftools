// Pure text helpers for the text and utility tools. No browser APIs beyond
// what every current browser has, so they run on the page directly.

// ---- Word counter ----

export type TextCounts = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
};

type Segmenter = {
  segment(text: string): Iterable<{ isWordLike?: boolean }>;
};

let wordSegmenter: Segmenter | null | undefined;
function getWordSegmenter(): Segmenter | null {
  if (wordSegmenter !== undefined) return wordSegmenter;
  const Intl2 = Intl as unknown as {
    Segmenter?: new (locale?: string, options?: { granularity: string }) => Segmenter;
  };
  wordSegmenter = Intl2.Segmenter
    ? new Intl2.Segmenter(undefined, { granularity: "word" })
    : null;
  return wordSegmenter;
}

export function countText(text: string): TextCounts {
  // Count by user-visible characters, so an emoji counts as one.
  const characters = [...text].length;
  const charactersNoSpaces = [...text.replace(/\s/g, "")].length;

  let words = 0;
  const segmenter = getWordSegmenter();
  if (segmenter) {
    for (const part of segmenter.segment(text)) if (part.isWordLike) words++;
  } else {
    words = text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  }

  const trimmed = text.trim();
  const sentences =
    trimmed === ""
      ? 0
      : trimmed
          .split(/(?<=[.!?。！？])\s+|\n+/)
          .filter((part) => /[\p{L}\p{N}]/u.test(part)).length;
  const paragraphs =
    trimmed === ""
      ? 0
      : trimmed.split(/\n\s*\n/).filter((part) => part.trim() !== "").length;

  return { words, characters, charactersNoSpaces, sentences, paragraphs };
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 seconds";
  const seconds = Math.max(1, Math.round(minutes * 60));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const whole = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const minuteText = `${whole} minute${whole === 1 ? "" : "s"}`;
  return rest === 0 ? minuteText : `${minuteText} ${rest} second${rest === 1 ? "" : "s"}`;
}

// ---- Case converter ----

export type CaseName =
  | "sentence"
  | "lower"
  | "upper"
  | "title"
  | "camel"
  | "snake"
  | "kebab";

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of",
  "on", "or", "per", "so", "the", "to", "vs", "via", "with", "yet",
]);

// Splits text into words for code-style cases. Also splits camelCase.
function codeWords(text: string): string[] {
  return text
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

export function convertCase(text: string, to: CaseName): string {
  switch (to) {
    case "lower":
      return text.toLowerCase();
    case "upper":
      return text.toUpperCase();
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (_, gap, letter) => gap + letter.toUpperCase());
    case "title": {
      // Works line by line, so line breaks stay.
      return text
        .split("\n")
        .map((line) => {
          const parts = line.split(/(\s+)/);
          const wordIndexes = parts
            .map((part, index) => (part.trim() === "" ? -1 : index))
            .filter((index) => index >= 0);
          const first = wordIndexes[0];
          const last = wordIndexes[wordIndexes.length - 1];
          return parts
            .map((part, index) => {
              if (part.trim() === "") return part;
              const lower = part.toLowerCase();
              const bare = lower.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
              if (index !== first && index !== last && SMALL_WORDS.has(bare)) {
                return lower;
              }
              return lower.replace(/\p{L}/u, (letter) => letter.toUpperCase());
            })
            .join("");
        })
        .join("\n");
    }
    case "camel": {
      const words = codeWords(text);
      return words.map((word, index) => (index === 0 ? word : capitalize(word))).join("");
    }
    case "snake":
      return codeWords(text).join("_");
    case "kebab":
      return codeWords(text).join("-");
  }
}

// ---- JSON ----

export type JsonResult =
  | { ok: true; text: string }
  | { ok: false; message: string; line?: number; column?: number };

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as object)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

// Finds where JSON first goes wrong. Browsers do not always say, so this
// walks the JSON rules itself. Returns -1 when the text is valid.
function findJsonError(text: string): number {
  let i = 0;
  const number = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
  const space = () => {
    while (i < text.length && " \t\n\r".includes(text[i])) i++;
  };
  const fail = (): never => {
    throw i;
  };
  const string = () => {
    i++;
    while (i < text.length) {
      const char = text[i];
      if (char === '"') {
        i++;
        return;
      }
      if (char === "\\") {
        i += 2;
        continue;
      }
      if (char < " ") fail();
      i++;
    }
    fail();
  };
  const value = (): void => {
    space();
    const char = text[i];
    if (char === "{") {
      i++;
      space();
      if (text[i] === "}") {
        i++;
        return;
      }
      for (;;) {
        space();
        if (text[i] !== '"') fail();
        string();
        space();
        if (text[i] !== ":") fail();
        i++;
        value();
        space();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "}") {
          i++;
          return;
        }
        fail();
      }
    }
    if (char === "[") {
      i++;
      space();
      if (text[i] === "]") {
        i++;
        return;
      }
      for (;;) {
        value();
        space();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "]") {
          i++;
          return;
        }
        fail();
      }
    }
    if (char === '"') return string();
    number.lastIndex = i;
    const match = number.exec(text);
    if (match) {
      i += match[0].length;
      return;
    }
    for (const word of ["true", "false", "null"]) {
      if (text.startsWith(word, i)) {
        i += word.length;
        return;
      }
    }
    fail();
  };
  try {
    value();
    space();
    if (i < text.length) fail();
    return -1;
  } catch (position) {
    return typeof position === "number" ? Math.min(position, text.length) : -1;
  }
}

function lineAndColumn(text: string, position: number) {
  const before = text.slice(0, position);
  const line = before.split("\n").length;
  const column = position - before.lastIndexOf("\n");
  return { line, column };
}

export function formatJson(
  text: string,
  indent: "2" | "4" | "tab" | "none",
  sort: boolean,
): JsonResult {
  if (text.trim() === "") {
    return { ok: false, message: "Paste some JSON first." };
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Browsers word this differently. Use whichever place they give.
    const lineMatch = message.match(/line (\d+) column (\d+)/i);
    if (lineMatch) {
      return { ok: false, message, line: Number(lineMatch[1]), column: Number(lineMatch[2]) };
    }
    const positionMatch = message.match(/position (\d+)/i);
    const position = positionMatch ? Number(positionMatch[1]) : findJsonError(text);
    if (position >= 0) {
      return { ok: false, message, ...lineAndColumn(text, position) };
    }
    return { ok: false, message };
  }
  if (sort) value = sortKeys(value);
  const space = indent === "none" ? undefined : indent === "tab" ? "\t" : Number(indent);
  return { ok: true, text: JSON.stringify(value, null, space) };
}

// ---- Base64 ----

export type Base64Result = { ok: true; text: string } | { ok: false; message: string };

export function encodeBase64(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  // Chunks keep very long text from overflowing the call stack.
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  const encoded = btoa(binary);
  return urlSafe
    ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    : encoded;
}

export function decodeBase64(input: string): Base64Result {
  let clean = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (clean === "") return { ok: false, message: "Paste some Base64 first." };
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) {
    return {
      ok: false,
      message: "This is not valid Base64. It can only hold letters, numbers, + and / (or - and _), with up to two = at the end.",
    };
  }
  clean = clean.padEnd(clean.length + ((4 - (clean.length % 4)) % 4), "=");
  let binary: string;
  try {
    binary = atob(clean);
  } catch {
    return { ok: false, message: "This is not valid Base64." };
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return {
      ok: false,
      message: `This decodes to ${bytes.length} bytes of data that is not text, such as an image or a file. This tool only shows text.`,
    };
  }
}

// ---- Numbers ----

// Reads numbers typed with a dot or a comma as the decimal mark.
export function readNumber(text: string): number | null {
  const clean = text.trim().replace(/\s/g, "");
  if (clean === "") return null;
  // "1,5" is one and a half. "1,000.5" uses the comma for thousands.
  const normalized = clean.includes(".")
    ? clean.replace(/,/g, "")
    : clean.replace(",", ".");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(value);
}

// ---- Passwords ----

export const PASSWORD_SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!#$%&*+-=?@^_~()[]{}<>.,:;",
} as const;

export type PasswordSet = keyof typeof PASSWORD_SETS;
const LOOK_ALIKE = /[0O1lI|]/g;

// A whole number from 0 to max - 1, with no bias toward low numbers.
function randomBelow(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % max;
  }
}

export function makePassword(
  length: number,
  sets: PasswordSet[],
  noLookAlikes: boolean,
): { password: string; bits: number } {
  const groups = sets
    .map((set) => (noLookAlikes ? PASSWORD_SETS[set].replace(LOOK_ALIKE, "") : PASSWORD_SETS[set]))
    .filter((group) => group.length > 0);
  const pool = groups.join("");
  // One from each chosen set first, then the rest from the whole pool.
  const chars = groups.map((group) => group[randomBelow(group.length)]);
  while (chars.length < length) chars.push(pool[randomBelow(pool.length)]);
  // Shuffle so the guaranteed characters are not always at the start.
  for (let index = chars.length - 1; index > 0; index--) {
    const other = randomBelow(index + 1);
    [chars[index], chars[other]] = [chars[other], chars[index]];
  }
  return { password: chars.join(""), bits: Math.round(length * Math.log2(pool.length)) };
}
