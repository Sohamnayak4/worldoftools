import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  type ConversionAudioOptions,
  type ConversionOptions,
  CanvasSink,
  CanvasSource,
  Input,
  Mp3OutputFormat,
  Mp4OutputFormat,
  Output,
  type OutputFormat,
  Quality,
  WavOutputFormat,
  canEncodeAudio,
  canEncodeVideo,
} from "mediabunny";
import type { EngineJob, EngineMessage, EngineRequest } from "./types";
import {
  type VideoPlan,
  type VideoSource,
  nextCorrection,
  planVideo,
} from "./videoPlan";

// The video engine. It uses the browser's own video encoder (WebCodecs)
// through Mediabunny, reads the file in a stream, and writes an MP4 with
// H.264 video and AAC sound. Nothing leaves the device.

const MAX_TRIES = 3;

const post = (message: EngineMessage) => self.postMessage(message);

class Stop extends Error {
  hint: string;
  constructor(message: string, hint: string) {
    super(message);
    this.hint = hint;
  }
}

async function readSource(file: File): Promise<{
  source: VideoSource;
  codec: string;
}> {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });
  try {
    if (!(await input.canRead())) {
      throw new Stop(
        "This file could not be read as a video.",
        "It may be damaged or in a format this tool does not know. Try an MP4 or MOV file.",
      );
    }
    const video = await input.getPrimaryVideoTrack();
    if (!video) {
      throw new Stop(
        "This file has no video in it.",
        "Choose a file that contains a video track.",
      );
    }
    const codec = (await video.getCodec()) ?? "unknown";
    if (!(await video.canDecode())) {
      throw new Stop(
        `This browser cannot read the ${codec.toUpperCase()} video in this file.`,
        codec === "hevc"
          ? "HEVC video from iPhones needs hardware support. Try Safari, or a newer phone or computer."
          : "Try a different browser, or convert the file to MP4 first.",
      );
    }

    const durationSeconds = await input.computeDuration();
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Stop(
        "This video has no readable length.",
        "The file may be damaged. Try a different file.",
      );
    }
    const stats = await video.computePacketStats(120);

    let audio: VideoSource["audio"] = null;
    const audioTrack = await input.getPrimaryAudioTrack();
    if (audioTrack) {
      const audioCodec = await audioTrack.getCodec();
      const bitrate =
        (await audioTrack.getAverageBitrate()) ??
        (await audioTrack.computePacketStats(400)).averageBitrate;
      audio = {
        isAac: audioCodec === "aac",
        bitrate: Math.max(bitrate, 16_000),
        decodable: await audioTrack.canDecode(),
        channels: await audioTrack.getNumberOfChannels(),
        sampleRate: await audioTrack.getSampleRate(),
      };
    }

    return {
      codec,
      source: {
        durationSeconds,
        width: await video.getDisplayWidth(),
        height: await video.getDisplayHeight(),
        frameRate: stats.averagePacketRate,
        totalBitrate: (file.size * 8) / durationSeconds,
        audio,
      },
    };
  } finally {
    input.dispose();
  }
}

type ConversionSettings = Pick<
  ConversionOptions,
  "video" | "audio" | "trim" | "copy"
>;

// Metadata at the start, so the result plays right away when shared.
const mp4 = () => new Mp4OutputFormat({ fastStart: "in-memory" });

function convertToMp4(
  file: File,
  settings: ConversionSettings,
  onProgress: (value: number) => void,
): Promise<ArrayBuffer> {
  return convertTo(file, mp4(), settings, onProgress);
}

// Runs one conversion to a file held in memory and returns its bytes.
async function convertTo(
  file: File,
  format: OutputFormat,
  settings: ConversionSettings,
  onProgress: (value: number) => void,
): Promise<ArrayBuffer> {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });
  const target = new BufferTarget();
  const output = new Output({ format, target });

  try {
    const conversion = await Conversion.init({
      input,
      output,
      tracks: "primary",
      showWarnings: false,
      ...settings,
    });

    const lost = conversion.discardedTracks.filter(
      (item) => item.reason !== "discarded_by_user",
    );
    if (!conversion.isValid || lost.length > 0) {
      const kinds = lost.map((item) => item.track.type).join(" and ");
      throw new Stop(
        `This browser cannot convert the ${kinds || "media"} in this file.`,
        "Update your browser, or try a current version of Chrome or Safari.",
      );
    }

    conversion.onProgress = (value) => onProgress(value);
    await conversion.execute();
    if (!target.buffer) throw new Error("The encoder returned no data.");
    return target.buffer;
  } finally {
    input.dispose();
  }
}

