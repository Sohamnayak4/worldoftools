// Target-size planning for video. Pure functions, no browser APIs, so the
// maths can be read and tested on its own.
//
// The idea: a file's size is bitrate times duration. So the bitrate that
// fits is the target size divided by the duration, minus a safety margin
// and minus what the sound needs. When that leaves too few bits per pixel
// for a clean picture, the picture is made smaller.

export type VideoSource = {
  durationSeconds: number;
  // Size as shown on screen, after rotation.
  width: number;
  height: number;
  frameRate: number;
  // Average bits per second of the whole file.
  totalBitrate: number;
  audio: null | {
    isAac: boolean;
    bitrate: number;
    // Whether this browser can decode the sound at all.
    decodable: boolean;
    channels: number;
    sampleRate: number;
  };
};

export type AudioPlan =
  | { mode: "none" }
  // Keep the original sound track untouched. Needs no audio codec.
  | { mode: "copy"; bitrate: number }
  | { mode: "encode"; bitrate: number };

export type VideoPlan = {
  videoBitrate: number;
  width: number;
  height: number;
  frameRate: number;
  // True when the picture is made smaller than the original.
  downscaled: boolean;
  audio: AudioPlan;
};

export type PlanResult =
  | { ok: true; plan: VideoPlan }
  | { ok: false; message: string; hint: string };

// Aim this far under the target on the first try. Encoders overshoot.
export const SAFETY_MARGIN = 0.94;
// Bits per pixel per frame below which H.264 looks blocky.
const MIN_BITS_PER_PIXEL = 0.055;
// Below this even the smallest picture is not worth making.
const FLOOR_BITS_PER_PIXEL = 0.02;
const MIN_VIDEO_BITRATE = 80_000;
// Short-side sizes to step down through.
const LADDER = [2160, 1440, 1080, 720, 540, 480, 360, 240];
const AUDIO_STEPS = [128_000, 96_000, 64_000, 48_000, 32_000];
const MAX_FRAME_RATE = 30;

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

export function planVideo(
  source: VideoSource,
  targetBytes: number,
  // 1 on the first try. Lower on retries, from the measured overshoot.
  correction: number,
  canEncodeAac: boolean,
): PlanResult {
  const duration = Math.max(source.durationSeconds, 0.1);
  let totalBitrate =
    ((targetBytes * 8) / duration) * SAFETY_MARGIN * correction;
  // Never spend more bits than the original has. That only adds size.
  totalBitrate = Math.min(totalBitrate, source.totalBitrate);

  const tooSmall: PlanResult = {
    ok: false,
    message: "That target is too small for a video this long.",
    hint: "Type a larger target, or trim the video to a shorter clip first.",
  };

  // Sound gets at most 15% of the bits.
  let audio: AudioPlan = { mode: "none" };
  if (source.audio) {
    const wanted = AUDIO_STEPS.find((step) => step <= totalBitrate * 0.15);
    const original = source.audio.bitrate;
    if (source.audio.isAac && wanted && original <= wanted * 1.1) {
      audio = { mode: "copy", bitrate: original };
    } else if (wanted && canEncodeAac) {
      audio = { mode: "encode", bitrate: Math.min(wanted, original) };
    } else if (source.audio.isAac && original <= totalBitrate * 0.35) {
      // This browser cannot re-encode sound, but the original still fits.
      audio = { mode: "copy", bitrate: original };
    } else if (!wanted) {
      return tooSmall;
    } else {
      return {
        ok: false,
        message: "This browser cannot shrink the sound in this video.",
        hint: "Update your browser or phone software, or type a larger target.",
      };
    }
  }

  const audioBitrate = audio.mode === "none" ? 0 : audio.bitrate;
  const videoBitrate = Math.floor(totalBitrate - audioBitrate);
  if (videoBitrate < MIN_VIDEO_BITRATE) return tooSmall;

  const frameRate = Math.min(source.frameRate || MAX_FRAME_RATE, MAX_FRAME_RATE);
  const shortSide = Math.min(source.width, source.height);
  const pixelsAt = (side: number) =>
    source.width * source.height * (side / shortSide) ** 2;
  const bitsPerPixel = (side: number) =>
    videoBitrate / (pixelsAt(side) * frameRate);

  // The original size first, then each smaller step.
  const candidates = [
    shortSide,
    ...LADDER.filter((side) => side < shortSide),
  ];
  let chosen = candidates.find(
    (side) => bitsPerPixel(side) >= MIN_BITS_PER_PIXEL,
  );
  if (chosen === undefined) {
    const smallest = candidates[candidates.length - 1];
    if (bitsPerPixel(smallest) < FLOOR_BITS_PER_PIXEL) return tooSmall;
    chosen = smallest;
  }

  const scale = chosen / shortSide;
  return {
    ok: true,
    plan: {
      videoBitrate,
      width: even(source.width * scale),
      height: even(source.height * scale),
      frameRate,
      downscaled: chosen < shortSide,
      audio,
    },
  };
}

// After an encode that came out too big, how much lower to aim next time.
export function nextCorrection(
  previous: number,
  actualBytes: number,
  targetBytes: number,
): number {
  return previous * (targetBytes / actualBytes) * 0.96;
}
