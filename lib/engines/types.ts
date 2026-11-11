// Messages between the page and an engine worker.

export type EngineOptions = {
  // The size the output must fit under, for target-size tools.
  targetBytes?: number;
  // Test switch for the fake engine. Makes it fail halfway.
  fakeFail?: boolean;
};

export type EngineRequest = {
  type: "start";
  file: File;
  options: EngineOptions;
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