function encodeOnce(
  file: File,
  plan: VideoPlan,
  sourceFrameRate: number,
  onProgress: (value: number) => void,
): Promise<ArrayBuffer> {
  let audio: ConversionAudioOptions;
  if (plan.audio.mode === "none") {
    audio = { discard: true };
  } else if (plan.audio.mode === "copy") {
    // No codec or quality set, so the original sound is copied untouched.
    audio = {};
  } else {
    audio = {
      codec: "aac",
      quality: new Quality({ bitrate: plan.audio.bitrate }),
      forceTranscode: true,
    };
  }
  return convertToMp4(
    file,
    {
      video: {
        codec: "avc",
        width: plan.width,
        height: plan.height,
        fit: "contain",
        // Only cap high frame rates. Otherwise keep the original timing.
        frameRate: sourceFrameRate > 30.5 ? plan.frameRate : undefined,
        quality: new Quality({ bitrate: plan.videoBitrate }),
        forceTranscode: true,
      },
      audio,
    },
    onProgress,
  );
}

function describe(plan: VideoPlan, source: VideoSource): string[] {
  const details: string[] = [];
  const short = Math.min(plan.width, plan.height);
  details.push(
    plan.downscaled
      ? `Picture resized from ${Math.min(source.width, source.height)}p to ${short}p so it stays clean at this size.`
      : `Picture kept at ${short}p.`,
  );
  if (plan.audio.mode === "copy") details.push("Sound kept as it was.");
  if (plan.audio.mode === "encode") {
    details.push(`Sound set to ${Math.round(plan.audio.bitrate / 1000)} kbps.`);
  }
  return details;
}

function requireWebCodecs() {
  if (
    typeof VideoEncoder === "undefined" ||
    typeof VideoDecoder === "undefined"
  ) {
    throw new Stop(
      "This browser cannot work with video.",
      "Use a current version of Chrome, Edge or Safari. Firefox on Android is not supported yet.",
    );
  }
}

const KINDS = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  gif: "image/gif",
} as const;

function finish(
  file: File,
  data: ArrayBuffer | Uint8Array<ArrayBuffer>,
  suffix: string,
  details: string[],
  extension: keyof typeof KINDS = "mp4",
) {
  const base = file.name.replace(/\.[^.]+$/, "") || "file";
  post({
    type: "done",
    blob: new Blob([data], { type: KINDS[extension] }),
    // No suffix when the extension alone makes the name different.
    fileName: suffix ? `${base}-${suffix}.${extension}` : `${base}.${extension}`,
    details,
  });
}

const clock = (seconds: number) => {
  const tenths = Math.round(seconds * 10);
  const whole = Math.floor(tenths / 10);
  const text = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  return tenths % 10 === 0 ? text : `${text}.${tenths % 10}`;
};

// Convert to MP4. H.264 video is copied as it is. Anything else is
// re-encoded to H.264 so the result plays everywhere.
async function runConvert(file: File) {
  post({ type: "progress", value: 0, note: "Reading the video" });
  const { source, codec } = await readSource(file);
  const copyVideo = codec === "avc";
  const copyAudio = source.audio === null || source.audio.isAac;
  const audioBitrate = source.audio?.bitrate ?? 0;
  // A different codec needs some extra bits to look the same.
  const videoBitrate = Math.max(
    300_000,
    Math.round((source.totalBitrate - audioBitrate) * 1.25),
  );
  const buffer = await convertToMp4(
    file,
    {
      video: copyVideo
        ? { codec: "avc" }
        : {
            codec: "avc",
            quality: new Quality({ bitrate: videoBitrate }),
            forceTranscode: true,
          },
      audio: copyAudio ? {} : { codec: "aac" },
    },
    (value) => post({ type: "progress", value, note: "Converting" }),
  );
  finish(file, buffer, "converted", [
    copyVideo
      ? "The video was already H.264, so it was copied with no quality loss."
      : `Video converted from ${codec.toUpperCase()} to H.264.`,
    source.audio === null
      ? "The file has no sound."
      : copyAudio
        ? "Sound kept as it was."
        : "Sound converted to AAC.",
  ]);
}

