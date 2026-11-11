import type { Engine } from "../tools";

// Until the real engines are built, every tool runs the fake engine.
export const USING_FAKE_ENGINE = true;

// The worker script is its own chunk. The browser only downloads it when
// this function runs, which is after the visitor picks a file and starts.
export function createEngineWorker(engine: Engine): Worker {
  void engine;
  return new Worker(new URL("./fake.worker.ts", import.meta.url), {
    type: "module",
  });
}
