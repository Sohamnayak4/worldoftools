import { KB, MB } from "./format";
import { type LimitId, limits } from "./limits";
import { type PhotoSpecId, photoSpecs } from "./photoSpecs";

// The tool registry. This file is the single source of truth for every tool
// page. Adding a tool means adding one entry to `tools` below. The dynamic
// route in app/[slug]/page.tsx renders the page from it at build time.

export type Category = "video" | "audio" | "image" | "pdf" | "text" | "utility";

// Engines live in lib/engines/. The video engine also handles audio.
// "none" is for small tools that need no worker, like the word counter.
export type Engine = "video" | "image" | "pdf" | "text" | "none";

export type CategoryInfo = {
  id: Category;
  // Short name for navigation.
  label: string;
  h1: string;
  title: string;
  metaDescription: string;
  // Two or three plain sentences shown above the tool list.
  intro: string;
};

// Each category has its own page at /<id>, built from this list.
export const CATEGORIES: CategoryInfo[] = [
  {
    id: "video",
    label: "Video",
    h1: "Video tools",
    title: "Video tools: compress, trim and convert in your browser",
    metaDescription:
      "Compress video to a size, trim it, convert MOV or WebM to MP4, remove the sound or make a GIF. Your browser does the work, so the video is not uploaded.",
    intro:
      "Compress, trim and convert videos on your own device. Your browser's built-in video encoder does the work, so the video is never uploaded. The presets for Discord, WhatsApp, email, Instagram, Telegram and Slack use each platform's published limit.",
  },
  {
    id: "audio",
    label: "Audio",
    h1: "Audio tools",
    title: "Audio tools: convert to MP3, compress and trim",
    metaDescription:
      "Convert WAV or M4A to MP3, make MP3 files smaller and trim audio in your browser. The sound file stays on your device.",
    intro:
      "Convert to MP3, make MP3 files smaller and cut audio to length. MP3, WAV and M4A files are trimmed without re-encoding, and MP3 files are made by the LAME encoder running in your browser.",
  },
  {
    id: "image",
    label: "Image",
    h1: "Image tools",
    title: "Image tools: compress, resize, crop and convert",
    metaDescription:
      "Compress images to 20, 50, 100 or 200 KB, resize, crop, and convert between JPG, PNG, WebP and HEIC. Photos are processed in your browser.",
    intro:
      "Compress images to a set size, resize and crop them, and convert between JPG, PNG, WebP, SVG and HEIC. There are also tools for passport and form photos, favicons, and removing the location and camera details from a photo.",
  },
  {
    id: "pdf",
    label: "PDF",
    h1: "PDF tools",
    title: "PDF tools: merge, split and convert to JPG",
    metaDescription:
      "Merge PDFs, split them into pages and turn pages into JPG pictures in your browser. Merging and splitting keep text selectable.",
    intro:
      "Join PDFs, split them into pages, and turn pages into JPG pictures. Merging and splitting copy pages as they are, so text stays selectable and nothing is redrawn.",
  },
  {
    id: "text",
    label: "Text",
    h1: "Text tools",
    title: "Text tools: word counter and case converter",
    metaDescription:
      "Count words, characters and reading time, or change text to sentence case, title case, camelCase and more. Nothing you type is sent anywhere.",
    intro:
      "Count words and characters, and change the case of text. What you type stays in your browser and is gone when you close the page.",
  },
  {
    id: "utility",
    label: "Utility",
    h1: "Utility tools",
    title: "Utility tools: QR codes, passwords, JSON and more",
    metaDescription:
      "Make QR codes and passwords, format JSON, encode Base64 and work out percentages. Each tool runs in your browser as you type.",
    intro:
      "Make QR codes and passwords, format JSON, encode and decode Base64, and work out percentages. These tools need no file and give answers as you type.",
  },
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
      // Key into lib/limits.ts when the target comes from a platform limit.
      limitId?: LimitId;
      outputFormat?: string;
    }
  // `from` is set when the source is not ordinary video or audio.
  | {
      kind: "convert";
      outputFormat: "mp4" | "mp3" | "gif" | "jpg" | "png" | "webp";
      from?: "gif";
    }
  // `media` says what is being cut. Video is the default.
  | { kind: "trim"; media?: "audio" }
  | { kind: "compress-gif" }
  | { kind: "mute" }
  | {
      kind: "resize";
      // Fixed output size for form and passport presets. Empty means free.
      width?: number;
      height?: number;
      unit?: "px" | "mm" | "in";
      targetBytes?: number;
    }
  // `specs` is set when the output must match an official photo spec.
  | { kind: "crop"; specs?: "passport" | "form" }
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
  // The word that goes before the noun: "a video", "an MP3".
  article: "a" | "an";
  // Examples for the error message: "MP4 or MOV".
  examples: string;
  // Largest file the tool takes. Explained in plain words in the UI.
  maxBytes: number;
  // Lower cap for phones, when the tool needs one.
  maxBytesPhone?: number;
  // Set for formats a worker cannot open, such as SVG. The page decodes
  // SVG files and hands the picture to the engine.
  decodeOnPage?: boolean;
  // Width to draw an SVG at when the tool has no width option.
  decodeWidth?: number;
  // True when the tool takes several files at once, in order.
  multiple?: boolean;
  // Fewest files the tool needs, when it takes several.
  minFiles?: number;
  // A clearer message for one specific wrong file type that people often
  // pick by mistake. Checked before the general wrong-type message.
  commonMistake?: { mimePrefix: string; message: string; hint: string };
};

// A choice the visitor makes before starting. A dropdown by default, or a
// text field with `type: "text"`.
export type ToolOption = {
  id: string;
  label: string;
  type?: "select" | "text";
  // For dropdowns.
  choices?: { value: string; label: string }[];
  defaultValue: string;
  // For text fields.
  placeholder?: string;
  hint?: string;
  // Only shown while another option has this value.
  showWhen?: { id: string; value: string };
};

