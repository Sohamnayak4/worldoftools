import { MB } from "./format";
import { type LimitId, limits } from "./limits";

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
      // Key into lib/limits.ts when the target comes from a platform limit.
      limitId?: LimitId;
      outputFormat?: string;
    }
  // `from` is set when the source is not ordinary video or audio.
  | { kind: "convert"; outputFormat: "mp4" | "mp3" | "gif"; from?: "gif" }
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
  // The word that goes before the noun: "a video", "an MP3".
  article: "a" | "an";
  // Examples for the error message: "MP4 or MOV".
  examples: string;
  // Largest file the tool takes. Explained in plain words in the UI.
  maxBytes: number;
  // Lower cap for phones, when the tool needs one.
  maxBytesPhone?: number;
};

// A choice the visitor makes before starting, shown as a dropdown.
export type ToolOption = {
  id: string;
  label: string;
  choices: { value: string; label: string }[];
  defaultValue: string;
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
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getRelatedTools(tool: Tool): Tool[] {
  return tool.relatedSlugs
    .map((slug) => getTool(slug))
    .filter((related): related is Tool => related !== undefined);
}