async function runTrim(file: File, start: number, end: number) {
  post({ type: "progress", value: 0, note: "Reading the video" });
  const { source } = await readSource(file);
  const last = source.durationSeconds;
  if (start >= last) {
    throw new Stop(
      `The start time is past the end of the video, which is ${clock(last)} long.`,
      "Type an earlier start time.",
    );
  }
  const stop = Math.min(end, last);
  const buffer = await convertToMp4(
    file,
    {
      trim: { start, end: stop },
      // Copy without re-encoding when the cut lands within half a second
      // of where copying allows. Otherwise re-encode for an exact cut.
      copy: { boundaryTolerance: 0.5 },
    },
    (value) => post({ type: "progress", value, note: "Trimming" }),
  );
  finish(file, buffer, "trimmed", [
    `Kept ${clock(start)} to ${clock(stop)} of ${clock(last)}.`,
  ]);
}

async function runMute(file: File) {
  post({ type: "progress", value: 0, note: "Reading the video" });
  const { source } = await readSource(file);
  if (source.audio === null) {
    throw new Stop(
      "This video already has no sound.",
      "There is nothing to remove. Choose a different file.",
    );
  }
  const buffer = await convertToMp4(
    file,
    { video: {}, audio: { discard: true } },
    (value) => post({ type: "progress", value, note: "Removing the sound" }),
  );
  finish(file, buffer, "muted", [
    "Sound removed. The picture was copied with no quality loss.",
  ]);
}

async function runTargetSize(file: File, targetBytes: number) {
  post({ type: "progress", value: 0, note: "Reading the video" });
  const { source } = await readSource(file);

  const canEncodeAac =
    source.audio !== null &&
    source.audio.decodable === true &&
    (await canEncodeAudio("aac", {
      numberOfChannels: source.audio.channels,
      sampleRate: source.audio.sampleRate,
    }));

  let correction = 1;
  let best: { buffer: ArrayBuffer; plan: VideoPlan } | null = null;

  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    const planned = planVideo(source, targetBytes, correction, canEncodeAac);
    if (!planned.ok) {
      if (best) break;
      throw new Stop(planned.message, planned.hint);
    }
    const plan = planned.plan;

    const encodable = await canEncodeVideo("avc", {
      width: plan.width,
      height: plan.height,
      quality: new Quality({ bitrate: plan.videoBitrate }),
    });
    if (!encodable) {
      throw new Stop(
        "This browser cannot make H.264 video.",
        "Use a current version of Chrome, Edge or Safari.",
      );
    }

    const note =
      attempt === 1
        ? "Compressing"
        : `Try ${attempt} of ${MAX_TRIES}. The last one was over, so this one aims lower`;
    const buffer = await encodeOnce(file, plan, source.frameRate, (value) =>
      post({ type: "progress", value, note }),
    );

    if (!best || buffer.byteLength < best.buffer.byteLength) {
      best = { buffer, plan };
    }
    if (buffer.byteLength <= targetBytes) break;
    correction = nextCorrection(correction, buffer.byteLength, targetBytes);
  }

  if (!best) throw new Error("No result was produced.");
  finish(file, best.buffer, "compressed", describe(best.plan, source));
}

// ---- Sound ----

async function readAudio(file: File) {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });
  try {
    if (!(await input.canRead())) {
      throw new Stop(
        "This file could not be read.",
        "It may be damaged or in a format this tool does not know.",
      );
    }
    const track = await input.getPrimaryAudioTrack();
    if (!track) {
      throw new Stop(
        "This file has no sound in it.",
        "Choose a file that has a sound track.",
      );
    }
    const codec = (await track.getCodec()) ?? "unknown";
    const bitrate =
      (await track.getAverageBitrate()) ??
      (await track.computePacketStats(400)).averageBitrate;
    return {
      codec: codec as string,
      bitrate,
      decodable: await track.canDecode(),
      durationSeconds: await input.computeDuration(),
    };
  } finally {
    input.dispose();
  }
}

async function loadMp3Encoder() {
  // Browsers have no MP3 encoder of their own. This adds LAME.
  // It is loaded only here, so the other tools do not download it.
  if (!(await canEncodeAudio("mp3"))) {
    const { registerMp3Encoder } = await import("@mediabunny/mp3-encoder");
    registerMp3Encoder();
  }
}