export type Tool = {
  slug: string;
  category: Category;
  engine: Engine;
  preset: Preset;
  input?: FileInput;
  // Dropdowns shown after a file is picked. Values go to the engine.
  options?: ToolOption[];
  // Set when the visitor picks a start and end time with a preview player.
  range?: { media: "video" | "audio" };
  // Set when the visitor types an output width and height.
  sizePicker?: boolean;
  // Set when the visitor drags a crop box over a preview.
  cropPicker?: boolean;
  // The main button says what happens: "Compress video".
  actionLabel: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  title: string;
  h1: string;
  // One short line shown under the tool's name in lists. Adds a detail the
  // name does not say. 56 characters or fewer.
  blurb: string;
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

// A facts row for a platform limit, with its official source link.
function limitFact(id: LimitId): Fact {
  const limit = limits[id];
  const note = "note" in limit ? ` ${limit.note}` : "";
  return {
    label: `${limit.platform}: ${limit.appliesTo.charAt(0).toLowerCase()}${limit.appliesTo.slice(1)}`,
    value: `${limit.display}.${note} Checked ${limit.checked}`,
    sourceUrl: limit.sourceUrl,
  };
}

// A facts row for an official photo spec, with its source link.
function specFact(id: PhotoSpecId): Fact {
  const spec = photoSpecs[id];
  const note = "note" in spec ? ` ${spec.note}` : "";
  return {
    label: spec.label,
    value: `${spec.requirement}. This tool makes ${spec.outWidth} by ${spec.outHeight} pixels.${note} Checked ${spec.checked}`,
    sourceUrl: spec.sourceUrl,
  };
}

// Shared by every tool that takes any video file.
const VIDEO_INPUT: FileInput = {
  accept: "video/*",
  mimePrefixes: ["video/"],
  extensions: [".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"],
  noun: "video",
  article: "a",
  examples: "MP4 or MOV",
  // The file is read in a stream, so the cap is about time, not memory.
  maxBytes: 2000 * MB,
  maxBytesPhone: 1000 * MB,
};

const AUDIO_CAPS = { maxBytes: 2000 * MB, maxBytesPhone: 1000 * MB };

// Any sound file.
const AUDIO_INPUT: FileInput = {
  accept: "audio/*",
  mimePrefixes: ["audio/"],
  extensions: [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"],
  noun: "audio file",
  article: "an",
  examples: "MP3, WAV or M4A",
  ...AUDIO_CAPS,
};

const MP3_INPUT: FileInput = {
  accept: "audio/mpeg,.mp3",
  mimePrefixes: ["audio/mpeg", "audio/mp3"],
  extensions: [".mp3"],
  noun: "MP3",
  article: "an",
  examples: "a .mp3 song or recording",
  ...AUDIO_CAPS,
};

const WAV_INPUT: FileInput = {
  accept: "audio/wav,audio/x-wav,.wav",
  mimePrefixes: ["audio/wav", "audio/x-wav", "audio/wave"],
  extensions: [".wav"],
  noun: "WAV file",
  article: "a",
  examples: "a .wav recording",
  ...AUDIO_CAPS,
};

const M4A_INPUT: FileInput = {
  accept: "audio/mp4,audio/x-m4a,.m4a",
  mimePrefixes: ["audio/mp4", "audio/x-m4a", "audio/m4a"],
  extensions: [".m4a"],
  noun: "M4A file",
  article: "an",
  examples: "a .m4a voice memo",
  ...AUDIO_CAPS,
};

// GIFs are decoded frame by frame in memory, so the cap is much lower.
const GIF_INPUT: FileInput = {
  accept: "image/gif,.gif",
  mimePrefixes: ["image/gif"],
  extensions: [".gif"],
  noun: "GIF",
  article: "a",
  examples: "an animated .gif",
  maxBytes: 100 * MB,
  maxBytesPhone: 50 * MB,
};

function mp3Quality(defaultValue: string): ToolOption {
  return {
    id: "bitrate",
    label: "MP3 quality",
    choices: [
      { value: "320", label: "320 kbps, best" },
      { value: "192", label: "192 kbps, high" },
      { value: "128", label: "128 kbps, standard" },
      { value: "96", label: "96 kbps, small" },
      { value: "64", label: "64 kbps, smallest" },
    ],
    defaultValue,
  };
}

const GIF_WIDTH: ToolOption = {
  id: "width",
  label: "GIF width",
  choices: [
    { value: "320", label: "320 pixels, small" },
    { value: "480", label: "480 pixels, medium" },
    { value: "640", label: "640 pixels, large" },
  ],
  defaultValue: "480",
};

// GIF timing works in hundredths of a second, so only these rates are exact.
const GIF_FPS: ToolOption = {
  id: "fps",
  label: "Frames per second",
  choices: [
    { value: "10", label: "10, smaller file" },
    { value: "12.5", label: "12.5, balanced" },
    { value: "20", label: "20, smoother" },
    { value: "25", label: "25, smoothest" },
  ],
  defaultValue: "12.5",
};

const GIF_LEVEL: ToolOption = {
  id: "level",
  label: "Compression",
  choices: [
    { value: "light", label: "Light: same size, fewer colors" },
    { value: "medium", label: "Medium: three quarters the width" },
    { value: "strong", label: "Strong: half the width, half the frames" },
  ],
  defaultValue: "medium",
};

// Pictures are unpacked fully in memory, so the cap is lower than video.
const IMAGE_CAPS = { maxBytes: 50 * MB, maxBytesPhone: 30 * MB };

// Any picture a browser can open.
const IMAGE_INPUT: FileInput = {
  accept: "image/*",
  mimePrefixes: ["image/"],
  extensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".avif",
    ".heic",
    ".heif",
  ],
  noun: "image",
  article: "an",
  examples: "a JPG or PNG photo",
  ...IMAGE_CAPS,
};

const PNG_INPUT: FileInput = {
  accept: "image/png,.png",
  mimePrefixes: ["image/png"],
  extensions: [".png"],
  noun: "PNG image",
  article: "a",
  examples: "a .png screenshot",
  ...IMAGE_CAPS,
};

const JPG_INPUT: FileInput = {
  accept: "image/jpeg,.jpg,.jpeg",
  mimePrefixes: ["image/jpeg"],
  extensions: [".jpg", ".jpeg"],
  noun: "JPG image",
  article: "a",
  examples: "a .jpg photo",
  ...IMAGE_CAPS,
};

const WEBP_INPUT: FileInput = {
  accept: "image/webp,.webp",
  mimePrefixes: ["image/webp"],
  extensions: [".webp"],
  noun: "WebP image",
  article: "a",
  examples: "a .webp saved from a website",
  ...IMAGE_CAPS,
};

// A worker cannot open SVG, so the page decodes it first.
const SVG_INPUT: FileInput = {
  accept: "image/svg+xml,.svg",
  mimePrefixes: ["image/svg"],
  extensions: [".svg"],
  noun: "SVG file",
  article: "an",
  examples: "a .svg logo or icon",
  maxBytes: 20 * MB,
  decodeOnPage: true,
};

const HEIC_INPUT: FileInput = {
  accept: "image/heic,image/heif,.heic,.heif",
  mimePrefixes: ["image/heic", "image/heif"],
  extensions: [".heic", ".heif"],
  noun: "HEIC photo",
  article: "a",
  examples: "a .heic photo from an iPhone",
  commonMistake: {
    mimePrefix: "image/jpeg",
    message: "That photo is already a JPG, so there is nothing to convert.",
    hint: "An iPhone usually hands websites a JPG copy when you pick from the photo library. To convert an original HEIC file, pick it from the Files app, or open this page on a computer.",
  },
  ...IMAGE_CAPS,
};

// Several pictures at once, in the order they should appear.
const IMAGES_INPUT: FileInput = {
  ...IMAGE_INPUT,
  multiple: true,
};

// A logo or picture to turn into site icons. SVG is drawn on the page.
const FAVICON_INPUT: FileInput = {
  ...IMAGE_INPUT,
  accept: "image/*,.svg",
  extensions: [...IMAGE_INPUT.extensions, ".svg"],
  examples: "a square PNG or SVG logo",
  decodeOnPage: true,
  decodeWidth: 512,
};

const PDF_PAGE: ToolOption = {
  id: "page",
  label: "Page size",
  choices: [
    { value: "fit", label: "Same shape as each image" },
    { value: "a4", label: "A4" },
    { value: "letter", label: "US Letter" },
  ],
  defaultValue: "fit",
};

const IMAGE_QUALITY: ToolOption = {
  id: "quality",
  label: "Quality",
  choices: [
    { value: "92", label: "High, larger file" },
    { value: "80", label: "Balanced" },
    { value: "60", label: "Lower, smaller file" },
  ],
  defaultValue: "92",
};

const SVG_WIDTH: ToolOption = {
  id: "width",
  label: "PNG width",
  choices: [
    { value: "0", label: "The size set in the SVG" },
    { value: "512", label: "512 pixels" },
    { value: "1024", label: "1024 pixels" },
    { value: "2048", label: "2048 pixels" },
    { value: "4096", label: "4096 pixels" },
  ],
  defaultValue: "1024",
};

const IMAGE_MAX_SIZE: Fact = {
  label: "Max file size",
  value: "50 MB on a computer, 30 MB on a phone",
};

const IMAGE_BROWSERS: Fact = {
  label: "Browsers",
  value: "Chrome and Edge 69 or later, Firefox 105 or later, Safari 16.4 or later",
};

// PDFs are read fully into memory, so the cap is per file.
const PDF_INPUT: FileInput = {
  accept: "application/pdf,.pdf",
  mimePrefixes: ["application/pdf"],
  extensions: [".pdf"],
  noun: "PDF",
  article: "a",
  examples: "a .pdf document",
  maxBytes: 200 * MB,
  maxBytesPhone: 100 * MB,
};

// Several PDFs at once, in the order they should be joined.
const PDFS_INPUT: FileInput = { ...PDF_INPUT, multiple: true, minFiles: 2 };

const SPLIT_MODE: ToolOption = {
  id: "mode",
  label: "How to split",
  choices: [
    { value: "each", label: "Every page as its own PDF" },
    { value: "pick", label: "Only the pages I type, in one PDF" },
  ],
  defaultValue: "each",
};

const SPLIT_PAGES: ToolOption = {
  id: "pages",
  label: "Pages to keep",
  type: "text",
  defaultValue: "",
  placeholder: "1-3, 5, 8-10",
  hint: "Use commas between pages and a dash for a run of pages.",
  showWhen: { id: "mode", value: "pick" },
};

const PDF_DPI: ToolOption = {
  id: "dpi",
  label: "Resolution",
  choices: [
    { value: "72", label: "72 DPI, small file" },
    { value: "150", label: "150 DPI, sharp on screen" },
    { value: "300", label: "300 DPI, for printing" },
  ],
  defaultValue: "150",
};

const PDF_JPG_PAGES: ToolOption = {
  id: "pages",
  label: "Pages",
  type: "text",
  defaultValue: "",
  placeholder: "All pages",
  hint: "Leave empty for all pages, or type pages like 1-3, 5.",
};

const PDF_MAX_SIZE: Fact = {
  label: "Max file size",
  value: "200 MB per file on a computer, 100 MB per file on a phone",
};

const PDF_BROWSERS: Fact = {
  label: "Browsers",
  value: "Current versions of Chrome, Edge, Firefox and Safari",
};

const TEXT_PRIVACY: Fact = {
  label: "Where it runs",
  value: "In your browser. What you type is not sent anywhere or saved",
};

const AUDIO_BROWSERS: Fact = {
  label: "Browsers",
  value:
    "Chrome and Edge 94 or later, Firefox 130 or later, Safari 26 or later",
};

const VIDEO_BROWSERS: Fact = {
  label: "Browsers",
  value:
    "Chrome and Edge 94 or later, Safari 16.4 or later, Firefox 130 or later on a computer",
};

const VIDEO_MAX_SIZE: Fact = {
  label: "Max file size",
  value: "2 GB on a computer, 1 GB on a phone",
};

const RUNS_LOCALLY: Fact = {
  label: "Where it runs",
  value: "In your browser, on your device. Nothing is uploaded",
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
    input: VIDEO_INPUT,
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
    blurb: "Type any target in MB, bitrate is set to fit it",
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
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
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
  {
    slug: "trim-video",
    category: "video",
    engine: "video",
    preset: { kind: "trim" },
    input: VIDEO_INPUT,
    range: { media: "video" },
    actionLabel: "Trim video",
    primaryKeyword: "trim video online",
    secondaryKeywords: [
      "cut video online",
      "video trimmer",
      "shorten a video",
      "cut the start and end of a video",
    ],
    title: "Trim video online, free and with no upload",
    h1: "Trim video online",
    blurb: "Set start and end times, then cut the clip",
    metaDescription:
      "Trim a video online without uploading it. Pick the start and end, and the video trimmer cuts the clip in your browser. No watermark, no account.",
    shortAnswer:
      "To trim a video online, pick the file, set the start and end times, and press Trim video. The clip is cut in your browser, so the video is never uploaded.",
    howItWorks: [
      "Pick a video from your phone or computer. It stays on your device.",
      "Play the preview and pause where the clip should begin, then press Set start to player time. Do the same for the end.",
      "You can also type the times, like 0:05 and 0:20.",
      "Press Trim video. When the cut lands within half a second of a clean cutting point, the video trimmer copies the clip with no quality loss. Otherwise it re-encodes the clip for an exact cut.",
      "Download the shorter video as an MP4.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Output format", value: "MP4" },
      {
        label: "Quality",
        value:
          "Copied with no loss when the cut is within 0.5 seconds of a key frame. Re-encoded for an exact cut otherwise",
      },
      {
        label: "Time format",
        value: "Minutes and seconds, like 1:23 or 1:23.5. Plain seconds work too",
      },
      { label: "Watermark", value: "None" },
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I trim a video online without uploading it?",
        a: "Pick the video on this page, set the start and end, and press Trim video. The cutting is done by your own browser, so the file never leaves your phone or computer.",
      },
      {
        q: "Does trimming a video reduce its quality?",
        a: "Often not at all. Video can be cut cleanly only at certain frames, called key frames. When your cut is within half a second of one, the clip is copied bit for bit. When it is not, the clip is re-encoded so the cut is exact, and a small amount of quality is lost.",
      },
      {
        q: "Can I cut out the middle of a video?",
        a: "Not in one go. This tool keeps one part, from the start time to the end time. To remove a middle section, trim the video twice to make the two parts you want to keep.",
      },
      {
        q: "Will the trimmed video have a watermark?",
        a: "No. Nothing is added to your video.",
      },
    ],
    relatedSlugs: [
      "compress-video-to-size",
      "mute-video",
      "video-to-gif",
      "trim-audio",
    ],
  },
  {
    slug: "mov-to-mp4",
    category: "video",
    engine: "video",
    preset: { kind: "convert", outputFormat: "mp4" },
    input: {
      accept: "video/quicktime,.mov",
      mimePrefixes: ["video/quicktime"],
      extensions: [".mov", ".qt"],
      noun: "MOV video",
      article: "a",
      examples: "a .mov from an iPhone or a Mac",
      maxBytes: 2000 * MB,
      maxBytesPhone: 1000 * MB,
    },
    actionLabel: "Convert to MP4",
    primaryKeyword: "mov to mp4",
    secondaryKeywords: [
      "convert mov to mp4",
      "iphone video to mp4",
      "quicktime to mp4",
      "mov converter",
    ],
    title: "MOV to MP4 converter, free and with no upload",
    h1: "Convert MOV to MP4",
    blurb: "iPhone and QuickTime clips, copied if already H.264",
    metaDescription:
      "Convert MOV to MP4 in your browser. iPhone and QuickTime videos become MP4 files that play everywhere. No upload, no watermark, no account.",
    shortAnswer:
      "To convert MOV to MP4, pick the MOV file and press Convert to MP4. If the video inside is already H.264, it is copied into an MP4 with no quality loss, which takes a few seconds.",
    howItWorks: [
      "Pick a MOV file, such as an iPhone video or a QuickTime recording.",
      "The tool reads what is inside. MOV and MP4 are both containers, and they can hold the same kind of video.",
      "If the video is H.264, it is moved into an MP4 as it is. Nothing is re-encoded.",
      "If the video is HEVC, which newer iPhones record, it is converted to H.264 so the MP4 plays on Windows, Android and older devices.",
      "Download the MP4.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "MOV, also called QuickTime" },
      { label: "Output format", value: "MP4 with H.264 video and AAC sound" },
      {
        label: "H.264 video",
        value: "Copied with no quality loss and no re-encoding",
      },
      {
        label: "HEVC video",
        value: "Converted to H.264. Your browser must be able to decode HEVC",
      },
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I convert MOV to MP4 for free?",
        a: "Pick the MOV file on this page and press Convert to MP4. It is free, there is no watermark, and the file is converted in your browser without being uploaded.",
      },
      {
        q: "Does converting MOV to MP4 lose quality?",
        a: "Not when the video inside is H.264. In that case the video and sound are copied into the MP4 unchanged. HEVC video is re-encoded to H.264, which loses a small amount of quality but plays on far more devices.",
      },
      {
        q: "Why does my iPhone video not play on Windows?",
        a: "Newer iPhones record in HEVC inside a MOV file. Many Windows apps and older phones cannot play HEVC. Converting to an MP4 with H.264 video fixes that.",
      },
      {
        q: "What is the difference between MOV and MP4?",
        a: "Both are containers that hold video and sound. MOV is Apple's format and MP4 is the international standard based on it. MP4 is accepted by more websites, apps and devices.",
      },
    ],
    relatedSlugs: [
      "webm-to-mp4",
      "compress-video-to-size",
      "mp4-to-mp3",
      "trim-video",
    ],
  },
  {
    slug: "webm-to-mp4",
    category: "video",
    engine: "video",
    preset: { kind: "convert", outputFormat: "mp4" },
    input: {
      accept: "video/webm,.webm",
      mimePrefixes: ["video/webm"],
      extensions: [".webm"],
      noun: "WebM video",
      article: "a",
      examples: "a .webm screen recording",
      maxBytes: 2000 * MB,
      maxBytesPhone: 1000 * MB,
    },
    actionLabel: "Convert to MP4",
    primaryKeyword: "webm to mp4",
    secondaryKeywords: [
      "convert webm to mp4",
      "webm converter",
      "screen recording to mp4",
      "play webm on iphone",
    ],
    title: "WebM to MP4 converter, free and with no upload",
    h1: "Convert WebM to MP4",
    blurb: "Screen recordings, re-encoded to H.264 and AAC sound",
    metaDescription:
      "Convert WebM to MP4 in your browser. Screen recordings and downloaded WebM videos become MP4 files that play on any phone. No upload, no account.",
    shortAnswer:
      "To convert WebM to MP4, pick the WebM file and press Convert to MP4. The video is re-encoded to H.264 and the sound to AAC, which is the combination that plays on iPhones, TVs and in every editor.",
    howItWorks: [
      "Pick a WebM file, such as a browser screen recording.",
      "The tool decodes the VP8, VP9 or AV1 video inside it.",
      "It re-encodes the video to H.264 and the sound to AAC. This is a real conversion, so it takes longer than a simple copy.",
      "The bitrate is set a little above the original so the picture looks the same.",
      "Download the MP4.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "WebM with VP8, VP9 or AV1 video" },
      { label: "Output format", value: "MP4 with H.264 video and AAC sound" },
      {
        label: "Re-encoding",
        value:
          "Always. WebM and MP4 use different video and sound formats, so a plain copy is not possible",
      },
      {
        label: "File size",
        value: "Usually a little larger than the WebM, to keep the same look",
      },
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I convert WebM to MP4?",
        a: "Pick the WebM file on this page and press Convert to MP4. Your browser re-encodes it to H.264 video and AAC sound, and you download the MP4 when it is done.",
      },
      {
        q: "Why will my WebM file not play on my iPhone or TV?",
        a: "WebM uses the VP8, VP9 or AV1 video formats, which many phones, TVs and video editors do not support. MP4 with H.264 plays almost everywhere.",
      },
      {
        q: "Does converting WebM to MP4 lose quality?",
        a: "A little, because the video has to be re-encoded. The tool uses a slightly higher bitrate than the original to keep the difference hard to see.",
      },
      {
        q: "Why is the MP4 larger than the WebM?",
        a: "VP9 and AV1 pack video more tightly than H.264. To look the same, H.264 needs more data, so the MP4 is often somewhat larger. You can shrink it afterwards with the video compressor.",
      },
    ],
    relatedSlugs: [
      "mov-to-mp4",
      "compress-video-to-size",
      "video-to-gif",
      "trim-video",
    ],
  },
  {
    slug: "mute-video",
    category: "video",
    engine: "video",
    preset: { kind: "mute" },
    input: VIDEO_INPUT,
    actionLabel: "Remove audio",
    primaryKeyword: "remove audio from video",
    secondaryKeywords: [
      "mute video",
      "remove sound from video",
      "video without sound",
      "silent video",
    ],
    title: "Remove audio from video, free and with no upload",
    h1: "Remove audio from video",
    blurb: "Drops the sound track and copies the picture unchanged",
    metaDescription:
      "Remove audio from a video in your browser. The sound track is dropped and the picture is copied with no quality loss. No upload, no watermark.",
    shortAnswer:
      "To remove audio from a video, pick the file and press Remove audio. The sound track is dropped and the picture is copied unchanged, so there is no quality loss and it takes seconds.",
    howItWorks: [
      "Pick a video from your phone or computer.",
      "The tool separates the picture from the sound. They are stored as two tracks in the file.",
      "It writes a new MP4 with only the picture track. The video is not re-encoded.",
      "Download the silent video. It is a little smaller, because the sound is gone.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Output format", value: "MP4 with no sound track" },
      {
        label: "Picture quality",
        value: "Unchanged. The video track is copied, not re-encoded",
      },
      {
        label: "What is removed",
        value: "The whole sound track, not only the volume",
      },
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I remove audio from a video?",
        a: "Pick the video on this page and press Remove audio. You get an MP4 with the same picture and no sound track.",
      },
      {
        q: "Does removing the sound change the video quality?",
        a: "No. Only the sound track is left out. The picture is copied bit for bit into the new file.",
      },
      {
        q: "Is the sound really gone, or just turned down?",
        a: "It is gone. The new file has no sound track at all, so nobody can turn it back up or recover it from that file.",
      },
      {
        q: "Can I mute only part of a video?",
        a: "Not with this tool. It removes the sound from the whole video. To silence one part, trim that part out first, mute it, and join the pieces in an editor.",
      },
    ],
    relatedSlugs: [
      "trim-video",
      "compress-video-to-size",
      "mp4-to-mp3",
      "video-to-gif",
    ],
  },
  {
    slug: "compress-video-for-discord",
    category: "video",
    engine: "video",
    preset: {
      kind: "target-size",
      targetBytes: 20 * MB,
      userCanSetTarget: true,
      limitId: "discordFree",
    },
    input: VIDEO_INPUT,
    actionLabel: "Compress video",
    primaryKeyword: "compress video for discord",
    secondaryKeywords: [
      "compress video under 20mb for discord",
      "discord video size limit",
      "make video small enough for discord",
      "shrink video for discord upload",
    ],
    title: "Compress video for Discord, free and in your browser",
    h1: "Compress video for Discord",
    blurb: "Targets the 20 MB limit, or a bigger size with Nitro",
    metaDescription:
      "Compress a video for Discord in your browser. Aim for the 20 MB free upload limit, or type a bigger size if you have Nitro. No upload, no account.",
    shortAnswer:
      "Discord accepts uploads up to 20 MB without Nitro. To compress a video for Discord, pick the file, keep the 20 MB target or type a bigger one if your plan allows it, and press Compress video.",
    howItWorks: [
      "Choose the clip you want to share. Your browser reads it on your device.",
      "The target starts at 20 MB, the free upload limit. Type a larger size if your Nitro plan allows it.",
      "The tool sets a bitrate from that size and the clip length, with a small margin below it.",
      "If the bitrate would be too low for a clean picture, the resolution is lowered first.",
      "The output is checked against the target. If it is still over, the tool tries a lower bitrate. Then download the MP4.",
    ],
    facts: [
      limitFact("discordFree"),
      limitFact("discordNitroBasic"),
      limitFact("discordNitro"),
      {
        label: "Target on this page",
        value: "20 MB by default. You can type a larger size",
      },
      { label: "Output format", value: "MP4 with H.264 video and AAC sound" },
      RUNS_LOCALLY,
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I get a video under 20 MB for Discord?",
        a: "Pick the video, keep the 20 MB target, and press Compress video. The tool sets the bitrate to fit and checks the file size before you download it.",
      },
      {
        q: "What is the Discord upload limit with Nitro?",
        a: "Discord's limits depend on the plan. Without Nitro the limit is 20 MB, with Nitro Basic it is 50 MB, and with Nitro it is 1 GB. Type the size that matches your plan as the target.",
      },
      {
        q: "Will my video lose quality on Discord?",
        a: "Some detail is lost when a long clip is squeezed into a small file. Short clips keep more detail. If the bitrate would be too low, the tool lowers the resolution so the picture stays clean.",
      },
      {
        q: "Is my video uploaded to a server first?",
        a: "No. Your own browser does the compression, so the original video is not sent anywhere. It only reaches Discord when you upload the finished file.",
      },
    ],
    relatedSlugs: [
      "compress-video-for-whatsapp",
      "compress-video-for-email",
      "compress-video-to-size",
      "mute-video",
    ],
  },
  {
    slug: "compress-video-for-whatsapp",
    category: "video",
    engine: "video",
    preset: {
      kind: "target-size",
      targetBytes: 64 * MB,
      userCanSetTarget: true,
      limitId: "whatsappVideoSlow",
    },
    input: VIDEO_INPUT,
    actionLabel: "Compress video",
    primaryKeyword: "compress video for whatsapp",
    secondaryKeywords: [
      "send large video on whatsapp",
      "whatsapp video size limit",
      "compress video to send on whatsapp",
      "make video smaller for whatsapp",
    ],
    title: "Compress video for WhatsApp, free and in your browser",
    h1: "Compress video for WhatsApp",
    blurb: "64 MB target works on slow connections as well as fast",
    metaDescription:
      "Compress a video for WhatsApp in your browser. The 64 MB target fits the video limit on slower connections too. No upload, no account.",
    shortAnswer:
      "WhatsApp sends a video as media up to 64 MB on a slower connection and up to 100 MB on a faster one. To compress a video for WhatsApp, keep the 64 MB target, which fits on both.",
    howItWorks: [
      "Choose the video you want to send. Your browser reads it, and nothing goes to WhatsApp yet.",
      "The 64 MB target is the lower of the two WhatsApp video limits, so one file works on both connection speeds.",
      "The tool sets the bitrate from that target and the video length, with a small margin.",
      "If the bitrate is too low for a clean picture, the resolution comes down first.",
      "The result is checked against the target. If it is too big, a lower bitrate is tried. Then download the MP4.",
    ],
    facts: [
      limitFact("whatsappVideoFast"),
      limitFact("whatsappVideoSlow"),
      limitFact("whatsappDocument"),
      {
        label: "Target on this page",
        value:
          "64 MB by default, the lower of the two WhatsApp video limits. You can type a different size",
      },
      { label: "Output format", value: "MP4 with H.264 video and AAC sound" },
      RUNS_LOCALLY,
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I send a large video on WhatsApp?",
        a: "Compress it to 64 MB, then send the MP4 as a video in WhatsApp. A file that is too big for the video limit can be sent as a document, which allows up to 2 GB.",
      },
      {
        q: "Why is the WhatsApp target 64 MB?",
        a: "64 MB is the lower of WhatsApp's two video limits. The faster connection limit is 100 MB and the slower one is 64 MB, so a 64 MB file sends on both.",
      },
      {
        q: "Can I send a video over 2 GB on WhatsApp?",
        a: "No. WhatsApp documents are limited to 2 GB, so a larger video has to be shortened with the trim video tool on this site before it can be sent.",
      },
      {
        q: "Does compressing upload my video?",
        a: "No. The compression runs in your browser. The MP4 only goes to WhatsApp when you send it from your phone or computer.",
      },
    ],
    relatedSlugs: [
      "compress-video-for-discord",
      "compress-video-for-email",
      "compress-video-to-size",
      "trim-video",
    ],
  },
  {
    slug: "compress-video-for-email",
    category: "video",
    engine: "video",
    preset: {
      kind: "target-size",
      targetBytes: 18 * MB,
      userCanSetTarget: true,
      limitId: "gmail",
    },
    input: VIDEO_INPUT,
    actionLabel: "Compress video",
    primaryKeyword: "compress video for email",
    secondaryKeywords: [
      "compress video to attach to email",
      "video too large to email",
      "email video attachment size",
      "make video small enough to email",
    ],
    title: "Compress video for email, free and in your browser",
    h1: "Compress video for email",
    blurb: "18 MB, under Gmail, Outlook, Yahoo and iCloud limits",
    metaDescription:
      "Compress a video for email in your browser. The 18 MB target sits under the attachment limits of Gmail, Outlook, Yahoo and iCloud. No upload.",
    shortAnswer:
      "Gmail, Outlook.com, Yahoo Mail and iCloud Mail take 20 to 25 MB of attachments in one message. To compress a video for email, keep the 18 MB target, which leaves room for the extra size an attachment gains when it is sent.",
    howItWorks: [
      "Choose the video you want to attach. It stays on your device while it is compressed.",
      "The target is 18 MB, which sits under the 20 to 25 MB attachment limits.",
      "The bitrate is set from that target and the video length, with a margin for the extra size of sending.",
      "If the picture would look too blocky, the resolution goes down first.",
      "The result is checked. If it is still over 18 MB, it is compressed again at a lower bitrate. Then attach the MP4 to your message.",
    ],
    facts: [
      limitFact("gmail"),
      limitFact("outlook"),
      limitFact("yahooMail"),
      limitFact("icloudMail"),
      {
        label: "Target on this page",
        value:
          "18 MB by default, under the attachment limits. You can type a different size",
      },
      { label: "Output format", value: "MP4 with H.264 video and AAC sound" },
      RUNS_LOCALLY,
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I make a video small enough to email?",
        a: "Pick the video, keep the 18 MB target, and press Compress video. Download the MP4 and attach it to your message.",
      },
      {
        q: "What is the attachment limit for Gmail?",
        a: "Gmail allows 25 MB of attachments in one message on a personal account. Larger files are sent as Google Drive links instead.",
      },
      {
        q: "Why is the target 18 MB and not 25 MB?",
        a: "Email changes an attachment into a larger form while it is sent, so a file close to 25 MB can end up over the limit. Leaving room below it keeps the message inside the limit.",
      },
      {
        q: "Is my video uploaded before I attach it?",
        a: "No. Your browser compresses the file. It only goes to your email provider when you attach it and send the message.",
      },
    ],
    relatedSlugs: [
      "compress-video-for-whatsapp",
      "compress-video-to-size",
      "mov-to-mp4",
      "mute-video",
    ],
  },
  {
    slug: "compress-video-for-instagram",
    category: "video",
    engine: "video",
    preset: {
      kind: "target-size",
      targetBytes: 100 * MB,
      userCanSetTarget: true,
      limitId: "instagramStories",
    },
    input: VIDEO_INPUT,
    actionLabel: "Compress video",
    primaryKeyword: "compress video for instagram",
    secondaryKeywords: [
      "compress video for instagram reels",
      "instagram video size limit",
      "instagram story video size",
      "reduce video size for instagram",
    ],
    title: "Compress video for Instagram, free and in your browser",
    h1: "Compress video for Instagram",
    blurb: "Targets 100 MB, the Stories figure in Meta's docs",
    metaDescription:
      "Compress a video for Instagram in your browser, down to the 100 MB Stories figure. The number comes from Meta's developer docs. No upload.",
    shortAnswer:
      "Meta's developer documentation sets 100 MB as the upload size for Instagram Stories and 300 MB for Reels. The Instagram app does not publish its own number, so this page uses the 100 MB Stories figure as the target.",
    howItWorks: [
      "Choose the video you want to post. Your browser reads it on your device.",
      "The target is 100 MB, the Stories figure from Meta's developer documentation.",
      "The tool works out a bitrate from that target and the length of the clip, with a small margin.",
      "When the bitrate is too low to look clean, the resolution is lowered first.",
      "The file is checked against the target and compressed again at a lower bitrate if needed. Download the MP4 and upload it in Instagram.",
    ],
    facts: [
      limitFact("instagramReels"),
      limitFact("instagramStories"),
      {
        label: "Target on this page",
        value:
          "100 MB by default, the Stories figure. For a Reel, type 300 MB",
      },
      { label: "Output format", value: "MP4 with H.264 video and AAC sound" },
      RUNS_LOCALLY,
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "What is the video size limit for Instagram?",
        a: "Meta's developer documentation gives 300 MB for Reels, up to 15 minutes, and 100 MB for Stories, up to 60 seconds. The Instagram app does not publish its own number.",
      },
      {
        q: "Why does this page use 100 MB for Instagram?",
        a: "100 MB is the Stories figure in Meta's API documentation, so it is the default target here. For a Reel, type 300 MB, which is the Reels figure from the same source.",
      },
      {
        q: "Does the tool upload my video to Instagram?",
        a: "No. The compression runs in your browser, and you get the MP4 to download. You post it in the Instagram app or through your own tools.",
      },
      {
        q: "How long can an Instagram Story be?",
        a: "Meta's developer documentation gives up to 60 seconds for a Story. For a longer clip, cut it down first with the trim video tool on this site.",
      },
    ],
    relatedSlugs: [
      "compress-video-to-size",
      "trim-video",
      "mute-video",
      "mov-to-mp4",
    ],
  },
  {
    slug: "compress-video-for-telegram",
    category: "video",
    engine: "video",
    preset: {
      kind: "target-size",
      targetBytes: 2000 * MB,
      userCanSetTarget: true,
      limitId: "telegram",
    },
    input: VIDEO_INPUT,
    actionLabel: "Compress video",
    primaryKeyword: "compress video for telegram",
    secondaryKeywords: [
      "compress video for telegram upload",
      "telegram video size limit",
      "send big video on telegram",
      "make video smaller for telegram",
    ],
    title: "Compress video for Telegram, free and in your browser",
    h1: "Compress video for Telegram",
    blurb: "2 GB limit, set a lower target for faster sends",
    metaDescription:
      "Compress a video for Telegram in your browser. Most clips already fit the 2 GB limit, so set a smaller target for faster sending. Nothing goes to a server.",
    shortAnswer:
      "Telegram accepts files up to 2 GB on a free account, and most videos already fit. To compress a video for Telegram, type a smaller target such as 50 MB when you want a faster upload or less mobile data.",
    howItWorks: [
      "Choose the clip. Most clips are already under the 2 GB limit, so the default target is set there.",
      "Type a smaller target, such as 50 MB, if you want a quicker upload or less mobile data.",
      "The tool sets the bitrate from the target and the clip length, with a small margin.",
      "If the picture would look blocky at that bitrate, the resolution comes down first.",
      "The output is checked against the target. Download the MP4 and send it in Telegram.",
    ],
    facts: [
      limitFact("telegram"),
      limitFact("telegramPremium"),
      {
        label: "Target on this page",
        value:
          "2 GB by default. Type a smaller size, such as 50 MB, for faster uploads",
      },
      { label: "Output format", value: "MP4 with H.264 video and AAC sound" },
      RUNS_LOCALLY,
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "What is the file size limit on Telegram?",
        a: "A free account can send any file up to 2 GB. Telegram Premium raises that limit to 4 GB.",
      },
      {
        q: "Do I need to compress videos for Telegram?",
        a: "Usually not just to meet the limit, because most videos are already under 2 GB. Compressing is worth it when you want a faster upload or less mobile data.",
      },
      {
        q: "What size should I type for Telegram?",
        a: "A target such as 50 MB suits a short clip you want to send quickly. A smaller target lowers picture quality, so use the largest size that still feels fast for you.",
      },
      {
        q: "Is my video uploaded to a server?",
        a: "No. Your browser does the compression. The MP4 is only sent when you upload it to Telegram yourself.",
      },
    ],
    relatedSlugs: [
      "compress-video-to-size",
      "compress-video-for-slack",
      "compress-video-for-discord",
      "trim-video",
    ],
  },
  {
    slug: "compress-video-for-slack",
    category: "video",
    engine: "video",
    preset: {
      kind: "target-size",
      targetBytes: 1000 * MB,
      userCanSetTarget: true,
      limitId: "slack",
    },
    input: VIDEO_INPUT,
    actionLabel: "Compress video",
    primaryKeyword: "compress video for slack",
    secondaryKeywords: [
      "compress video to share on slack",
      "slack video file size limit",
      "send video in slack",
      "reduce video size for slack",
    ],
    title: "Compress video for Slack, free and in your browser",
    h1: "Compress video for Slack",
    blurb: "Slack allows 1 GB, smaller files upload faster",
    metaDescription:
      "Compress a video for Slack in your browser. Slack allows files up to 1 GB, and a smaller file is quicker for your team. Nothing goes to a server.",
    shortAnswer:
      "Slack lets a member or guest add files up to 1 GB, which is rarely the problem. To compress a video for Slack, type a smaller target such as 50 MB so it uploads and plays faster for teammates.",
    howItWorks: [
      "Choose the video you want to share in the channel. It is read on your device.",
      "The default target is 1000 MB, which matches the Slack limit. Type a smaller size to make the file quicker for teammates to open.",
      "The tool sets the bitrate from the target and the video length, leaving a small margin.",
      "When the bitrate would be too low for a clean picture, the resolution is lowered first.",
      "The result is checked against the target. If it is still over, a lower bitrate is tried. Download the MP4 and drop it into Slack.",
    ],
    facts: [
      limitFact("slack"),
      {
        label: "Target on this page",
        value:
          "1 GB by default. Type a smaller size, such as 50 MB, for faster uploads",
      },
      { label: "Output format", value: "MP4 with H.264 video and AAC sound" },
      RUNS_LOCALLY,
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "What is the file size limit for Slack?",
        a: "A member or guest can add any file up to 1 GB to Slack. Compressing is only needed when a smaller file matters to you.",
      },
      {
        q: "Why compress a video before posting it on Slack?",
        a: "A smaller file uploads faster from your connection, and teammates can open and play it sooner. Typing a target such as 50 MB gives you that.",
      },
      {
        q: "How do I get a video under 1 GB for Slack?",
        a: "Keep the 1000 MB target, or type a smaller size, and press Compress video. Download the MP4 and add it to your Slack message.",
      },
      {
        q: "Does the video leave my computer during compression?",
        a: "No. Your browser compresses the file, so nothing is sent to a server while it works. The file only goes to Slack when you upload it there.",
      },
    ],
    relatedSlugs: [
      "compress-video-to-size",
      "compress-video-for-telegram",
      "compress-video-for-discord",
      "mov-to-mp4",
    ],
  },
  {
    slug: "mp4-to-mp3",
    category: "video",
    engine: "video",
    preset: { kind: "convert", outputFormat: "mp3" },
    input: VIDEO_INPUT,
    options: [mp3Quality("192")],
    actionLabel: "Convert to MP3",
    primaryKeyword: "mp4 to mp3",
    secondaryKeywords: [
      "extract audio from video",
      "video to mp3",
      "mp4 to mp3 converter",
      "get mp3 from mp4",
    ],
    title: "MP4 to MP3 converter, free and with no upload",
    h1: "Convert MP4 to MP3",
    blurb: "Takes the sound track out at 192 kbps by default",
    metaDescription:
      "Convert MP4 to MP3 in your browser. The sound track is taken out of the video and encoded as MP3 at the quality you pick. No upload, no account.",
    shortAnswer:
      "To convert MP4 to MP3, pick the video and press Convert to MP3. The tool takes the sound track out of the video and encodes it as an MP3 at 192 kbps by default, and the picture is dropped.",
    howItWorks: [
      "Pick an MP4, MOV, WebM or other video from your device.",
      "The tool finds the sound track inside the file and leaves the picture out.",
      "It decodes that sound and encodes it as MP3 at the bitrate you chose. The default is 192 kbps.",
      "If the video has no sound track, the tool stops and shows a clear error.",
      "Download the MP3 file.",
    ],
    facts: [
      RUNS_LOCALLY,
      {
        label: "Input formats",
        value: "MP4, MOV, WebM and other common video files",
      },
      { label: "Output format", value: "MP3" },
      { label: "Quality choices", value: "64 to 320 kbps. The default is 192 kbps" },
      VIDEO_MAX_SIZE,
      AUDIO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I get MP3 audio from an MP4 video?",
        a: "Pick the MP4 on this page and press Convert to MP3. The sound is taken from the video and saved as an MP3 file you can download.",
      },
      {
        q: "Does converting MP4 to MP3 lose quality?",
        a: "Often a little. The sound is decoded and encoded again as MP3, which adds some loss. Choosing 320 kbps keeps the most detail, and the default is 192 kbps.",
      },
      {
        q: "What happens if my video has no sound?",
        a: "The tool shows a clear error instead of making an MP3, because there is no sound track to convert.",
      },
      {
        q: "Is my video uploaded when I convert it?",
        a: "No. Your browser reads the video and creates the MP3, so the file stays on your phone or computer.",
      },
    ],
    relatedSlugs: ["mute-video", "mov-to-mp4", "wav-to-mp3", "compress-mp3"],
  },
  {
    slug: "wav-to-mp3",
    category: "audio",
    engine: "video",
    preset: { kind: "convert", outputFormat: "mp3" },
    input: WAV_INPUT,
    options: [mp3Quality("192")],
    actionLabel: "Convert to MP3",
    primaryKeyword: "wav to mp3",
    secondaryKeywords: [
      "convert wav to mp3",
      "wav to mp3 converter",
      "shrink a wav file",
      "smaller audio from wav",
    ],
    title: "WAV to MP3 converter, free and in your browser",
    h1: "Convert WAV to MP3",
    blurb: "Large WAV recordings become far smaller MP3 files",
    metaDescription:
      "Convert WAV to MP3 in your browser. Large WAV recordings become small MP3 files at the quality you pick. Nothing is uploaded.",
    shortAnswer:
      "To convert WAV to MP3, pick the WAV file and press Convert to MP3. The sound is encoded as MP3 at 192 kbps by default, which makes the file far smaller than the WAV.",
    howItWorks: [
      "Pick a WAV recording from your device. WAV is uncompressed, so these files are often large.",
      "WAV needs no decoder, so the file can be read by every current browser.",
      "The tool encodes the sound as MP3 with the LAME encoder, which runs inside your browser.",
      "Pick the bitrate. The default is 192 kbps.",
      "Download the MP3.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "WAV, uncompressed sound" },
      { label: "Output format", value: "MP3" },
      { label: "Quality choices", value: "64 to 320 kbps. The default is 192 kbps" },
      {
        label: "Size",
        value: "At 192 kbps the MP3 is about 14 percent of CD-quality WAV at 1,411 kbps",
      },
      VIDEO_MAX_SIZE,
      { label: "Browsers", value: "Any current browser" },
    ],
    faqs: [
      {
        q: "How do I convert a WAV file to MP3 for free?",
        a: "Pick the WAV file on this page and press Convert to MP3. The conversion runs in your browser, with no charge and no account.",
      },
      {
        q: "Why is my WAV file so big?",
        a: "WAV stores sound without compression, so each second of audio takes a lot of data. CD-quality sound uses 1,411 kbps. MP3 packs the same sound into far fewer bits.",
      },
      {
        q: "How much smaller will the MP3 be?",
        a: "At 192 kbps the MP3 is about 14 percent of the size of CD-quality WAV, which is roughly one seventh. A lower bitrate makes the file smaller still.",
      },
      {
        q: "Why does this converter accept WAV in any browser?",
        a: "WAV needs no decoder, so every current browser can read it. That is why WAV files open the same way on most phones and computers.",
      },
    ],
    relatedSlugs: ["m4a-to-mp3", "mp4-to-mp3", "compress-mp3", "trim-audio"],
  },
  {
    slug: "m4a-to-mp3",
    category: "audio",
    engine: "video",
    preset: { kind: "convert", outputFormat: "mp3" },
    input: M4A_INPUT,
    options: [mp3Quality("192")],
    actionLabel: "Convert to MP3",
    primaryKeyword: "m4a to mp3",
    secondaryKeywords: [
      "convert m4a to mp3",
      "iphone voice memo to mp3",
      "apple music m4a to mp3",
      "aac audio to mp3",
    ],
    title: "M4A to MP3 converter, free and with no upload",
    h1: "Convert M4A to MP3",
    blurb: "iPhone voice memos and AAC audio, re-encoded as MP3",
    metaDescription:
      "Convert M4A to MP3 in your browser. iPhone voice memos and AAC audio are decoded and encoded again as MP3. Nothing is uploaded.",
    shortAnswer:
      "To convert M4A to MP3, pick the M4A file and press Convert to MP3. The tool decodes the AAC sound inside and encodes it again as an MP3 at 192 kbps by default.",
    howItWorks: [
      "Pick an M4A file, such as an iPhone voice memo or a song bought from Apple Music.",
      "The tool decodes the AAC sound stored inside the file.",
      "It encodes the sound again as MP3 at the bitrate you chose.",
      "A bitrate above the original adds no detail, because the sound cannot gain what it never had.",
      "Download the MP3.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "M4A with AAC sound" },
      { label: "Output format", value: "MP3" },
      { label: "Quality choices", value: "64 to 320 kbps. The default is 192 kbps" },
      { label: "Copy protection", value: "DRM-protected files cannot be converted" },
      VIDEO_MAX_SIZE,
      AUDIO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I convert an iPhone voice memo to MP3?",
        a: "Pick the M4A voice memo on this page and press Convert to MP3. The file is converted in your browser, so it is not sent to a server.",
      },
      {
        q: "Does M4A to MP3 lose quality?",
        a: "A very small amount. M4A and MP3 are both lossy formats, so the sound is compressed twice. A higher bitrate cannot bring back detail that the M4A does not have.",
      },
      {
        q: "Why will some of my Apple Music songs not convert?",
        a: "Copy-protected files, known as DRM, cannot be converted by this tool. Only files without that protection can be used.",
      },
      {
        q: "Does choosing a higher bitrate make the MP3 sound better?",
        a: "Not when the source is M4A. A bitrate above the original adds no quality, so the MP3 can be no better than the M4A it came from.",
      },
    ],
    relatedSlugs: ["wav-to-mp3", "mp4-to-mp3", "compress-mp3", "trim-audio"],
  },
  {
    slug: "compress-mp3",
    category: "audio",
    engine: "video",
    preset: { kind: "convert", outputFormat: "mp3" },
    input: MP3_INPUT,
    options: [mp3Quality("96")],
    actionLabel: "Compress MP3",
    primaryKeyword: "compress mp3",
    secondaryKeywords: [
      "reduce mp3 file size",
      "make mp3 smaller",
      "lower mp3 bitrate",
      "shrink mp3 online",
    ],
    title: "Compress MP3, free and with no upload",
    h1: "Compress MP3",
    blurb: "Default 96 kbps, half the size of a 192 kbps file",
    metaDescription:
      "Compress an MP3 in your browser by lowering its bitrate. The default is 96 kbps, and the file is never uploaded. No account needed.",
    shortAnswer:
      "To compress an MP3, pick the file and press Compress MP3. The tool re-encodes it at 96 kbps by default, and file size follows bitrate, so that is half the size of a 192 kbps MP3.",
    howItWorks: [
      "Pick an MP3 from your device.",
      "Choose a lower bitrate. The default is 96 kbps.",
      "The tool decodes the MP3 and encodes it again at the bitrate you chose.",
      "If the bitrate you chose is not lower than the original, the tool stops and says so.",
      "Download the smaller MP3.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "MP3" },
      { label: "Output format", value: "MP3" },
      { label: "Quality choices", value: "64 to 320 kbps. The default is 96 kbps" },
      {
        label: "Size rule",
        value: "File size follows bitrate, so 96 kbps is half the size of 192 kbps",
      },
      VIDEO_MAX_SIZE,
      AUDIO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I make an MP3 file smaller?",
        a: "Pick the MP3 on this page and press Compress MP3. The default of 96 kbps halves the size of a 192 kbps file.",
      },
      {
        q: "Which bitrate should I pick for speech?",
        a: "Speech stays clear at 64 kbps, which gives the smallest file. For music, 128 kbps or more gives a better result.",
      },
      {
        q: "Why did the tool say my bitrate is not lower?",
        a: "Compressing needs a bitrate lower than the original. Pick a smaller option from the list and try again.",
      },
      {
        q: "Does compressing an MP3 reduce quality?",
        a: "Yes, a little. Fewer bits per second leave less room for fine detail, so the loss is larger at the bottom of the list.",
      },
    ],
    relatedSlugs: ["trim-audio", "m4a-to-mp3", "wav-to-mp3", "mp4-to-mp3"],
  },
  {
    slug: "trim-audio",
    category: "audio",
    engine: "video",
    preset: { kind: "trim", media: "audio" },
    input: AUDIO_INPUT,
    range: { media: "audio" },
    actionLabel: "Trim audio",
    primaryKeyword: "trim audio online",
    secondaryKeywords: [
      "cut audio online",
      "audio trimmer",
      "cut an mp3 file",
      "shorten a song",
    ],
    title: "Trim audio online, free and in your browser",
    h1: "Trim audio online",
    blurb: "MP3, WAV and M4A are cut without re-encoding",
    metaDescription:
      "Trim audio online in your browser. Set the start and end on a player or type the times. MP3, WAV and M4A stay in their format. No upload.",
    shortAnswer:
      "To trim audio online, pick the file, set the start and end, and press Trim audio. MP3, WAV and M4A files are cut without re-encoding, so the sound keeps its quality.",
    howItWorks: [
      "Pick an audio file from your device. MP3, WAV, M4A, AAC, OGG and FLAC all work.",
      "Listen in the player and set the start and end. You can also type times such as 0:05 and 1:30.",
      "Press Trim audio. The part from start to end is kept and the rest is cut away.",
      "MP3, WAV and M4A are copied without re-encoding. OGG and FLAC are saved as MP3.",
      "Download the trimmed file.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input formats", value: "MP3, WAV, M4A, AAC, OGG and FLAC" },
      {
        label: "Output format",
        value: "Same as the input for MP3, WAV and M4A. OGG, FLAC and other formats are saved as MP3",
      },
      {
        label: "Quality",
        value: "Copied with no re-encoding for MP3, WAV and M4A. Other formats are re-encoded as MP3, which loses some quality",
      },
      {
        label: "Time format",
        value: "Minutes and seconds, like 1:23 or 1:23.5. Plain seconds work too",
      },
      VIDEO_MAX_SIZE,
      AUDIO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I cut a section out of an MP3 online?",
        a: "Pick the MP3, set the start and end on the player or type the times, and press Trim audio. The cut happens in your browser, so the file is not uploaded.",
      },
      {
        q: "Does trimming audio lower its quality?",
        a: "Not for MP3, WAV and M4A, because those are copied without re-encoding. OGG and FLAC are saved as MP3, which is lossy, so some quality is lost in that case.",
      },
      {
        q: "Can I keep two parts of a song and cut out the middle?",
        a: "Not in one step. This tool keeps one part, from the start time to the end time. Trim twice to make two separate files.",
      },
      {
        q: "Can I type exact times instead of using the player?",
        a: "Yes. Type times as minutes and seconds, like 1:23 or 1:23.5, or as plain seconds.",
      },
    ],
    relatedSlugs: ["compress-mp3", "m4a-to-mp3", "mp4-to-mp3", "trim-video"],
  },
  {
    slug: "video-to-gif",
    category: "video",
    engine: "video",
    preset: { kind: "convert", outputFormat: "gif" },
    input: VIDEO_INPUT,
    options: [GIF_WIDTH, GIF_FPS],
    range: { media: "video" },
    actionLabel: "Make GIF",
    primaryKeyword: "video to gif",
    secondaryKeywords: [
      "make a gif from video",
      "mp4 to gif",
      "video clip to gif",
      "gif maker online",
    ],
    title: "Video to GIF converter, free and with no upload",
    h1: "Convert video to GIF",
    blurb: "Clips up to 30 seconds, with width and frame rate set",
    metaDescription:
      "Turn a video clip into an animated GIF in your browser. Pick up to 30 seconds, then set the width and frame rate. Nothing is uploaded.",
    shortAnswer:
      "To convert video to GIF, pick the video, choose up to 30 seconds with the preview player, and press Make GIF. The clip becomes an animated GIF in your browser, with no sound.",
    howItWorks: [
      "Pick a video from your device.",
      "Use the preview player to choose the start and end. A GIF can be up to 30 seconds long.",
      "Choose a width of 320, 480 or 640 pixels, and a frame rate from 10 to 25 frames per second.",
      "Each frame gets its own palette of up to 256 colors. Pixels that stay the same between frames are left out, which keeps the file smaller.",
      "Download the GIF.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Output format", value: "GIF with no sound" },
      { label: "Max clip length", value: "30 seconds" },
      { label: "Width choices", value: "320, 480 or 640 pixels" },
      {
        label: "Frame rate choices",
        value: "10, 12.5, 20 or 25 frames per second. GIF timing works in hundredths of a second, so only these rates are exact",
      },
      { label: "Colors", value: "Up to 256 per frame" },
      VIDEO_MAX_SIZE,
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I make a GIF from a video?",
        a: "Pick the video, choose the part to use with the preview player, and press Make GIF. The GIF is made in your browser, and you download it when it is ready.",
      },
      {
        q: "Why is my GIF so large?",
        a: "GIF stores each frame as a picture, so the file grows quickly with length, width and frame rate. Shorter clips and smaller widths give the smallest files.",
      },
      {
        q: "Why is there no sound in the GIF?",
        a: "The GIF format has no sound track. Only the picture is kept, so the sound is left out.",
      },
      {
        q: "What is the longest clip I can turn into a GIF?",
        a: "30 seconds. For a longer video, choose a 30 second part with the preview player.",
      },
    ],
    relatedSlugs: ["gif-to-mp4", "compress-gif", "trim-video", "mute-video"],
  },
  {
    slug: "compress-gif",
    category: "video",
    engine: "video",
    preset: { kind: "compress-gif" },
    input: GIF_INPUT,
    options: [GIF_LEVEL],
    actionLabel: "Compress GIF",
    primaryKeyword: "compress gif",
    secondaryKeywords: [
      "reduce gif file size",
      "make gif smaller",
      "gif size reducer",
      "optimize gif online",
    ],
    title: "Compress GIF, free and with no upload",
    h1: "Compress GIF",
    blurb: "Light, Medium or Strong cuts colors, width or frames",
    metaDescription:
      "Compress a GIF in your browser with three levels. Shrink the file by reducing colors, width or frames. Nothing is uploaded, no account needed.",
    shortAnswer:
      "To compress a GIF, pick the file, choose a level, and press Compress GIF. Light reduces the colors to 128, Medium also scales the width to three quarters, and Strong halves the width, keeps every second frame and uses 64 colors.",
    howItWorks: [
      "Pick a GIF from your device.",
      "Choose a level: Light, Medium or Strong. Medium is the default.",
      "The tool reduces the colors in each frame. Pixels that do not change between frames are left out.",
      "Strong also scales the width to half and keeps every second frame. The animation speed stays the same.",
      "If the result is not smaller, the tool says so. Some GIFs were already optimized and cannot shrink much further.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "GIF" },
      { label: "Output format", value: "GIF" },
      {
        label: "Levels",
        value: "Light: same size and frames, 128 colors. Medium: three quarters of the width, 128 colors. Strong: half the width, every second frame, 64 colors",
      },
      {
        label: "Max file size",
        value: "100 MB on a computer, 50 MB on a phone. GIFs are unpacked frame by frame in memory, so the limit is lower than for video",
      },
      { label: "Browsers", value: "Any current browser" },
    ],
    faqs: [
      {
        q: "How do I make a GIF smaller without losing much quality?",
        a: "Start with Light, which keeps the size and every frame and only reduces the colors. Move to Medium or Strong only if the file is still too large.",
      },
      {
        q: "Why did my GIF not get smaller?",
        a: "Some GIFs are already optimized, so there is little left to remove. The tool tells you when the result is not smaller, and a stronger level may work better.",
      },
      {
        q: "Does Strong compression change how fast the GIF plays?",
        a: "No. Strong keeps every second frame, and the animation speed stays the same. The motion has fewer frames.",
      },
      {
        q: "Why is the GIF size limit lower than the video limit?",
        a: "GIFs are unpacked frame by frame in memory, which takes much more room than streaming a video. That is why the cap is 100 MB on a computer and 50 MB on a phone.",
      },
    ],
    relatedSlugs: ["video-to-gif", "gif-to-mp4", "compress-video-to-size", "trim-video"],
  },
  {
    slug: "gif-to-mp4",
    category: "video",
    engine: "video",
    preset: { kind: "convert", outputFormat: "mp4", from: "gif" },
    input: GIF_INPUT,
    actionLabel: "Convert to MP4",
    primaryKeyword: "gif to mp4",
    secondaryKeywords: [
      "convert gif to mp4",
      "animated gif to video",
      "gif to video converter",
      "smaller gif video",
    ],
    title: "GIF to MP4 converter, free and with no upload",
    h1: "Convert GIF to MP4",
    blurb: "Every frame encoded as H.264 with the original timing",
    metaDescription:
      "Convert GIF to MP4 in your browser. Every frame is encoded as H.264 video, and the MP4 is usually much smaller than the GIF. No upload.",
    shortAnswer:
      "To convert GIF to MP4, pick the GIF and press Convert to MP4. Every frame is drawn and encoded as H.264 video with the original timing, and the result is usually far smaller than the GIF.",
    howItWorks: [
      "Pick a GIF from your device.",
      "The tool draws each frame of the animation in order.",
      "It encodes the frames as H.264 video inside an MP4, keeping the original frame timing.",
      "Transparent areas become white, because MP4 has no transparency.",
      "Download the MP4.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "GIF" },
      { label: "Output format", value: "MP4 with H.264 video and no sound" },
      {
        label: "Transparency",
        value: "Transparent areas become white, since MP4 has no transparency",
      },
      {
        label: "Playback",
        value: "The MP4 plays once. Looping depends on the video player",
      },
      {
        label: "Max file size",
        value: "100 MB on a computer, 50 MB on a phone",
      },
      VIDEO_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I convert a GIF to an MP4 file?",
        a: "Pick the GIF on this page and press Convert to MP4. The frames are encoded into an MP4 in your browser, and you download the file when it is done.",
      },
      {
        q: "Why is the MP4 smaller than the GIF?",
        a: "GIF stores frames as pictures with simple compression. MP4 video stores only what changes between frames and packs it far more tightly.",
      },
      {
        q: "Why did transparent parts of my GIF turn white?",
        a: "MP4 video has no transparency. Any transparent area is drawn as white, so the background cannot show through.",
      },
      {
        q: "Will the MP4 loop like the GIF?",
        a: "The MP4 plays once. Whether it repeats depends on the video player you use.",
      },
    ],
    relatedSlugs: ["video-to-gif", "compress-gif", "mov-to-mp4", "webm-to-mp4"],
  },
  {
    slug: "compress-image-to-20kb",
    category: "image",
    engine: "image",
    preset: {
      kind: "target-size",
      targetBytes: 20 * KB,
      userCanSetTarget: true,
    },
    input: IMAGE_INPUT,
    actionLabel: "Compress image",
    primaryKeyword: "compress image to 20kb",
    secondaryKeywords: [
      "reduce image size to 20kb",
      "signature image under 20kb",
      "20kb image compressor",
      "small image under 20 kb",
    ],
    title: "Compress image to 20KB, free and in your browser",
    h1: "Compress image to 20KB",
    blurb: "For signatures, simple scans and small icons",
    metaDescription:
      "Compress an image to 20KB in your browser for signatures, simple scans and small icons. No upload and no account. The JPG is checked before download.",
    shortAnswer:
      "Some forms accept signature scans only up to 20KB. Pick the image, keep the 20KB target, and press Compress image to get a small JPG that is checked before you download it.",
    howItWorks: [
      "Pick the signature scan, simple document or icon. Your browser reads it on your device.",
      "The target starts at 20KB. Type a different size if your form asks for another limit.",
      "The tool lowers JPEG quality first, down to 60, and keeps the highest quality that fits.",
      "If the file is still too big at quality 60, the picture is made smaller in pixels and the search runs again.",
      "The result is checked to be under the target and shown in a preview. Then download the JPG.",
    ],
    facts: [
      {
        label: "Target size",
        value: "20KB by default. You can type another size",
      },
      {
        label: "Typical use",
        value: "Signatures on online application forms, simple scans and small icons",
      },
      { label: "Output format", value: "JPG" },
      {
        label: "Method",
        value: "Quality is lowered first, down to 60. Then the picture shrinks in pixels",
      },
      {
        label: "Transparency",
        value: "A see-through signature on a PNG gets a white background",
      },
      RUNS_LOCALLY,
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I compress an image to 20KB?",
        a: "Pick the image and keep the 20KB target. Press Compress image. The tool lowers the JPEG quality until the file fits, then checks the size before you download it.",
      },
      {
        q: "How do I make a signature image 20KB for a form?",
        a: "Scan or photograph the signature on white paper, then pick the file here. The output is a JPG with a white background, which suits most signature boxes.",
      },
      {
        q: "Will a photo look clear at 20KB?",
        a: "Not at full size. At 20KB a photo has to be small in pixels, so this size suits signatures, simple scans and icons better than detailed photos.",
      },
      {
        q: "Are my files uploaded when I compress to 20KB?",
        a: "No. The compression runs in your browser, so the image is not sent to a server. It only leaves your device when you upload the finished file yourself.",
      },
    ],
    relatedSlugs: [
      "compress-image-to-50kb",
      "compress-image-to-100kb",
      "compress-image-to-200kb",
      "resize-image",
    ],
  },
  {
    slug: "compress-image-to-50kb",
    category: "image",
    engine: "image",
    preset: {
      kind: "target-size",
      targetBytes: 50 * KB,
      userCanSetTarget: true,
    },
    input: IMAGE_INPUT,
    actionLabel: "Compress image",
    primaryKeyword: "compress image to 50kb",
    secondaryKeywords: [
      "reduce image size to 50kb",
      "photo under 50 kb",
      "50kb image compressor",
      "form photo under 50kb",
    ],
    title: "Compress image to 50KB for forms, free and no upload",
    h1: "Compress image to 50KB",
    blurb: "For form photos that must be under 50 KB",
    metaDescription:
      "Compress a photo to 50KB in your browser for form uploads. Type another size if your form asks for one. Nothing is uploaded, and no account is needed.",
    shortAnswer:
      "Many forms cap the photo at 50KB. Pick the picture, keep the 50KB target, and press Compress image. A large phone photo is resized a lot to fit, so check the preview before you download.",
    howItWorks: [
      "Pick the photo you need to upload. A phone photo works, and so does a scan.",
      "The target is 50KB. Type a different number if the form asks for another size.",
      "Quality is tried from 92 down to 60, which keeps as much detail as the size allows.",
      "A large phone photo may still be too big at quality 60, so its pixel size is cut and the search runs again.",
      "The result is checked to be under 50KB and shown in a preview. Download the JPG when it looks right.",
    ],
    facts: [
      {
        label: "Target size",
        value: "50KB by default. You can type another size",
      },
      {
        label: "Typical use",
        value: "Photos on online application forms and profile fields with a 50KB limit",
      },
      { label: "Output format", value: "JPG" },
      {
        label: "Method",
        value: "JPEG quality drops to 60 at the lowest. Pixel size is cut only when needed",
      },
      {
        label: "Transparency",
        value: "Transparent parts of a PNG become white in the JPG",
      },
      RUNS_LOCALLY,
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I compress a photo to 50KB for a form?",
        a: "Pick the photo and keep the 50KB target. Press Compress image. The tool searches for the highest quality that fits, then checks the file before you download it.",
      },
      {
        q: "Will a face photo still look clear at 50KB?",
        a: "Usually, as long as the picture is not made very large. A face photo has fewer details than a landscape, so it holds up well. Check the preview to be sure.",
      },
      {
        q: "Why is my phone photo so small after I compress it to 50KB?",
        a: "Phone photos have a lot of pixels. To get under 50KB the tool may have to cut the width a lot, after the quality has already dropped to 60.",
      },
      {
        q: "Can I type a size other than 50KB?",
        a: "Yes. Type the number the form asks for, in KB. The tool uses it as the target and checks the result against that number.",
      },
    ],
    relatedSlugs: [
      "compress-image-to-20kb",
      "compress-image-to-100kb",
      "compress-image-to-200kb",
      "png-to-jpg",
    ],
  },
  {
    slug: "compress-image-to-100kb",
    category: "image",
    engine: "image",
    preset: {
      kind: "target-size",
      targetBytes: 100 * KB,
      userCanSetTarget: true,
    },
    input: IMAGE_INPUT,
    actionLabel: "Compress image",
    primaryKeyword: "compress image to 100kb",
    secondaryKeywords: [
      "reduce image size to 100kb",
      "scan under 100kb",
      "100kb image compressor",
      "profile picture under 100kb",
    ],
    title: "Compress image to 100KB for scans and ID photos",
    h1: "Compress image to 100KB",
    blurb: "For scans, ID photos and profile pictures",
    metaDescription:
      "Compress an image to 100KB in your browser for document scans, ID photos and profile pictures. The result is checked under 100KB. No upload, no account.",
    shortAnswer:
      "Many forms and websites set a 100KB limit on scanned documents, ID photos and profile pictures. Pick the file, keep the 100KB target, and press Compress image to get a JPG under that size.",
    howItWorks: [
      "Pick the scan, ID photo or profile picture. The file stays on your device.",
      "The target is 100KB. Type another size if the site sets a different limit.",
      "Quality is lowered from 92 toward 60, and the highest value that fits is kept.",
      "If the image is still too big, its pixel size is reduced and the search runs again.",
      "The result is checked against 100KB and shown in a preview. Then download the JPG.",
    ],
    facts: [
      {
        label: "Target size",
        value: "100KB by default. You can type another size",
      },
      {
        label: "Typical use",
        value: "Document scans, ID photos and profile pictures with a 100KB limit",
      },
      { label: "Output format", value: "JPG" },
      {
        label: "Method",
        value: "Quality is tried from 92 down to 60, then pixel size is reduced",
      },
      {
        label: "Transparency",
        value: "Transparent areas of a scan saved as PNG turn white",
      },
      RUNS_LOCALLY,
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I compress a scanned document to 100KB?",
        a: "Pick the scan and keep the 100KB target. The tool keeps the highest JPEG quality that fits, so the text stays as sharp as the size allows.",
      },
      {
        q: "Will the text stay readable in a 100KB scan?",
        a: "Usually. Text needs fewer pixels than a photo, so a clear scan keeps its words at this size. Check the preview before you download.",
      },
      {
        q: "Can I use a 100KB image for an ID or profile picture?",
        a: "Many sites accept a JPG under 100KB for profile pictures. This tool does not know the rules of each site, so check the size and format they ask for.",
      },
      {
        q: "Is my scan sent to a server?",
        a: "No. The compression runs in your browser, so the scan stays on your device until you upload the finished file yourself.",
      },
    ],
    relatedSlugs: [
      "compress-image-to-20kb",
      "compress-image-to-50kb",
      "compress-image-to-200kb",
      "resize-image",
    ],
  },
  {
    slug: "compress-image-to-200kb",
    category: "image",
    engine: "image",
    preset: {
      kind: "target-size",
      targetBytes: 200 * KB,
      userCanSetTarget: true,
    },
    input: IMAGE_INPUT,
    actionLabel: "Compress image",
    primaryKeyword: "compress image to 200kb",
    secondaryKeywords: [
      "reduce image size to 200kb",
      "photo under 200kb for email",
      "200kb image compressor",
      "blog image under 200kb",
    ],
    title: "Compress image to 200KB for web and email uploads",
    h1: "Compress image to 200KB",
    blurb: "For listings and blog images, less resizing needed",
    metaDescription:
      "Compress an image to 200KB in your browser for listings, blog images and email. Photos need less resizing at this size. No upload, no account.",
    shortAnswer:
      "At 200KB a photo still looks good on a phone or in an email. Pick the image, keep the 200KB target, and press Compress image, which needs far less resizing than the smaller targets.",
    howItWorks: [
      "Pick the listing photo, blog image or upload you need to shrink.",
      "The target starts at 200KB. Type another size if your site or email service sets a different limit.",
      "Quality is tried from 92 down to 60. At this size the best quality often fits without changing the pixel size.",
      "Only images that are still too big get smaller in pixels, and the search runs again.",
      "The result is checked to be under 200KB and shown in a preview. Download the JPG when it looks right.",
    ],
    facts: [
      {
        label: "Target size",
        value: "200KB by default. You can type another size",
      },
      {
        label: "Typical use",
        value: "Listings, blog images and uploads with a 200KB limit, or photos for email",
      },
      { label: "Output format", value: "JPG" },
      {
        label: "Method",
        value: "Quality comes first, bottoming out at 60. Smaller pixels follow only if needed",
      },
      {
        label: "Transparency",
        value: "A PNG with see-through areas gets a white background",
      },
      RUNS_LOCALLY,
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I compress a photo to 200KB?",
        a: "Pick the photo and keep the 200KB target. Press Compress image. The tool lowers the quality only as far as it needs to, then checks the size before you download.",
      },
      {
        q: "Is 200KB good enough for a photo in an email?",
        a: "For most emails, yes. A 200KB JPG loads quickly and looks fine on a phone screen, though a large print made from it will look softer.",
      },
      {
        q: "Will a blog or listing site accept a 200KB image?",
        a: "Some sites set a 200KB upload limit. If yours does, keep the 200KB target. If it sets a different limit, type that number instead.",
      },
      {
        q: "Does a 200KB image lose much quality?",
        a: "Less than a smaller target would. Most photos keep their detail because the pixel size usually stays the same.",
      },
    ],
    relatedSlugs: [
      "compress-image-to-20kb",
      "compress-image-to-50kb",
      "compress-image-to-100kb",
      "png-to-jpg",
    ],
  },
  {
    slug: "png-to-jpg",
    category: "image",
    engine: "image",
    preset: { kind: "convert", outputFormat: "jpg" },
    input: PNG_INPUT,
    options: [IMAGE_QUALITY],
    actionLabel: "Convert to JPG",
    primaryKeyword: "png to jpg",
    secondaryKeywords: [
      "convert png to jpg",
      "png to jpg converter",
      "save png as jpg",
      "smaller image from png",
    ],
    title: "PNG to JPG converter, free and with no upload",
    h1: "Convert PNG to JPG",
    blurb: "See-through areas turn white, photos shrink a lot",
    metaDescription:
      "Convert PNG to JPG in your browser at the quality you pick. JPG files of photos are usually much smaller. Nothing is uploaded, and no account is needed.",
    shortAnswer:
      "To convert PNG to JPG, pick the PNG file, choose a quality, and press Convert to JPG. JPG has no transparency, so any see-through areas become white in the new file.",
    howItWorks: [
      "Pick a PNG image from your phone or computer. It stays on your device.",
      "Choose a quality: High, Balanced or Lower.",
      "The tool draws the picture onto a canvas and saves it as a JPG at that quality.",
      "Any see-through areas are filled with white, because JPG cannot store transparency.",
      "Download the JPG.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "PNG, including screenshots and images with transparent areas" },
      { label: "Output format", value: "JPG" },
      { label: "Quality choices", value: "92 high, 80 balanced or 60 lower. The default is 92" },
      { label: "Transparency", value: "Not kept. See-through areas become white" },
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I convert a PNG to a JPG for free?",
        a: "Pick the PNG on this page and press Convert to JPG. The conversion runs in your browser, so there is no charge and no account to make.",
      },
      {
        q: "Does converting PNG to JPG lower the quality?",
        a: "It can. JPG is a lossy format, so sharp text and flat graphics can look slightly blurred. Photos usually look much the same. The High setting keeps the most detail.",
      },
      {
        q: "Why does my transparent PNG have a white background now?",
        a: "JPG has no transparency, so the tool fills any see-through areas with white. If you need a transparent background, keep the file as a PNG.",
      },
      {
        q: "Why is the JPG so much smaller than the PNG?",
        a: "JPG is lossy, so it can store a photo in far less space than PNG. The difference is usually largest for photos.",
      },
    ],
    relatedSlugs: [
      "jpg-to-png",
      "image-to-webp",
      "compress-image-to-100kb",
      "resize-image",
    ],
  },
  {
    slug: "jpg-to-png",
    category: "image",
    engine: "image",
    preset: { kind: "convert", outputFormat: "png" },
    input: JPG_INPUT,
    actionLabel: "Convert to PNG",
    primaryKeyword: "jpg to png",
    secondaryKeywords: [
      "convert jpg to png",
      "jpg to png converter",
      "jpeg to png",
      "turn a jpeg into png",
    ],
    title: "JPG to PNG converter, free and with no upload",
    h1: "Convert JPG to PNG",
    blurb: "Stores the picture losslessly, old detail stays lost",
    metaDescription:
      "Convert JPG to PNG in your browser. The picture is saved as a PNG, which stores every pixel it is given without further loss. Nothing is uploaded.",
    shortAnswer:
      "To convert JPG to PNG, pick the JPG file and press Convert to PNG. The picture is saved losslessly as a PNG, but detail the JPG already lost does not come back.",
    howItWorks: [
      "Pick a JPG or JPEG photo from your device.",
      "The tool draws the picture onto a canvas in your browser.",
      "It saves that picture as a PNG. From this point on, nothing more is lost.",
      "The PNG is usually larger than the JPG, because it stores more data.",
      "Download the PNG.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "JPG or JPEG" },
      { label: "Output format", value: "PNG" },
      {
        label: "Quality",
        value: "Lossless from here on. Earlier JPG compression is not undone",
      },
      { label: "File size", value: "Usually larger than the JPG" },
      {
        label: "Transparent background",
        value: "None. A JPG has no transparent areas to keep",
      },
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I convert a JPG to PNG?",
        a: "Pick the JPG on this page and press Convert to PNG. Your browser makes the PNG, and you download it when it is ready.",
      },
      {
        q: "Will converting JPG to PNG improve the picture?",
        a: "No. The PNG keeps what the JPG holds, but detail the JPG already lost does not come back. The new file only stops further loss.",
      },
      {
        q: "Why is my PNG bigger than the JPG?",
        a: "PNG stores every pixel exactly and does not throw data away. That keeps the file larger, especially for photos.",
      },
      {
        q: "Can I make the background of a JPG transparent?",
        a: "Not with this tool. A JPG has no transparent areas, so the PNG has none either.",
      },
    ],
    relatedSlugs: [
      "png-to-jpg",
      "image-to-webp",
      "resize-image",
      "remove-exif",
    ],
  },
  {
    slug: "webp-to-jpg",
    category: "image",
    engine: "image",
    preset: { kind: "convert", outputFormat: "jpg" },
    input: WEBP_INPUT,
    options: [IMAGE_QUALITY],
    actionLabel: "Convert to JPG",
    primaryKeyword: "webp to jpg",
    secondaryKeywords: [
      "convert webp to jpg",
      "webp to jpg converter",
      "save webp as jpg",
      "webp image for upload",
    ],
    title: "WebP to JPG converter, free and with no upload",
    h1: "Convert WebP to JPG",
    blurb: "For older apps and upload forms that refuse WebP",
    metaDescription:
      "Convert WebP to JPG in your browser, so older apps and upload forms accept the picture. Pick the quality. Nothing is uploaded or sent to a server.",
    shortAnswer:
      "To convert WebP to JPG, pick the WebP file, choose a quality, and press Convert to JPG. JPG is accepted by older apps, editors and upload forms that may refuse WebP, and the file is made in your browser.",
    howItWorks: [
      "Pick a WebP image, such as one saved from a website.",
      "Choose a JPG quality. High is the default.",
      "The tool draws the picture and saves it as a JPG at that quality.",
      "A see-through area becomes white, because JPG has no transparency.",
      "If the WebP is animated, only its first frame is saved. Download the JPG.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "WebP, including images saved from websites" },
      { label: "Output format", value: "JPG" },
      { label: "Quality choices", value: "92 high, 80 balanced or 60 lower. The default is 92" },
      { label: "Transparency", value: "Not kept. See-through areas become white" },
      { label: "Animation", value: "Only the first frame is saved" },
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I change a WebP image to JPG?",
        a: "Pick the WebP file on this page and press Convert to JPG. The JPG is made in your browser, and you download it when it is done.",
      },
      {
        q: "Why will my WebP file not upload to some sites?",
        a: "Many older apps, editors and upload forms only accept JPG or PNG. Converting the WebP to JPG gives you a file those places can read.",
      },
      {
        q: "Does an animated WebP stay animated?",
        a: "No. The tool saves only the first frame, because a JPG holds one picture.",
      },
      {
        q: "Will the JPG keep the transparent parts of my WebP?",
        a: "No. JPG has no transparency, so see-through areas become white. Keep the original WebP if you need them.",
      },
    ],
    relatedSlugs: [
      "image-to-webp",
      "png-to-jpg",
      "jpg-to-png",
      "compress-image-to-200kb",
    ],
  },
  {
    slug: "image-to-webp",
    category: "image",
    engine: "image",
    preset: { kind: "convert", outputFormat: "webp" },
    input: IMAGE_INPUT,
    options: [IMAGE_QUALITY],
    actionLabel: "Convert to WebP",
    primaryKeyword: "image to webp",
    secondaryKeywords: [
      "convert image to webp",
      "jpg to webp",
      "png to webp",
      "webp converter online",
    ],
    title: "Image to WebP converter, free and with no upload",
    h1: "Convert image to WebP",
    blurb: "Keeps transparency, not saved on Safari and iPhone",
    metaDescription:
      "Convert JPG, PNG and other images to WebP in your browser. WebP keeps transparency. Works in Chrome, Edge and Firefox. Nothing is uploaded.",
    shortAnswer:
      "To convert an image to WebP, pick the file and press Convert to WebP. Transparency is kept, but Safari, iPhone and iPad cannot save WebP from a canvas, so the tool shows a clear message on those browsers instead of a file.",
    howItWorks: [
      "Pick a JPG, PNG, GIF, BMP or AVIF image from your device.",
      "Choose a quality: High, Balanced or Lower.",
      "The tool draws the picture and saves it as WebP at that quality. Transparent areas stay transparent.",
      "On Safari, iPhone and iPad the tool stops and shows a message, because Safari cannot save WebP from a canvas.",
      "Download the WebP file.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input formats", value: "JPG, PNG, GIF (first frame only), BMP and AVIF" },
      { label: "Output format", value: "WebP" },
      { label: "Quality choices", value: "92 high, 80 balanced or 60 lower. The default is 92" },
      { label: "Transparency", value: "Kept. Transparent areas stay transparent" },
      IMAGE_MAX_SIZE,
      {
        label: "Browsers",
        value: "Chrome and Edge 69 or later, Firefox 105 or later. Safari cannot save WebP",
      },
    ],
    faqs: [
      {
        q: "How do I convert a JPG or PNG to WebP?",
        a: "Pick the image on this page and press Convert to WebP. Your browser makes the WebP file, and you download it when it is ready.",
      },
      {
        q: "Does WebP keep transparent backgrounds?",
        a: "Yes. Transparent areas stay transparent in the WebP, which a JPG cannot do.",
      },
      {
        q: "Why does the tool not work on my iPhone?",
        a: "Safari cannot save WebP from a canvas, which is how the tool makes the file. On Safari, iPhone and iPad the tool shows a message instead of a download. Chrome, Edge or Firefox can make the file.",
      },
      {
        q: "Should I convert my images to WebP?",
        a: "Check where the file is going first. Some older apps and upload forms only accept JPG or PNG.",
      },
    ],
    relatedSlugs: [
      "webp-to-jpg",
      "png-to-jpg",
      "jpg-to-png",
      "compress-image-to-50kb",
    ],
  },
  {
    slug: "svg-to-png",
    category: "image",
    engine: "image",
    preset: { kind: "convert", outputFormat: "png" },
    input: SVG_INPUT,
    options: [SVG_WIDTH],
    actionLabel: "Convert to PNG",
    primaryKeyword: "svg to png",
    secondaryKeywords: [
      "convert svg to png",
      "svg to png converter",
      "svg logo to png",
      "high resolution png from svg",
    ],
    title: "SVG to PNG converter, free and with no upload",
    h1: "Convert SVG to PNG",
    blurb: "Pick 512 to 4096 px wide, redrawn sharp from the SVG",
    metaDescription:
      "Convert SVG to PNG in your browser at 512, 1024, 2048 or 4096 pixels wide. Transparent backgrounds stay transparent. Nothing is uploaded.",
    shortAnswer:
      "To convert SVG to PNG, pick the SVG file, choose the PNG width, and press Convert to PNG. An SVG is drawn fresh at the width you pick, so the PNG stays sharp, and transparent backgrounds stay transparent.",
    howItWorks: [
      "Pick an SVG logo, icon or drawing from your device.",
      "Choose the PNG width. Pick the size set in the SVG, or 512, 1024, 2048 or 4096 pixels.",
      "The tool draws the SVG at that width. The height follows the SVG's proportions.",
      "Transparent areas stay transparent in the PNG.",
      "Download the PNG.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input format", value: "SVG" },
      { label: "Output format", value: "PNG" },
      {
        label: "Width choices",
        value: "The size set in the SVG, 512, 1024, 2048 or 4096 pixels. The default is 1024 pixels",
      },
      { label: "Transparency", value: "Kept. Transparent areas stay transparent" },
      { label: "Max file size", value: "20 MB" },
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I convert an SVG to a PNG?",
        a: "Pick the SVG on this page, choose a width, and press Convert to PNG. The PNG is drawn in your browser and is ready to download.",
      },
      {
        q: "Does SVG to PNG lose quality?",
        a: "The conversion does not blur the drawing, because an SVG is drawn fresh at the width you choose. Pick a larger width if you need a bigger PNG.",
      },
      {
        q: "Why do some fonts or images in my SVG look wrong?",
        a: "Fonts that are not installed on your device may not appear. Images linked from other websites inside the SVG may not appear either.",
      },
      {
        q: "Why will my SVG not convert?",
        a: "An SVG with no width, height or viewBox may fail to open. Add those values in an editor, then try again.",
      },
    ],
    relatedSlugs: [
      "png-to-jpg",
      "image-to-webp",
      "resize-image",
      "compress-image-to-20kb",
    ],
  },
  {
    slug: "resize-image",
    category: "image",
    engine: "image",
    preset: { kind: "resize" },
    input: IMAGE_INPUT,
    sizePicker: true,
    actionLabel: "Resize image",
    primaryKeyword: "resize image online",
    secondaryKeywords: [
      "change image size",
      "resize photo in pixels",
      "make image smaller in pixels",
      "image resizer",
    ],
    title: "Resize image online, free and with no upload",
    h1: "Resize image online",
    blurb: "Type pixel width and height, or half or quarter size",
    metaDescription:
      "Resize an image online in pixels, right in your browser. Type a width and height, or use half or quarter size. Nothing is uploaded and no account is needed.",
    shortAnswer:
      "To resize an image online, pick the picture, type a width and height in pixels, and press Resize image. The tool redraws it at that size in your browser, and proportions are kept unless you turn that off.",
    howItWorks: [
      "Pick an image. The page shows a preview and the original size in pixels.",
      "Type a width or a height. Keep proportions is on by default, so the other side fills in by itself.",
      "Or press Half size or Quarter size to fill both fields at once.",
      "Press Resize image. The picture is redrawn at the new size in your browser.",
      "Download the resized image.",
    ],
    facts: [
      RUNS_LOCALLY,
      {
        label: "Output format",
        value: "JPG, PNG and WebP keep their format. Other formats are saved as JPG",
      },
      { label: "Quality", value: "JPG and WebP are saved at quality 90" },
      { label: "Largest side", value: "12000 pixels" },
      { label: "Total pixels", value: "About 16 million pixels" },
      {
        label: "Proportions",
        value: "Kept by default. Turn off Keep proportions to set width and height separately",
      },
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I resize an image in pixels?",
        a: "Pick the image, type a width or height in pixels, and press Resize image. With Keep proportions on, the other side is worked out for you.",
      },
      {
        q: "Will enlarging an image make it sharper?",
        a: "No. Making a picture larger than the original does not add detail, so it can look soft.",
      },
      {
        q: "Does resizing keep the image format?",
        a: "JPG, PNG and WebP keep their format. Other formats are saved as JPG. JPG and WebP files are saved at quality 90.",
      },
      {
        q: "What is the largest size I can resize to?",
        a: "The longest side can be up to 12000 pixels, and the total can be about 16 million pixels. Sizes above those limits are not allowed.",
      },
    ],
    relatedSlugs: [
      "compress-image-to-100kb",
      "compress-image-to-200kb",
      "png-to-jpg",
      "remove-exif",
    ],
  },
  {
    slug: "remove-exif",
    category: "image",
    engine: "image",
    preset: { kind: "strip-metadata" },
    input: IMAGE_INPUT,
    actionLabel: "Remove metadata",
    primaryKeyword: "remove exif data",
    secondaryKeywords: [
      "strip photo metadata",
      "remove gps from photo",
      "delete location from photo",
      "remove metadata from image",
    ],
    title: "Remove EXIF data from photos, free and with no upload",
    h1: "Remove EXIF data from a photo",
    blurb: "Strips GPS location, date and camera model",
    metaDescription:
      "Remove EXIF data from a photo in your browser, including the GPS location, date and camera model. The picture is kept and nothing is uploaded.",
    shortAnswer:
      "To remove EXIF data from a photo, pick the image and press Remove metadata. For JPG and PNG the metadata is cut out of the file without touching the picture, so the location, date and camera details are gone.",
    howItWorks: [
      "Pick a photo from your phone or computer. It stays on your device.",
      "The tool looks for the metadata blocks inside the file, such as EXIF.",
      "For JPG and PNG, those blocks are cut out and the picture data is left unchanged.",
      "A JPG stored sideways is redrawn upright at quality 95, so the photo does not turn.",
      "Download the cleaned file.",
    ],
    facts: [
      RUNS_LOCALLY,
      {
        label: "What is removed",
        value: "EXIF, XMP, IPTC and comments from JPG. Text, EXIF and time chunks from PNG",
      },
      {
        label: "What is kept",
        value: "The picture and the color profile, so colors look the same",
      },
      {
        label: "Quality",
        value: "Unchanged for JPG and PNG. A sideways JPG is redrawn at quality 95",
      },
      {
        label: "Other formats",
        value: "WebP and other formats are redrawn, which also removes the metadata",
      },
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I remove the location from a photo?",
        a: "Pick the photo and press Remove metadata. The GPS location is stored in the EXIF data, so it is removed along with the rest of that data.",
      },
      {
        q: "Does removing EXIF data change the photo?",
        a: "For JPG and PNG, no. The metadata is cut out and the picture is left as it was. A JPG stored sideways is the one exception, because it is redrawn upright at quality 95.",
      },
      {
        q: "What does EXIF data include?",
        a: "EXIF can include the GPS location where a photo was taken, the date and time, and the camera or phone model.",
      },
      {
        q: "Is my photo uploaded when I remove the metadata?",
        a: "No. Your browser does the work, so the photo and its location are never sent to a server.",
      },
    ],
    relatedSlugs: [
      "resize-image",
      "png-to-jpg",
      "webp-to-jpg",
      "jpg-to-png",
    ],
  },
  {
    slug: "heic-to-jpg",
    category: "image",
    engine: "image",
    preset: { kind: "convert", outputFormat: "jpg" },
    input: HEIC_INPUT,
    options: [IMAGE_QUALITY],
    actionLabel: "Convert to JPG",
    primaryKeyword: "heic to jpg",
    secondaryKeywords: [
      "convert iphone photo to jpg",
      "heic to jpg converter",
      "open heic photo on windows",
      "heic image converter",
    ],
    title: "Convert HEIC to JPG online, with no upload",
    h1: "Convert HEIC to JPG",
    blurb: "Open iPhone photos on Windows and in upload forms",
    metaDescription:
      "Convert an iPhone HEIC photo to a JPG in your browser. Choose the JPG quality and download the file. Your photo is not sent to a server.",
    shortAnswer:
      "To convert HEIC to JPG, pick the HEIC photo, choose a quality, and press Convert to JPG. The tool decodes the photo in your browser and saves a JPG you can download.",
    howItWorks: [
      "Pick a HEIC or HEIF photo from your iPhone or computer.",
      "Choose a JPG quality: 92 for the largest file, 80 balanced, or 60 for the smallest.",
      "Press Convert to JPG. The photo is decoded in your browser.",
      "The photo is turned the right way up before it is saved.",
      "Download the JPG file when the conversion is done.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input", value: "HEIC or HEIF photos, such as those saved by an iPhone" },
      { label: "Output", value: "JPG" },
      {
        label: "Quality",
        value: "92 for the largest file, 80 balanced, or 60 for the smallest file",
      },
      {
        label: "Decoding",
        value: "Safari reads HEIC itself. Other browsers download a decoder when the first photo is converted",
      },
      {
        label: "Several pictures",
        value: "A HEIC file that holds several pictures gives the main one",
      },
      {
        label: "Live Photos",
        value: "The video part of a Live Photo is not included",
      },
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I convert a HEIC photo to JPG?",
        a: "Pick the HEIC photo, choose a quality, and press Convert to JPG. Download the JPG when the conversion is done.",
      },
      {
        q: "Why does my iPhone photo not open on Windows?",
        a: "iPhones save photos as HEIC by default. Many Windows apps, websites and upload forms cannot open HEIC, so a JPG copy is easier to use.",
      },
      {
        q: "Can I convert several HEIC photos at once?",
        a: "No. The tool converts one photo at a time, so repeat the steps for each picture.",
      },
      {
        q: "Does the JPG keep the photo's orientation?",
        a: "Yes. The photo is turned the right way up before it is saved, so it does not come out sideways.",
      },
    ],
    relatedSlugs: [
      "png-to-jpg",
      "webp-to-jpg",
      "compress-image-to-200kb",
      "remove-exif",
    ],
  },
  {
    slug: "crop-image",
    category: "image",
    engine: "image",
    preset: { kind: "crop" },
    input: IMAGE_INPUT,
    cropPicker: true,
    actionLabel: "Crop image",
    primaryKeyword: "crop image online",
    secondaryKeywords: [
      "crop photo online",
      "cut out part of image",
      "crop picture to square",
      "crop image to pixel size",
    ],
    title: "Crop image online, with no upload",
    h1: "Crop image online",
    blurb: "Pick square or 16:9 shapes, or type exact pixels",
    metaDescription:
      "Crop an image online in your browser. Drag the box, pick a shape such as square or 16:9, or type exact pixel values. Your picture stays on your device.",
    shortAnswer:
      "To crop an image online, pick the picture, drag the box over the part you want, and press Crop image. The pixels inside the box keep their original size, so nothing is scaled.",
    howItWorks: [
      "Pick an image. The page shows it with a crop box on top.",
      "Drag the box to move it, or drag a corner to resize it.",
      "Choose a shape: free, 1:1 square, 4:3, 3:4, 16:9 or 9:16.",
      "Or type the left, top, width and height in pixels for an exact box.",
      "Press Crop image, then download the result.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Shapes", value: "Free, 1:1 square, 4:3, 3:4, 16:9 or 9:16" },
      {
        label: "Exact size",
        value: "Left, top, width and height can be typed in pixels",
      },
      {
        label: "Keyboard",
        value: "Arrow keys move the box. Plus and minus keys resize it",
      },
      {
        label: "Output format",
        value: "JPG, PNG and WebP keep their format. Other formats come out as JPG",
      },
      { label: "Quality", value: "JPG and WebP are saved at quality 92" },
      {
        label: "Scaling",
        value: "None. The pixels inside the box keep their original size",
      },
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I crop a picture to a square?",
        a: "Choose the 1:1 square shape, then drag the box over the part you want to keep. Press Crop image to save it.",
      },
      {
        q: "Will cropping make my image smaller in pixels?",
        a: "The pixels inside the box keep their original size, so the output has the size of the box in pixels. Nothing is scaled up or down.",
      },
      {
        q: "Which formats stay the same after cropping?",
        a: "Cropped JPG, PNG and WebP files stay in their own format. Other formats come out as JPG files.",
      },
      {
        q: "Can I type exact pixel values for the crop?",
        a: "Yes. Type the left, top, width and height in pixels, and the box moves and resizes to match the numbers you enter.",
      },
    ],
    relatedSlugs: [
      "resize-image",
      "resize-photo-for-passport",
      "compress-image-to-100kb",
      "remove-exif",
    ],
  },
  {
    slug: "image-to-pdf",
    category: "image",
    engine: "image",
    preset: { kind: "pdf", operation: "from-images" },
    input: IMAGES_INPUT,
    options: [PDF_PAGE],
    actionLabel: "Make PDF",
    primaryKeyword: "image to pdf",
    secondaryKeywords: [
      "jpg to pdf",
      "photos to pdf",
      "combine images into pdf",
      "png to pdf",
    ],
    title: "Image to PDF online, with no upload",
    h1: "Convert image to PDF",
    blurb: "One image per page, set to A4, US Letter or image size",
    metaDescription:
      "Turn one image or several into a PDF, one image per page. Set the page order and choose A4, US Letter or the image's own shape. Made in your browser.",
    shortAnswer:
      "To make a PDF from images, pick one picture or several, put them in order, and press Make PDF. Each image becomes one page, and the file is built in your browser.",
    howItWorks: [
      "Pick one image or several at once. They appear in a list.",
      "Use Move up and Move down to set the page order, or Remove to drop an image from the list.",
      "Add more files with the Add more files button if you need them.",
      "Choose the page size: the image's own shape, A4 or US Letter.",
      "Press Make PDF and download the file.",
    ],
    facts: [
      RUNS_LOCALLY,
      {
        label: "Input",
        value: "JPG, PNG, WebP, HEIC and other common image formats",
      },
      { label: "Output", value: "One PDF with one image per page" },
      {
        label: "Page size",
        value: "Same shape as each image, A4 or US Letter",
      },
      {
        label: "Page layout",
        value: "On A4 and US Letter the image is centered with a margin. Wide images turn the page sideways",
      },
      {
        label: "Image quality",
        value: "Images are stored as JPG at quality 90. Very large images are reduced to 3000 pixels on the long side",
      },
      {
        label: "Limit",
        value: "Up to 50 images, 50 MB each on a computer and 30 MB each on a phone",
      },
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I put several images into one PDF?",
        a: "Pick the images together, then put them in order with Move up and Move down. Press Make PDF, and each image becomes one page in the order shown.",
      },
      {
        q: "Can I change the page size?",
        a: "Yes. Choose the image's own shape, A4 or US Letter. On A4 and US Letter the image is centered with a margin.",
      },
      {
        q: "How many images can I add?",
        a: "Up to 50 images. Each image can be up to 50 MB on a computer or 30 MB on a phone.",
      },
      {
        q: "Does the PDF lose image quality?",
        a: "Images are stored as JPG at quality 90 inside the PDF. Very large images are first reduced to 3000 pixels on the long side.",
      },
    ],
    relatedSlugs: [
      "compress-image-to-200kb",
      "png-to-jpg",
      "heic-to-jpg",
      "resize-image",
    ],
  },
  {
    slug: "favicon-generator",
    category: "image",
    engine: "image",
    preset: { kind: "favicon" },
    input: FAVICON_INPUT,
    actionLabel: "Make favicon",
    primaryKeyword: "favicon generator",
    secondaryKeywords: [
      "make favicon from logo",
      "favicon.ico maker",
      "website icon generator",
      "apple touch icon generator",
    ],
    title: "Favicon generator, with a ZIP of site icons",
    h1: "Favicon generator",
    blurb: "favicon.ico and app icons in a ZIP, with HTML tags",
    metaDescription:
      "Make a favicon.ico, Apple touch icon and web app icons from one square logo. Download them as a ZIP with the HTML tags to paste into your page head.",
    shortAnswer:
      "To make a favicon, pick a square logo as a PNG, SVG, JPG or WebP file and press Make favicon. The tool builds a ZIP of icon files and a text file with the HTML tags for your page head.",
    howItWorks: [
      "Pick a logo as a PNG, SVG, JPG or WebP file. A square picture works best.",
      "The tool draws each icon size in your browser.",
      "Press Make favicon to build the ZIP.",
      "Open the text file and paste its tags into the head of your pages.",
      "Download the ZIP file.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input", value: "A square logo as PNG, SVG, JPG or WebP" },
      {
        label: "What is in the ZIP",
        value: "favicon.ico with 16, 32 and 48 pixel sizes, apple-touch-icon.png at 180 pixels, icon-192.png, icon-512.png, site.webmanifest, and a text file with the HTML tags for the page head",
      },
      {
        label: "Picture that is not square",
        value: "Centered with see-through space around it. It is not stretched",
      },
      {
        label: "Apple touch icon",
        value: "Has a white background, because iPhones do not show transparency there",
      },
      {
        label: "Small sizes",
        value: "A simple, bold logo reads best at 16 pixels",
      },
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "Do I need to make each icon size myself?",
        a: "No. One logo is enough, and the tool makes each size from it.",
      },
      {
        q: "Why does my logo have space around it?",
        a: "A picture that is not square is centered with see-through space around it, so it is not stretched. A square logo avoids the extra space.",
      },
      {
        q: "Why is the Apple touch icon white behind my logo?",
        a: "iPhones do not show transparency in that icon, so the tool adds a white background to it.",
      },
      {
        q: "Which logo works best for a small favicon?",
        a: "A simple, bold logo reads best at 16 pixels. Fine lines and small text are hard to see at that size.",
      },
    ],
    relatedSlugs: [
      "svg-to-png",
      "png-to-jpg",
      "image-to-webp",
      "resize-image",
    ],
  },
  {
    slug: "resize-photo-for-passport",
    category: "image",
    engine: "image",
    preset: { kind: "crop", specs: "passport" },
    input: IMAGE_INPUT,
    cropPicker: true,
    actionLabel: "Make passport photo",
    primaryKeyword: "passport photo resize",
    secondaryKeywords: [
      "passport photo size online",
      "uk passport photo online",
      "canada passport photo size",
      "crop passport photo",
    ],
    title: "Passport photo resize for UK and Canada online",
    h1: "Passport photo resize",
    blurb: "UK and Canada online passport sizes, or a custom size",
    metaDescription:
      "Crop and resize a photo to a UK or Canada online passport size in your browser. Or type a custom size. Check the official page for the rules.",
    shortAnswer:
      "To resize a passport photo online, pick a preset or Custom size, drag the crop box so the head and shoulders are inside, and press Make passport photo. The tool crops the photo, resizes it to the chosen pixel size, and saves a JPG.",
    howItWorks: [
      "Choose a preset: UK passport online application or Canada passport online renewal. Or choose Custom size.",
      "Pick your photo. A crop box in the right shape appears on it.",
      "Drag the box so the head and shoulders are inside it.",
      "Press Make passport photo. The tool crops the photo and resizes it to the preset's pixel size.",
      "Download the JPG, then check the official page before you apply.",
    ],
    facts: [
      specFact("ukPassport"),
      specFact("canadaPassport"),
      {
        label: "Custom size",
        value: "Type any width, height and maximum file size",
      },
      {
        label: "What it does not check",
        value: "Background, lighting, expression and head size. Follow the official page for those",
      },
      { label: "Output", value: "JPG" },
      RUNS_LOCALLY,
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "Will the tool check my passport photo against the rules?",
        a: "No. It only crops and resizes the photo. It cannot check the background, lighting, expression or head size, so read the official page before you apply.",
      },
      {
        q: "Why are only two passport presets included?",
        a: "Only the UK and Canada presets are included for now, because their rules were confirmed on the official pages. For any other form, use Custom size and type the numbers from the page you are applying through.",
      },
      {
        q: "Does the tool change the background or lighting?",
        a: "No. The photo is cropped and resized only, so the background, lighting and face are not changed.",
      },
      {
        q: "Is the saved file a JPG?",
        a: "Yes. The result is a JPG whose file size falls inside the range of the preset or custom size you chose.",
      },
    ],
    relatedSlugs: [
      "resize-photo-and-signature",
      "crop-image",
      "compress-image-to-50kb",
      "resize-image",
    ],
  },
  {
    slug: "resize-photo-and-signature",
    category: "image",
    engine: "image",
    preset: { kind: "crop", specs: "form" },
    input: IMAGE_INPUT,
    cropPicker: true,
    actionLabel: "Resize for form",
    primaryKeyword: "resize photo and signature for form",
    secondaryKeywords: [
      "upsc photo resize",
      "signature image size online",
      "resize signature for online form",
      "photo size for online application",
    ],
    title: "Resize photo and signature for form online",
    h1: "Resize photo and signature for form",
    blurb: "Photo and scanned signature to a form's size range",
    metaDescription:
      "Resize a photo and a scanned signature for an online application form, to the pixel size and file size range the form asks for. Done in your browser.",
    shortAnswer:
      "To resize a photo or signature for an online form, pick a preset or Custom size, drag the crop box over the face or the signature, and press Resize for form. The tool saves a JPG inside the file size range.",
    howItWorks: [
      "Choose a preset: UPSC online application photograph or UPSC online application signature. Or choose Custom size.",
      "Pick the photo and drag the crop box over the face.",
      "Press Resize for form. The tool resizes that part and saves a JPG.",
      "Repeat the steps for the signature, one picture at a time.",
      "Check the size and file size against your form's instructions.",
    ],
    facts: [
      specFact("upscPhoto"),
      specFact("upscSignature"),
      {
        label: "Custom size",
        value: "Type the width, height and maximum file size from your form's notice",
      },
      { label: "Output", value: "JPG" },
      {
        label: "Signing tip",
        value: "Use a dark pen so the strokes show clearly after resizing",
      },
      RUNS_LOCALLY,
      IMAGE_MAX_SIZE,
      IMAGE_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I resize a photo for an online form?",
        a: "Pick the photo, choose a preset or Custom size, and drag the crop box over the face. Press Resize for form to save a JPG inside the file size range.",
      },
      {
        q: "Can I resize the signature with the same settings?",
        a: "Choose the UPSC signature preset for a signature. Do the photo and the signature one after the other, because each one needs its own crop.",
      },
      {
        q: "What if my form is not listed as a preset?",
        a: "Choose Custom size and type the width, height and maximum file size from your form's own notice. Form rules change with each notification, so presets are not kept for every form.",
      },
      {
        q: "Does the tool check that my signature is valid?",
        a: "No. It only crops and resizes the picture. It does not check the signature, the photo or the form rules, so read the notice before you submit.",
      },
    ],
    relatedSlugs: [
      "resize-photo-for-passport",
      "crop-image",
      "compress-image-to-20kb",
      "resize-image",
    ],
  },
  {
    slug: "merge-pdf",
    category: "pdf",
    engine: "pdf",
    preset: { kind: "pdf", operation: "merge" },
    input: PDFS_INPUT,
    actionLabel: "Merge PDFs",
    primaryKeyword: "merge pdf",
    secondaryKeywords: [
      "combine pdf files",
      "join pdf files into one",
      "put pdfs together",
      "combine pdfs in order",
    ],
    title: "Merge PDF files in your browser, with no upload",
    h1: "Merge PDF files",
    blurb: "Up to 50 PDFs in your order, saved as merged.pdf",
    metaDescription:
      "Merge PDF files in the order you set. Pick up to 50 PDFs and download one file called merged.pdf. Runs in your browser, and nothing is uploaded.",
    shortAnswer:
      "To merge PDF files, pick two or more PDFs, put them in order, and press Merge PDFs. The pages are joined into one file called merged.pdf, and the work happens in your browser.",
    howItWorks: [
      "Pick two or more PDFs, up to 50 in all. They appear in a list.",
      "Use Up and Down to set the order, or Remove to drop a file from the list.",
      "Press Add more files if you need to add another PDF.",
      "Press Merge PDFs. The pages are joined in the order of the list.",
      "Download merged.pdf.",
    ],
    facts: [
      RUNS_LOCALLY,
      { label: "Input", value: "Two or more PDFs, up to 50" },
      { label: "Output", value: "One PDF called merged.pdf" },
      {
        label: "Quality",
        value: "Pages are copied as they are, not redrawn, so text stays selectable and quality does not change",
      },
      {
        label: "Not kept",
        value: "Bookmarks. Fillable form fields may not work in the merged file",
      },
      {
        label: "Locked files",
        value: "A password-protected PDF must be unlocked before it can be merged. The tool says which file is locked",
      },
      PDF_MAX_SIZE,
      PDF_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I combine two PDF files into one?",
        a: "Pick both PDFs, put them in order with Up and Down, and press Merge PDFs. You download one file called merged.pdf.",
      },
      {
        q: "Does merging PDFs lower the quality?",
        a: "No. The pages are copied as they are rather than redrawn, so text stays selectable and the quality does not change.",
      },
      {
        q: "Can I change the order of the pages?",
        a: "Yes. The pages are joined in the order of the list, so use Up and Down to move a file before or after another.",
      },
      {
        q: "Why won't my PDF merge?",
        a: "A password-protected PDF has to be unlocked before it can be merged. The tool tells you which file is locked.",
      },
    ],
    relatedSlugs: [
      "split-pdf",
      "pdf-to-jpg",
      "image-to-pdf",
      "compress-image-to-100kb",
    ],
  },
  {
    slug: "split-pdf",
    category: "pdf",
    engine: "pdf",
    preset: { kind: "pdf", operation: "split" },
    input: PDF_INPUT,
    options: [SPLIT_MODE, SPLIT_PAGES],
    actionLabel: "Split PDF",
    primaryKeyword: "split pdf",
    secondaryKeywords: [
      "extract pages from pdf",
      "separate pdf pages",
      "cut pdf into pages",
      "pull pages out of a pdf",
    ],
    title: "Split PDF into pages or a page range, in your browser",
    h1: "Split PDF",
    blurb: "One file per page, or only the pages you type",
    metaDescription:
      "Split a PDF into one file per page, or keep only the pages you type, such as 1-3, 5, 8-10. Files are made in your browser and nothing is uploaded.",
    shortAnswer:
      "To split a PDF, pick the file and choose how to split it. You can save every page as its own PDF, or type the pages to keep and get them back in one new PDF.",
    howItWorks: [
      "Pick one PDF. It is read in your browser.",
      "Choose How to split: every page as its own PDF, or only the pages you type.",
      "For typed pages, enter a list such as 1-3, 5, 8-10 in the Pages to keep field.",
      "Press Split PDF and download the result.",
    ],
    facts: [
      RUNS_LOCALLY,
      {
        label: "Modes",
        value: "Every page as its own PDF, or only the pages you type in one PDF",
      },
      {
        label: "Output for every page",
        value: "One ZIP file with names like page-001.pdf",
      },
      {
        label: "Output for typed pages",
        value: "One new PDF with the pages in the order typed. The same page can be typed twice",
      },
      {
        label: "Page format",
        value: "Commas between pages, a dash for a run, like 1-3, 5, 8-10",
      },
      {
        label: "Quality",
        value: "Pages are copied as they are, not redrawn, so quality does not change",
      },
      PDF_MAX_SIZE,
      PDF_BROWSERS,
    ],
    faqs: [
      {
        q: "How do I split a PDF into single pages?",
        a: "Choose Every page as its own PDF and press Split PDF. You get one ZIP file with a PDF for each page, named like page-001.pdf.",
      },
      {
        q: "Can I pull out only some pages?",
        a: "Yes. Choose Only the pages I type, in one PDF, then enter pages such as 1-3, 5, 8-10. The pages come out in the order you typed them.",
      },
      {
        q: "What happens if I type a page number that is too high?",
        a: "The tool tells you how many pages the PDF has, so you can correct the list.",
      },
      {
        q: "Does splitting a PDF lower the quality of its pages?",
        a: "No. The pages are copied as they are, not redrawn, so quality does not change.",
      },
    ],
    relatedSlugs: ["merge-pdf", "pdf-to-jpg", "image-to-pdf", "resize-image"],
  },
  {
    slug: "pdf-to-jpg",
    category: "pdf",
    engine: "pdf",
    preset: { kind: "pdf", operation: "to-jpg" },
    input: PDF_INPUT,
    options: [PDF_DPI, PDF_JPG_PAGES],
    actionLabel: "Convert to JPG",
    primaryKeyword: "pdf to jpg",
    secondaryKeywords: [
      "pdf to picture",
      "convert pdf pages to images",
      "save pdf as jpeg",
      "pdf page to jpeg",
    ],
    title: "PDF to JPG converter, made in your browser",
    h1: "Convert PDF to JPG",
    blurb: "72, 150 or 300 DPI, up to 100 pages at a time",
    metaDescription:
      "Convert a PDF to JPG, one picture per page, at 72, 150 or 300 DPI. Pick pages, up to 100 at a time. Made in your browser, nothing is uploaded.",
    shortAnswer:
      "To convert a PDF to JPG, pick the file, choose a resolution, and press Convert to JPG. Each page becomes a JPG picture, drawn in your browser.",
    howItWorks: [
      "Pick a PDF. PDF.js, the PDF reader made by Mozilla, opens it in your browser.",
      "Choose a resolution: 72 DPI for a small file, 150 DPI for sharp on screen, or 300 DPI for printing.",
      "Leave Pages empty for all pages, or type pages like 1-3, 5.",
      "Press Convert to JPG. A one-page result downloads as a JPG, and more pages download as one ZIP file.",
    ],
    facts: [
      RUNS_LOCALLY,
      {
        label: "Resolution",
        value: "72 DPI for a small file, 150 DPI for sharp on screen (the default), or 300 DPI for printing",
      },
      {
        label: "Output",
        value: "One JPG for a one-page result, or one ZIP file with names like page-001.jpg for more pages",
      },
      { label: "Page limit", value: "Up to 100 pages at a time" },
      {
        label: "Background",
        value: "Pages get a white background, and JPGs are saved at quality 90",
      },
      {
        label: "Large pages",
        value: "Very large pages are reduced to stay under about 16 million pixels",
      },
      {
        label: "Text",
        value: "Text in the JPG is part of the picture, so it can no longer be selected or searched",
      },
      {
        label: "Passwords",
        value: "Password-protected PDFs are not supported",
      },
      PDF_MAX_SIZE,
      PDF_BROWSERS,
    ],
    faqs: [
      {
        q: "Which resolution should I pick for PDF to JPG?",
        a: "Use 150 DPI for most pages, since it looks sharp on screen. Pick 300 DPI if you plan to print the JPG, or 72 DPI when file size matters more.",
      },
      {
        q: "How do I convert only some pages to JPG?",
        a: "Type the pages in the Pages field, such as 1-3, 5. Leave it empty to convert all pages.",
      },
      {
        q: "Can I convert a password-protected PDF to JPG?",
        a: "No. Password-protected PDFs are not supported.",
      },
      {
        q: "Can I still select the text in the JPG?",
        a: "No. Text in the JPG is part of the picture, so it cannot be selected or searched.",
      },
    ],
    relatedSlugs: ["merge-pdf", "split-pdf", "image-to-pdf", "jpg-to-png"],
  },
  {
    slug: "word-counter",
    category: "text",
    engine: "text",
    preset: { kind: "utility", widget: "word-counter" },
    actionLabel: "Count words",
    primaryKeyword: "word counter",
    secondaryKeywords: [
      "count words in text",
      "character counter",
      "reading time calculator",
      "word count online",
    ],
    title: "Word counter for characters, words and reading time",
    h1: "Word counter",
    blurb: "Words, characters and reading time as you type",
    metaDescription:
      "Count words, characters, sentences and paragraphs as you type. The page also estimates reading and speaking time. Nothing you type leaves your browser.",
    shortAnswer:
      "To count words, type or paste your text into the box. The word, character, sentence and paragraph counts update as you type.",
    howItWorks: [
      "Type or paste your text into the box.",
      "The counts update with every change, so you can see them move as you write.",
      "Read the reading time at 200 words a minute and the speaking time at 130 words a minute.",
      "Close the page when you are done. The text is not kept after that.",
    ],
    facts: [
      TEXT_PRIVACY,
      {
        label: "Counts shown",
        value: "Words, characters, characters without spaces, sentences and paragraphs",
      },
      {
        label: "Word rules",
        value: "The browser's own word rules, so languages without spaces between words are counted too",
      },
      {
        label: "Reading time",
        value: "Words divided by 200 a minute",
      },
      {
        label: "Speaking time",
        value: "Words divided by 130 a minute",
      },
    ],
    faqs: [
      {
        q: "How do I count words in a document?",
        a: "Paste or type the text into the box. The word count updates as you type.",
      },
      {
        q: "How is reading time calculated?",
        a: "Reading time divides the word count by 200 words a minute. Speaking time divides it by 130 words a minute.",
      },
      {
        q: "Does the word counter work in other languages?",
        a: "Yes. It uses the browser's own word rules, so it also counts words in languages that do not put spaces between words.",
      },
      {
        q: "Is the text I paste saved anywhere?",
        a: "No. The text is not saved or sent anywhere, and it is gone when you close the page.",
      },
    ],
    relatedSlugs: [
      "case-converter",
      "json-formatter",
      "base64-encode-decode",
      "percentage-calculator",
    ],
  },
  {
    slug: "case-converter",
    category: "text",
    engine: "text",
    preset: { kind: "utility", widget: "case-converter" },
    actionLabel: "Convert case",
    primaryKeyword: "case converter",
    secondaryKeywords: [
      "change text to uppercase",
      "title case converter",
      "camelcase converter",
      "snake case converter",
    ],
    title: "Case converter for title case, camelCase and snake_case",
    h1: "Case converter",
    blurb: "Sentence, Title, camelCase, snake_case and kebab-case",
    metaDescription:
      "Convert text to sentence case, lower case, UPPER CASE, Title Case, camelCase, snake_case or kebab-case. Copy the result with one button.",
    shortAnswer:
      "To change the case of text, paste it into the box and press the button for the case you need. The result appears in a second box, ready to copy.",
    howItWorks: [
      "Paste your text into the box.",
      "Press one of the seven buttons: Sentence case, lower case, UPPER CASE, Title Case, camelCase, snake_case or kebab-case.",
      "Read the converted text in the second box.",
      "Use the Copy text button to take the result to your clipboard.",
    ],
    facts: [
      TEXT_PRIVACY,
      {
        label: "Buttons",
        value: "Sentence case, lower case, UPPER CASE, Title Case, camelCase, snake_case and kebab-case",
      },
      {
        label: "Title Case",
        value: "Keeps small words such as \"a\", \"and\", \"of\" and \"the\" in lower case unless they come first or last",
      },
      {
        label: "Code and file names",
        value: "camelCase, snake_case and kebab-case drop punctuation, so the result suits code and file names",
      },
    ],
    faqs: [
      {
        q: "How do I make text all uppercase?",
        a: "Paste the text, then press UPPER CASE. The converted text appears in the second box.",
      },
      {
        q: "What is camelCase used for?",
        a: "camelCase joins words without spaces and capitalizes each word after the first. The tool drops punctuation when it makes camelCase, so the result can be used as a name in code.",
      },
      {
        q: "Why are some words lower case in Title Case?",
        a: "Title Case keeps small words such as a, and, of and the in lower case. If one of them comes first or last, it is capitalized.",
      },
      {
        q: "Does the converted text leave my browser?",
        a: "No. The conversion runs in your browser, and nothing is sent to a server.",
      },
    ],
    relatedSlugs: [
      "word-counter",
      "json-formatter",
      "base64-encode-decode",
      "password-generator",
    ],
  },
  {
    slug: "qr-code-generator",
    category: "utility",
    engine: "none",
    preset: { kind: "utility", widget: "qr-code-generator" },
    actionLabel: "Make QR code",
    primaryKeyword: "qr code generator",
    secondaryKeywords: [
      "make qr code from link",
      "qr code maker",
      "free qr code png",
      "qr code svg download",
    ],
    title: "QR code generator with PNG and SVG download",
    h1: "QR code generator",
    blurb: "Downloads as PNG or SVG, and codes never expire",
    metaDescription:
      "Make a QR code from a link or any text. Choose the size and error correction, then download it as PNG or SVG. Codes are static and never expire.",
    shortAnswer:
      "To make a QR code, type a link or any text and the code appears as you type. Choose a size and an error correction level, then download the code as a PNG or SVG file.",
    howItWorks: [
      "Type or paste a link or any text.",
      "The QR code preview updates with each change.",
      "Choose a size of 256, 512 or 1024 pixels, and an error correction level.",
      "Download the code as a PNG or an SVG file.",
    ],
    facts: [
      TEXT_PRIVACY,
      {
        label: "Sizes",
        value: "256, 512 or 1024 pixels",
      },
      {
        label: "Error correction",
        value: "Low (7 percent), Medium (15 percent), Quartile (25 percent) or High (30 percent), which is how much of the code can be damaged and still scan",
      },
      {
        label: "Capacity",
        value: "Up to 2,953 bytes at Low error correction, and less at higher levels",
      },
      {
        label: "Static codes",
        value: "The content is stored inside the code itself, so the codes never expire and scans never pass through this site",
      },
      {
        label: "Account",
        value: "No account and no watermark",
      },
    ],
    faqs: [
      {
        q: "How do I make a QR code for a link?",
        a: "Paste the link into the box. The preview updates as you type, and you can download the code as a PNG or SVG.",
      },
      {
        q: "Which error correction level should I choose?",
        a: "Higher levels let more of the code be damaged and still scan, but they hold less text. Pick the level that suits how the code will be used.",
      },
      {
        q: "Do QR codes made here expire?",
        a: "No. The codes are static. The content is stored inside the code itself, so the code never expires.",
      },
      {
        q: "Can I see how many people scanned my QR code?",
        a: "Not with these codes. The content is stored inside the code, so a scan goes straight to your link and never passes through this site. Only the site the link points to can see its own visits.",
      },
    ],
    relatedSlugs: [
      "favicon-generator",
      "image-to-pdf",
      "word-counter",
      "password-generator",
    ],
  },
  {
    slug: "password-generator",
    category: "utility",
    engine: "none",
    preset: { kind: "utility", widget: "password-generator" },
    actionLabel: "Make password",
    primaryKeyword: "password generator",
    secondaryKeywords: [
      "random password maker",
      "strong random password",
      "generate password with symbols",
      "password strength in bits",
    ],
    title: "Password generator with a strength reading in bits",
    h1: "Password generator",
    blurb: "Length 8 to 128, strength shown in bits, nothing saved",
    metaDescription:
      "Generate a random password from 8 to 128 characters. Pick uppercase, lowercase, numbers and symbols, and see its strength in bits. Nothing is saved.",
    shortAnswer:
      "To make a password, choose a length and the character sets you want, then press Make password. The password is random, and its strength is shown in bits.",
    howItWorks: [
      "Choose a length from 8 to 128 characters. The default is 20.",
      "Tick the character sets to use: uppercase letters, lowercase letters, numbers and symbols.",
      "Optionally leave out characters that look alike, such as 0, O, l, 1 and I.",
      "Press Copy password to copy it, or Make new password for another one.",
    ],
    facts: [
      TEXT_PRIVACY,
      {
        label: "Length",
        value: "8 to 128 characters, 20 by default",
      },
      {
        label: "Random source",
        value: "The browser's cryptographic random number generator, crypto.getRandomValues",
      },
      {
        label: "Each set",
        value: "The password always includes at least one character from each set you chose",
      },
      {
        label: "Strength",
        value: "Shown in bits, worked out from the length and the number of possible characters",
      },
    ],
    faqs: [
      {
        q: "How long should a password be?",
        a: "The length is up to you. This tool goes from 8 to 128 characters, and 20 is the default. A longer password has more bits of strength.",
      },
      {
        q: "What does the strength in bits mean?",
        a: "It is worked out from the length and the number of possible characters. More bits means more possible combinations.",
      },
      {
        q: "Is the password saved or sent anywhere?",
        a: "No. The password is made in your browser and is not saved or sent anywhere. Copy it somewhere you trust before you close the page.",
      },
      {
        q: "Why can I leave out some characters?",
        a: "The option that avoids look-alike characters removes 0, O, l, 1 and I, which are easy to mix up when you type or read a password.",
      },
    ],
    relatedSlugs: [
      "qr-code-generator",
      "base64-encode-decode",
      "word-counter",
      "json-formatter",
    ],
  },
  {
    slug: "json-formatter",
    category: "utility",
    engine: "text",
    preset: { kind: "utility", widget: "json-formatter" },
    actionLabel: "Format JSON",
    primaryKeyword: "json formatter",
    secondaryKeywords: [
      "format json online",
      "json beautifier",
      "minify json",
      "json validator",
    ],
    title: "JSON formatter, minifier and validator",
    h1: "JSON formatter",
    blurb: "Indent with 2 or 4 spaces or tabs, sort keys A to Z",
    metaDescription:
      "Format or minify JSON in your browser. Indent with 2 spaces, 4 spaces or tabs, sort keys A to Z, and see the line and column of any error.",
    shortAnswer:
      "To format JSON, paste it into the box and press Format JSON. Pick an indent first, or press Minify JSON to remove all spaces and line breaks.",
    howItWorks: [
      "Paste your JSON into the box.",
      "Pick an indent of 2 spaces, 4 spaces or tabs, and tick the option to sort keys if you need it.",
      "Press Format JSON, or press Minify JSON to remove all spaces and line breaks.",
      "If the JSON is not valid, read the error. It gives the line and column where the JSON goes wrong.",
      "Copy the result with the Copy text button.",
    ],
    facts: [
      TEXT_PRIVACY,
      {
        label: "Indent",
        value: "2 spaces, 4 spaces or tabs",
      },
      {
        label: "Sort keys",
        value: "An option sorts object keys from A to Z",
      },
      {
        label: "Checked by",
        value: "The browser's own JSON parser",
      },
      {
        label: "Errors",
        value: "The error message, with the line and column where the JSON goes wrong",
      },
    ],
    faqs: [
      {
        q: "How do I format JSON online?",
        a: "Paste the JSON, pick an indent, and press Format JSON. The indented JSON is the result, and you can copy it with the Copy text button.",
      },
      {
        q: "What is the difference between formatting and minifying JSON?",
        a: "Formatting adds indents and line breaks so people can read the JSON. Minifying removes all spaces and line breaks, which makes the JSON as short as it can be.",
      },
      {
        q: "Why does my JSON show an error?",
        a: "The text is not valid JSON. The error shows the line and column where it goes wrong, which is often a missing comma or quote, or an extra comma before a closing bracket.",
      },
      {
        q: "Does the JSON leave my browser?",
        a: "No. Your browser checks and formats the JSON, and nothing you paste is sent to a server.",
      },
    ],
    relatedSlugs: [
      "word-counter",
      "case-converter",
      "base64-encode-decode",
      "password-generator",
    ],
  },
  {
    slug: "base64-encode-decode",
    category: "utility",
    engine: "text",
    preset: { kind: "utility", widget: "base64-encode-decode" },
    actionLabel: "Encode",
    primaryKeyword: "base64 encode",
    secondaryKeywords: [
      "base64 decoder",
      "decode base64 text",
      "url safe base64",
      "utf-8 base64 converter",
    ],
    title: "Base64 encode and decode text, with UTF-8 support",
    h1: "Base64 encode and decode",
    blurb: "Text to Base64 and back, with a URL-safe option",
    metaDescription:
      "Encode text to Base64 or decode Base64 back to text in your browser. Accents and emoji work, and an option makes URL-safe Base64.",
    shortAnswer:
      "To encode text in Base64, paste it and press Encode to Base64. To read Base64 text, press Decode from Base64. Base64 is an encoding, not encryption, so anyone can decode it.",
    howItWorks: [
      "Type or paste the text into the box.",
      "Press Encode to Base64, or press Decode from Base64.",
      "Tick the URL-safe option if the Base64 will go into a web address.",
      "Take the result with the Copy text button once it appears.",
    ],
    facts: [
      TEXT_PRIVACY,
      {
        label: "Text encoding",
        value: "UTF-8, so accents and emoji work",
      },
      {
        label: "URL-safe Base64",
        value: "Uses - and _ instead of + and /, and leaves out the = padding",
      },
      {
        label: "Decoding",
        value: "Accepts both kinds of Base64 and ignores spaces and line breaks",
      },
      {
        label: "Errors",
        value: "Says so when the input is not valid Base64, or when it decodes to data that is not text",
      },
    ],
    faqs: [
      {
        q: "Can someone decode Base64 without a key?",
        a: "Yes. Base64 is an encoding, not encryption, so anyone can decode it and no key is needed.",
      },
      {
        q: "Why does my Base64 show an error?",
        a: "The input is not valid Base64, or it decodes to data that is not text. Check that the whole value was copied.",
      },
      {
        q: "What is URL-safe Base64?",
        a: "It is Base64 that uses - and _ instead of + and /, and leaves out the = padding. Decoding accepts both kinds.",
      },
      {
        q: "Do accents and emoji work?",
        a: "Yes. The text is handled as UTF-8, so accents and emoji encode and decode correctly.",
      },
    ],
    relatedSlugs: [
      "json-formatter",
      "password-generator",
      "case-converter",
      "word-counter",
    ],
  },
  {
    slug: "percentage-calculator",
    category: "utility",
    engine: "none",
    preset: { kind: "utility", widget: "percentage-calculator" },
    actionLabel: "Calculate",
    primaryKeyword: "percentage calculator",
    secondaryKeywords: [
      "percent of a number",
      "percent increase calculator",
      "percent change formula",
      "what percent of",
    ],
    title: "Percentage calculator for three common percent questions",
    h1: "Percentage calculator",
    blurb: "Percent of a number, share, or change between two",
    metaDescription:
      "Work out a percent of a number, what percent one number is of another, or the percentage change between two numbers. Each answer shows its formula.",
    shortAnswer:
      "Pick the calculator that matches your question and type the numbers. Each answer updates as you type and shows the formula it used.",
    howItWorks: [
      "Choose one of the three calculators on the page.",
      "Type your numbers. The answer updates as you type.",
      "For percentage change, check whether the answer is an increase or a decrease.",
      "Read the formula under the answer to see how it was worked out.",
    ],
    facts: [
      TEXT_PRIVACY,
      {
        label: "Percent of",
        value: "X percent of Y is X ÷ 100 × Y",
      },
      {
        label: "Share",
        value: "X as a percent of Y is X ÷ Y × 100",
      },
      {
        label: "Change",
        value: "Change from X to Y is (Y − X) ÷ X × 100, and the answer says whether it is an increase or a decrease",
      },
      {
        label: "Decimal mark",
        value: "A comma can be used as the decimal mark",
      },
    ],
    faqs: [
      {
        q: "How do I work out a percentage of a number?",
        a: "Use the first calculator. Type the percent and the number, and the answer appears. The formula is X ÷ 100 × Y.",
      },
      {
        q: "How do I find what percent one number is of another?",
        a: "Use the second calculator. Type the part and the whole, and the answer uses the formula X ÷ Y × 100.",
      },
      {
        q: "How is percentage change calculated?",
        a: "Subtract the starting number from the new number, divide by the starting number, and multiply by 100. The formula is (Y − X) ÷ X × 100.",
      },
      {
        q: "Can I use a comma in the numbers?",
        a: "Yes. A comma can be used as the decimal mark, so 2,5 is read as 2.5.",
      },
    ],
    relatedSlugs: [
      "word-counter",
      "password-generator",
      "json-formatter",
      "favicon-generator",
    ],
  },
];

export function getCategory(id: string): CategoryInfo | undefined {
  return CATEGORIES.find((category) => category.id === id);
}

export function toolsIn(category: Category): Tool[] {
  return tools.filter((tool) => tool.category === category);
}

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getRelatedTools(tool: Tool): Tool[] {
  return tool.relatedSlugs
    .map((slug) => getTool(slug))
    .filter((related): related is Tool => related !== undefined);
}
