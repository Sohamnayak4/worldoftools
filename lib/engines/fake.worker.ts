import type { EngineMessage, EngineRequest } from "./types";

// A stand-in engine for testing the tool shell. It waits 3 seconds, reports
// progress, and returns the file unchanged.

const post = (message: EngineMessage) => self.postMessage(message);
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

self.onmessage = async (event: MessageEvent<EngineRequest>) => {
  const { file, job } = event.data;
  const fail = job.fakeFail === true;
  const steps = 30;
  for (let step = 1; step <= steps; step++) {
    await sleep(100);
    if (fail && step === steps / 2) {
      post({
        type: "error",
        message: "The test engine failed on purpose.",
        hint: "Remove ?fake=fail from the address and try again.",
      });
      return;
    }
    post({ type: "progress", value: step / steps });
  }
  post({ type: "done", blob: file, fileName: file.name });
};

export {};
