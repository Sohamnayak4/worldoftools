import { MB } from "./format";

// The tool registry. This file is the single source of truth for every tool
// page. Adding a tool means adding one entry to `tools` below. The dynamic
// route in app/[slug]/page.tsx renders the page from it at build time.

export type Category = "video" | "audio" | "image" | "pdf" | "text" | "utility";

// Engines live in lib/engines/. The video engine also handles audio.
// "none" is for small tools that need no worker, like the word counter.
export type Engine = "video" | "image" | "pdf" | "text" | "none";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
  { id: "image", label: "Image" },
  { id: "pdf", label: "PDF" },
  { id: "text", label: "Text" },
  { id: "utility", label: "Utility" },
];

// What the tool does and with which fixed settings. Variant pages (for
// example 50 KB and 100 KB) differ here, not only in their titles.
export type Preset =
  | {
      kind: "target-size";
      // The size the output must fit under.
      targetBytes: number;
      // True when the visitor can type their own target.
      userCanSetTarget: boolean;
      // Key into lib/limits.ts when the target is a platform limit (step 4).
      limitId?: string;
      outputFormat?: string;
    }
  | { kind: "convert"; outputFormat: string }
  | { kind: "trim" }
  | { kind: "mute" }
  | {
      kind: "resize";
      // Fixed output size for form and passport presets. Empty means free.
      width?: number;
      height?: number;
      unit?: "px" | "mm" | "in";
      targetBytes?: number;
    }
  | { kind: "crop" }
  | { kind: "pdf"; operation: "merge" | "split" | "to-jpg" | "from-images" }
  | { kind: "favicon" }
  | { kind: "strip-metadata" }
  // Input-and-output tools with no file upload. `widget` picks the component.
  | { kind: "utility"; widget: string };

export type Fact = {
  label: string;
  value: string;
  // Official page the value was checked against, for platform limits.
  sourceUrl?: string;
};

export type Faq = { q: string; a: string };

// What files the tool takes. Tools with no upload leave this out.
export type FileInput = {
  // Value for the file picker's `accept` attribute.
  accept: string;
  // A file passes if its type starts with one of these, or its name ends
  // with one of the extensions. Some phones report no type at all.
  mimePrefixes: string[];
  extensions: string[];
  // Used in copy: "Choose video", "That file is not a video".
  noun: string;
  // Examples for the error message: "MP4 or MOV".
  examples: string;
  // Largest file the tool takes. Explained in plain words in the UI.
  maxBytes: number;
  // Lower cap for phones, when the tool needs one.
  maxBytesPhone?: number;
};

export type Tool = {
  slug: string;
  category: Category;
  engine: Engine;
  preset: Preset;
  input?: FileInput;
  // The main button says what happens: "Compress video".
  actionLabel: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  title: string;
  h1: string;
  metaDescription: string;
  // One or two plain sentences. Server-rendered, written to be quoted.
  shortAnswer: string;
  // 3 to 5 short steps.
  howItWorks: string[];
  facts: Fact[];
  faqs: Faq[];
  // Slugs of related tools. Slugs not in the registry yet are skipped.
  relatedSlugs: string[];
};

export const tools: Tool[] = [
  {
    slug: "compress-video-to-size",
    category: "video",
    engine: "video",
    preset: {
      kind: "target-size",
      targetBytes: 10 * MB,
      userCanSetTarget: true,
    },
    input: {
      accept: "video/*",
      mimePrefixes: ["video/"],
      extensions: [".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"],
      noun: "video",
      examples: "MP4 or MOV",
      // The file is read in a stream, so the cap is about time, not memory.
      maxBytes: 2000 * MB,
      maxBytesPhone: 1000 * MB,
    },
    actionLabel: "Compress video",
    primaryKeyword: "compress video to specific size",
    secondaryKeywords: [
      "compress video to 10mb",
      "reduce video file size",
      "video size reducer",
      "make video smaller",
    ],
    title: "Compress video to specific size, free and private",
    h1: "Compress video to specific size",
    metaDescription:
      "Compress a video to a specific size in MB. Pick the target, and the tool fits the file under it in your browser. No upload, no account.",
    shortAnswer:
      "To compress a video to a specific size, pick the file, type the size you need in MB, and press Compress video. The tool sets the bitrate from your target size and the video length, then checks that the result fits.",
    howItWorks: [
      "Pick a video from your phone or computer. It stays on your device.",
      "Type the target size in MB. The default is 10 MB.",
      "The tool divides the target size by the video length to get a bitrate, and leaves a small safety margin.",
      "If that bitrate is too low to look good, it also lowers the resolution to reduce the video file size cleanly.",
      "It checks the result. If the file is over the target, it tries again lower. Then you download it.",
    ],
    facts: [
      { label: "Where it runs", value: "In your browser, on your device" },
      { label: "Upload", value: "None. The video is never sent to a server" },
      { label: "Default target", value: "10 MB. You can type any size" },
      { label: "Account", value: "Not needed" },
      {
        label: "Input formats",
        value:
          "MP4, MOV, WebM and MKV, when your browser can decode the video inside",
      },
      { label: "Output format", value: "MP4 with H.264 video and AAC sound" },
      {
        label: "Max file size",
        value: "2 GB on a computer, 1 GB on a phone",
      },
      {
        label: "Browsers",
        value:
          "Chrome and Edge 94 or later, Safari 16.4 or later, Firefox 130 or later on a computer",
      },
    ],
    faqs: [
      {
        q: "How do I compress a video to a specific size?",
        a: "Pick the video, type the size you need in MB, and press Compress video. The tool works out the bitrate that fits your target and checks the final file size before you download it.",
      },
      {
        q: "Does compressing a video to a smaller size reduce quality?",
        a: "Yes. A smaller file has fewer bits for each second of video, so some detail is lost. Short clips keep more quality than long ones at the same target size. For long videos and small targets the tool lowers the resolution so the picture stays clean.",
      },
      {
        q: "Is my video uploaded to a server?",
        a: "No. The video is read and compressed by your own browser. Nothing is sent anywhere, so it also works for private videos.",
      },
      {
        q: "Why is the result a little smaller than my target?",
        a: "The tool aims slightly under your target on purpose. Video encoders do not hit an exact size, so the margin makes sure the file fits the limit.",
      },
    ],
    relatedSlugs: [
      "compress-video-for-discord",
      "compress-video-for-whatsapp",
      "compress-video-for-email",
      "trim-video",
    ],
  },
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getRelatedTools(tool: Tool): Tool[] {
  return tool.relatedSlugs
    .map((slug) => getTool(slug))
    .filter((related): related is Tool => related !== undefined);
}