const cannotDecodeSound = (codec: string) =>
  new Stop(
    `This browser cannot read the ${codec.toUpperCase()} sound in this file.`,
    "Update your browser, or try a current version of Chrome or Safari.",
  );

async function runToMp3(file: File, kbps: number) {
  post({ type: "progress", value: 0, note: "Reading the file" });
  const source = await readAudio(file);
  if (!source.decodable) throw cannotDecodeSound(source.codec);
  const sourceKbps = Math.round(source.bitrate / 1000);
  if (source.codec === "mp3" && kbps >= sourceKbps) {
    throw new Stop(
      `This MP3 is already about ${sourceKbps} kbps.`,
      `Pick a quality below ${sourceKbps} kbps to make the file smaller.`,
    );
  }
  await loadMp3Encoder();
  const buffer = await convertTo(
    file,
    new Mp3OutputFormat(),
    {
      video: { discard: true },
      audio: {
        codec: "mp3",
        quality: new Quality({ bitrate: kbps * 1000 }),
        forceTranscode: true,
      },
    },
    (value) => post({ type: "progress", value, note: "Making the MP3" }),
  );
  const same = source.codec === "mp3";
  finish(
    file,
    buffer,
    same ? "compressed" : "",
    [
      same
        ? `Re-encoded from about ${sourceKbps} kbps to ${kbps} kbps.`
        : `Encoded as MP3 at ${kbps} kbps.`,
      `Length ${clock(source.durationSeconds)}.`,
    ],
    "mp3",
  );
}

async function runTrimAudio(file: File, start: number, end: number) {
  post({ type: "progress", value: 0, note: "Reading the file" });
  const source = await readAudio(file);
  const last = source.durationSeconds;
  if (start >= last) {
    throw new Stop(
      `The start time is past the end of the audio, which is ${clock(last)} long.`,
      "Type an earlier start time.",
    );
  }
  const stop = Math.min(end, last);
  const kept = `Kept ${clock(start)} to ${clock(stop)} of ${clock(last)}.`;
  const progress = (value: number) =>
    post({ type: "progress", value, note: "Trimming" });
  const trim = { start, end: stop };

  // Keep the format when the sound can be copied as it is.
  let format: OutputFormat | null = null;
  let extension: "mp3" | "m4a" | "wav" = "mp3";
  if (source.codec === "mp3") {
    format = new Mp3OutputFormat();
  } else if (source.codec === "aac") {
    format = mp4();
    extension = "m4a";
  } else if (source.codec.startsWith("pcm")) {
    format = new WavOutputFormat();
    extension = "wav";
  }

  if (format) {
    try {
      const buffer = await convertTo(
        file,
        format,
        {
          video: { discard: true },
          audio: {},
          trim,
          // Only accept a true copy here. Formats like MP3 carry no start
          // time, so the copied sound may be shifted to begin at zero.
          copy: { mode: "forced", shiftTolerance: Infinity },
        },
        progress,
      );
      finish(
        file,
        buffer,
        "trimmed",
        [kept, "The sound was copied with no quality loss."],
        extension,
      );
      return;
    } catch (error) {
      // A copy was not possible for this file. Re-encode it below instead.
      if (!(error instanceof Stop)) throw error;
    }
  }

  if (!source.decodable) throw cannotDecodeSound(source.codec);
  await loadMp3Encoder();
  const buffer = await convertTo(
    file,
    new Mp3OutputFormat(),
    {
      video: { discard: true },
      audio: {
        codec: "mp3",
        quality: new Quality({ bitrate: 192_000 }),
        forceTranscode: true,
      },
      trim,
    },
    progress,
  );
  finish(
    file,
    buffer,
    "trimmed",
    [
      kept,
      `Saved as MP3 at 192 kbps, because this ${source.codec.toUpperCase()} sound could not be cut without re-encoding.`,
    ],
    "mp3",
  );
}

// ---- GIF ----

const MAX_GIF_SECONDS = 30;

