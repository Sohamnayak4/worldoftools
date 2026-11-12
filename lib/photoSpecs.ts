import { KB, MB } from "./format";

// Official photo and signature requirements. Every value was read on the
// organisation's own page on the date in `checked`. Never add or edit a
// spec from memory: open the source page, confirm it, and update `checked`.

export type PhotoSpec = {
  // Shown in the dropdown.
  label: string;
  group: "passport" | "form";
  // What the official page asks for, in plain words.
  requirement: string;
  // The size this tool makes. Always inside the official range.
  outWidth: number;
  outHeight: number;
  minBytes: number;
  maxBytes: number;
  sourceUrl: string;
  // Date the source page was last read, as YYYY-MM-DD.
  checked: string;
  note?: string;
};

export const photoSpecs = {
  ukPassport: {
    label: "UK passport, online application",
    group: "passport",
    requirement:
      "At least 600 pixels wide and 750 pixels tall. At least 50KB and no more than 10MB",
    outWidth: 1200,
    outHeight: 1500,
    minBytes: 50 * KB,
    maxBytes: 10 * MB,
    sourceUrl: "https://www.gov.uk/photos-for-passports",
    checked: "2026-11-12",
    note: "The photo must be in colour and unaltered by computer software, so only crop and resize it.",
  },
  canadaPassport: {
    label: "Canada passport, online renewal",
    group: "passport",
    requirement:
      "From 1,200 by 1,800 pixels up to 3,000 by 4,500 pixels, in a 3:2 portrait shape. Between 200 KB and 5 MB. JPG only",
    outWidth: 1200,
    outHeight: 1800,
    minBytes: 200 * KB,
    maxBytes: 5 * MB,
    sourceUrl:
      "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html",
    checked: "2026-11-12",
    note: "A digital photo is only needed when renewing online.",
  },
  upscPhoto: {
    label: "UPSC online application, photograph",
    group: "form",
    requirement:
      "From 350 by 350 pixels up to 1000 by 1000 pixels. Between 20 KB and 300 KB. JPG only",
    outWidth: 600,
    outHeight: 600,
    minBytes: 20 * KB,
    maxBytes: 300 * KB,
    sourceUrl: "https://upsconline.gov.in/upsc/OTRP/candidate/faq.php",
    checked: "2026-11-12",
  },
  upscSignature: {
    label: "UPSC online application, signature",
    group: "form",
    requirement:
      "From 350 by 350 pixels up to 1000 by 1000 pixels. Between 20 KB and 300 KB. JPG only",
    outWidth: 600,
    outHeight: 600,
    minBytes: 20 * KB,
    maxBytes: 300 * KB,
    sourceUrl: "https://upsconline.gov.in/upsc/OTRP/candidate/faq.php",
    checked: "2026-11-12",
    note: "Sign on white paper before scanning or photographing it.",
  },
} satisfies Record<string, PhotoSpec>;

export type PhotoSpecId = keyof typeof photoSpecs;

export const specsFor = (group: PhotoSpec["group"]) =>
  (Object.keys(photoSpecs) as PhotoSpecId[])
    .filter((id) => photoSpecs[id].group === group)
    .map((id) => ({ id, ...photoSpecs[id] }));
