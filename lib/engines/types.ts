import type { Preset } from "../tools";

// Messages between the page and an engine worker.

// What the engine should do with the file. The preset comes straight from
// the tool registry. The rest is what the visitor chose.
export type EngineJob = {
  preset: Preset;
  // The size the output must fit under, for target-size tools.
  targetBytes?: number;
  // Part of the file to keep, in seconds.
  range?: { start: number; end: number };
  // Output size in pixels, for resize tools.
  size?: { width: number; height: number };
  // Part of the picture to keep, in the picture's own pixels.
  crop?: { x: number; y: number; width: number; height: number };
  // Exact output size and file size range, for photo spec tools.
  output?: {
    width: number;
    height: number;
    minBytes?: number;
    maxBytes?: number;
  };
  // Values of the tool's dropdown options, by option id.
  settings: Record<string, string>;
  // Test switch for the fake engine. Makes it fail halfway.
  fakeFail?: boolean;
};

export type EngineRequest = {
  type: "start";
  file: File;
  // Every picked file, in order, for tools that take several.
  files?: File[];
  job: EngineJob;
  // A picture already decoded on the page, for formats a worker cannot
  // open, such as SVG.
  bitmap?: ImageBitmap;
};

export type EngineMessage =
  // `value` runs from 0 to 1. `note` is a short line about the current step.
  | { type: "progress"; value: number; note?: string }
  // `details` are short plain lines about what was done to the file.
  | { type: "done"; blob: Blob; fileName: string; details?: string[] }
  // `message` says what went wrong. `hint` says what to do next.
  | { type: "error"; message: string; hint: string };

export type EngineResult = {
  blob: Blob;
  fileName: string;
  details: string[];
};
