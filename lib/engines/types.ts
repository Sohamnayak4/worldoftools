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
  // `value` runs from 0 to 1.
  | { type: "progress"; value: number }
  | { type: "done"; blob: Blob; fileName: string }
  // `message` says what went wrong. `hint` says what to do next.
  | { type: "error"; message: string; hint: string };

export type EngineResult = { blob: Blob; fileName: string };