async function runVideoToGif(
  file: File,
  range: { start: number; end: number } | undefined,
  wantedWidth: number,
  fps: number,
) {
  post({ type: "progress", value: 0, note: "Reading the video" });
  const { GifWriter } = await import("./gif");
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });
  try {
    const video = await input.getPrimaryVideoTrack();
    if (!video) {
      throw new Stop(
        "This file has no video in it.",
        "Choose a file that contains a video track.",
      );
    }
    if (!(await video.canDecode())) {
      const codec = (await video.getCodec()) ?? "unknown";
      throw new Stop(
        `This browser cannot read the ${codec.toUpperCase()} video in this file.`,
        "Try a different browser, or convert the file to MP4 first.",
      );
    }
    const length = await input.computeDuration();
    const start = Math.min(range?.start ?? 0, length);
    const end = Math.min(range?.end ?? length, length);
    const seconds = end - start;
    if (seconds <= 0) {
      throw new Stop(
        `The start time is past the end of the video, which is ${clock(length)} long.`,
        "Type an earlier start time.",
      );
    }
    if (seconds > MAX_GIF_SECONDS + 0.05) {
      throw new Stop(
        `That part is ${Math.round(seconds)} seconds long. A GIF here can be up to ${MAX_GIF_SECONDS} seconds.`,
        "Set the start and end closer together. Long GIFs get very large.",
      );
    }

    const sourceWidth = await video.getDisplayWidth();
    const sourceHeight = await video.getDisplayHeight();
    const width = Math.min(wantedWidth, sourceWidth);
    const height = Math.max(1, Math.round((sourceHeight * width) / sourceWidth));

    const times: number[] = [];
    for (let time = start; time < end - 0.001; time += 1 / fps) times.push(time);

    const sink = new CanvasSink(video, {
      width,
      height,
      fit: "fill",
      poolSize: 1,
    });
    const writer = new GifWriter(width, height, 256, 9);
    for await (const wrapped of sink.canvasesAtTimestamps(times)) {
      if (!wrapped) continue;
      const context = (wrapped.canvas as OffscreenCanvas).getContext("2d");
      if (!context) throw new Error("Could not read a video frame.");
      writer.add(context.getImageData(0, 0, width, height).data, 1000 / fps);
      post({
        type: "progress",
        value: writer.frames / times.length,
        note: "Making the GIF",
      });
    }
    if (writer.frames === 0) throw new Error("No frames could be read.");

    finish(
      file,
      writer.finish() as Uint8Array<ArrayBuffer>,
      "",
      [
        `${writer.frames} frames at ${fps} per second, ${width} by ${height} pixels.`,
        `Made from ${clock(start)} to ${clock(end)}.`,
      ],
      "gif",
    );
  } finally {
    input.dispose();
  }
}

async function runCompressGif(file: File, level: string) {
  post({ type: "progress", value: 0, note: "Reading the GIF" });
  const { GifWriter, readGif } = await import("./gif");
  const settings =
    level === "strong"
      ? { scale: 0.5, colors: 64, step: 2, tolerance: 18 }
      : level === "light"
        ? { scale: 1, colors: 128, step: 1, tolerance: 9 }
        : { scale: 0.75, colors: 128, step: 1, tolerance: 12 };

  const gif = readGifOrStop(readGif, await file.arrayBuffer());
  const width = Math.max(1, Math.round(gif.info.width * settings.scale));
  const height = Math.max(1, Math.round(gif.info.height * settings.scale));
  const small = new OffscreenCanvas(width, height);
  const context = small.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot draw the GIF.");

  const writer = new GifWriter(width, height, settings.colors, settings.tolerance);
  for (const frame of gif.frames()) {
    // A kept frame is shown for the time of the frames skipped after it,
    // so the animation runs at the same speed.
    if (frame.number % settings.step !== 0) continue;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(gif.canvas, 0, 0, width, height);
    writer.add(
      context.getImageData(0, 0, width, height).data,
      frame.delayMs * settings.step,
    );
    post({
      type: "progress",
      value: (frame.number + 1) / gif.info.frameCount,
      note: "Compressing the GIF",
    });
  }

  const bytes = writer.finish() as Uint8Array<ArrayBuffer>;
  const details = [
    `${writer.frames} frames, ${width} by ${height} pixels, up to ${settings.colors} colors.`,
  ];
  if (bytes.byteLength >= file.size) {
    details.push(
      "The result is not smaller. This GIF was already tightly packed. Try a stronger level.",
    );
  }
  finish(file, bytes, "compressed", details, "gif");
}

type ReadGif = typeof import("./gif").readGif;

