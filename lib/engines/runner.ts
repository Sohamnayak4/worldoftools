import type {
  EngineJob,
  EngineMessage,
  EngineRequest,
  EngineResult,
} from "./types";

// Runs one job in a Web Worker so the page never freezes.
// Each job gets a fresh worker. Cancel stops the worker at once.

const START_TIMEOUT_MS = 20_000;

export class EngineError extends Error {
  hint: string;
  constructor(message: string, hint: string) {
    super(message);
    this.name = "EngineError";
    this.hint = hint;
  }
}

export class EngineCancelled extends Error {
  constructor() {
    super("Cancelled");
    this.name = "EngineCancelled";
  }
}

export type EngineRun = {
  result: Promise<EngineResult>;
  cancel: () => void;
};

// Runs a job on the page instead of in a worker, for libraries that need
// the page, such as PDF.js drawing to a canvas. Same shape as runEngine.
export function runOnPage(
  task: (
    signal: AbortSignal,
    onProgress: (value: number, note?: string) => void,
  ) => Promise<EngineResult>,
  onProgress: (value: number, note?: string) => void,
): EngineRun {
  const controller = new AbortController();
  let rejectCancel: ((error: Error) => void) | null = null;
  const cancelled = new Promise<never>((_, reject) => {
    rejectCancel = reject;
  });
  const result = Promise.race([
    task(controller.signal, (value, note) => {
      if (!controller.signal.aborted) {
        onProgress(Math.max(0, Math.min(1, value)), note);
      }
    }),
    cancelled,
  ]);
  return {
    result,
    cancel: () => {
      controller.abort();
      rejectCancel?.(new EngineCancelled());
    },
  };
}

export function runEngine(
  createWorker: () => Worker,
  file: File,
  job: EngineJob,
  onProgress: (value: number, note?: string) => void,
  bitmap?: ImageBitmap,
  files?: File[],
): EngineRun {
  let worker: Worker | null = null;
  let settle: ((error: Error) => void) | null = null;
  // Every engine reports as soon as it starts. If nothing arrives in this
  // time, the worker script failed to load or crashed while starting, which
  // browsers do not always report. Without this the page would wait forever.
  let startTimer: ReturnType<typeof setTimeout> | null = null;

  const result = new Promise<EngineResult>((resolve, reject) => {
    const finish = () => {
      if (startTimer) clearTimeout(startTimer);
      startTimer = null;
      worker?.terminate();
      worker = null;
      settle = null;
    };
    settle = (error) => {
      finish();
      reject(error);
    };

    try {
      worker = createWorker();
    } catch {
      settle(
        new EngineError(
          "This browser could not start the tool.",
          "Update your browser or try a different one.",
        ),
      );
      return;
    }

    worker.onmessage = (event: MessageEvent<EngineMessage>) => {
      const message = event.data;
      if (startTimer) clearTimeout(startTimer);
      startTimer = null;
      if (message.type === "progress") {
        onProgress(Math.max(0, Math.min(1, message.value)), message.note);
      } else if (message.type === "done") {
        finish();
        resolve({
          blob: message.blob,
          fileName: message.fileName,
          details: message.details ?? [],
        });
      } else if (message.type === "error") {
        settle?.(new EngineError(message.message, message.hint));
      }
    };

    // Fires when the worker script fails to load or throws.
    worker.onerror = () => {
      settle?.(
        new EngineError(
          navigator.onLine
            ? "The tool stopped because of an unexpected problem."
            : "The tool could not load because you are offline.",
          navigator.onLine
            ? "Try again. If it keeps failing, reload the page."
            : "Check your connection and try again.",
        ),
      );
    };

    const request: EngineRequest = { type: "start", file, files, job, bitmap };
    // The decoded picture is handed over, not copied.
    worker.postMessage(request, bitmap ? [bitmap] : []);
    startTimer = setTimeout(() => {
      settle?.(
        new EngineError(
          navigator.onLine
            ? "The tool did not start."
            : "The tool could not load because you are offline.",
          navigator.onLine
            ? "Reload the page and try again. If it keeps happening, try a different browser."
            : "Check your connection and try again.",
        ),
      );
    }, START_TIMEOUT_MS);
  });

  return {
    result,
    cancel: () => settle?.(new EngineCancelled()),
  };
}
