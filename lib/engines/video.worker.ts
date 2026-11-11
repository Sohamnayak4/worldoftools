import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  type ConversionAudioOptions,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  canEncodeAudio,
  canEncodeVideo,
} from "mediabunny";
import type { EngineMessage, EngineRequest } from "./types";
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

async function encodeOnce(
  file: File,
  plan: VideoPlan,
  sourceFrameRate: number,
  onProgress: (value: number) => void,
): Promise<ArrayBuffer> {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });
  const target = new BufferTarget();
  const output = new Output({
    // Metadata at the start, so the result plays right away when shared.
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  });

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

  try {
    const conversion = await Conversion.init({
      input,
      output,
      tracks: "primary",
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
      showWarnings: false,
    });

    const lost = conversion.discardedTracks.filter(
      (item) => item.reason !== "discarded_by_user",
    );
    if (!conversion.isValid || lost.length > 0) {
      const kinds = lost.map((item) => item.track.type).join(" and ");
      throw new Stop(
        `This browser cannot convert the ${kinds || "video"} in this file.`,
        "Update your browser, or try Chrome or Safari on a newer device.",
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

async function run(file: File, targetBytes: number) {
  if (typeof VideoEncoder === "undefined" || typeof VideoDecoder === "undefined") {
    throw new Stop(
      "This browser cannot compress video.",
      "Use a current version of Chrome, Edge or Safari. Firefox on Android is not supported yet.",
    );
  }

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
  const base = file.name.replace(/\.[^.]+$/, "") || "video";
  post({
    type: "done",
    blob: new Blob([best.buffer], { type: "video/mp4" }),
    fileName: `${base}-compressed.mp4`,
    details: describe(best.plan, source),
  });
}

self.onmessage = (event: MessageEvent<EngineRequest>) => {
  const { file, options } = event.data;
  run(file, options.targetBytes ?? file.size).catch((error: unknown) => {
    if (error instanceof Stop) {
      post({ type: "error", message: error.message, hint: error.hint });
      return;
    }
    const detail = error instanceof Error ? error.message : String(error);
    post({
      type: "error",
      message: "The video could not be compressed.",
      hint: `Try again, or try a different browser. Technical detail: ${detail}`,
    });
  });
};

export {};