function readGifOrStop(readGif: ReadGif, buffer: ArrayBuffer) {
  try {
    return readGif(buffer);
  } catch {
    throw new Stop(
      "This file could not be read as a GIF.",
      "It may be damaged, or it may be another kind of image with a .gif name.",
    );
  }
}

async function runGifToMp4(file: File) {
  requireWebCodecs();
  post({ type: "progress", value: 0, note: "Reading the GIF" });
  const { readGif } = await import("./gif");
  const gif = readGifOrStop(readGif, await file.arrayBuffer());

  // H.264 needs even sizes.
  const width = Math.max(2, Math.floor(gif.info.width / 2) * 2);
  const height = Math.max(2, Math.floor(gif.info.height / 2) * 2);
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot draw the GIF.");

  // About a tenth of a bit per pixel per frame at 25 frames per second.
  const bitrate = Math.min(
    8_000_000,
    Math.max(300_000, Math.round(width * height * 25 * 0.1)),
  );
  const quality = new Quality({ bitrate });
  if (!(await canEncodeVideo("avc", { width, height, quality }))) {
    throw new Stop(
      "This browser cannot make H.264 video at this GIF's size.",
      "Use a current version of Chrome, Edge or Safari.",
    );
  }

  const target = new BufferTarget();
  const output = new Output({ format: mp4(), target });
  const source = new CanvasSource(canvas, { codec: "avc", quality });
  output.addVideoTrack(source);
  await output.start();

  let time = 0;
  let count = 0;
  for (const frame of gif.frames()) {
    // MP4 has no transparency, so see-through areas become white.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(gif.canvas, 0, 0, width, height);
    const seconds = frame.delayMs / 1000;
    await source.add(time, seconds);
    time += seconds;
    count++;
    post({
      type: "progress",
      value: count / gif.info.frameCount,
      note: "Making the MP4",
    });
  }
  await output.finalize();
  if (!target.buffer) throw new Error("The encoder returned no data.");

  finish(file, target.buffer, "", [
    `${count} frames, ${width} by ${height} pixels, ${clock(time)} long.`,
    "No sound. The MP4 plays once unless your player loops it.",
  ]);
}

// ---- Dispatch ----

async function run(file: File, job: EngineJob) {
  const { preset, settings, range } = job;

  if (preset.kind === "target-size") {
    requireWebCodecs();
    return runTargetSize(file, job.targetBytes ?? preset.targetBytes);
  }
  if (preset.kind === "mute") {
    requireWebCodecs();
    return runMute(file);
  }
  if (preset.kind === "trim") {
    if (!range) throw new Error("No start and end were given.");
    if (preset.media === "audio") {
      return runTrimAudio(file, range.start, range.end);
    }
    requireWebCodecs();
    return runTrim(file, range.start, range.end);
  }
  if (preset.kind === "compress-gif") {
    return runCompressGif(file, settings.level ?? "medium");
  }
  if (preset.kind === "convert") {
    if (preset.outputFormat === "mp3") {
      return runToMp3(file, Number(settings.bitrate ?? 192));
    }
    if (preset.outputFormat === "gif") {
      requireWebCodecs();
      return runVideoToGif(
        file,
        range,
        Number(settings.width ?? 480),
        Number(settings.fps ?? 12.5),
      );
    }
    if (preset.from === "gif") return runGifToMp4(file);
    requireWebCodecs();
    return runConvert(file);
  }
  throw new Error(`This engine has no job called ${preset.kind}.`);
}

// A crash outside the job's own error handling would otherwise leave the
// page waiting with no message.
self.addEventListener("unhandledrejection", (event) => {
  const reason: unknown = event.reason;
  post({
    type: "error",
    message: "The tool stopped because of an unexpected problem.",
    hint: `Reload the page and try again. Technical detail: ${reason instanceof Error ? reason.message : String(reason)}`,
  });
});

self.onmessage = (event: MessageEvent<EngineRequest>) => {
  const { file, job } = event.data;
  run(file, job).catch((error: unknown) => {
    if (error instanceof Stop) {
      post({ type: "error", message: error.message, hint: error.hint });
      return;
    }
    const detail = error instanceof Error ? error.message : String(error);
    post({
      type: "error",
      message: "The file could not be processed.",
      hint: `Try again, or try a different browser. Technical detail: ${detail}`,
    });
  });
};

export {};
