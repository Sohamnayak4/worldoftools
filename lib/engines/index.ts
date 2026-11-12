import type { Engine } from "../tools";

// Engines that are built. The rest still run the fake engine.
export function isFakeEngine(engine: Engine): boolean {
  return engine !== "video" && engine !== "image" && engine !== "pdf";
}

// Each worker script is its own chunk. The browser only downloads it when
// this function runs, which is after the visitor picks a file and starts.
export function createEngineWorker(engine: Engine): Worker {
  if (engine === "video") {
    return new Worker(new URL("./video.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  if (engine === "pdf") {
    return new Worker(new URL("./pdf.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  if (engine === "image") {
    return new Worker(new URL("./image.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return new Worker(new URL("./fake.worker.ts", import.meta.url), {
    type: "module",
  });
}
