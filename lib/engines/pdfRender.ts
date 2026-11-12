import { EngineCancelled, EngineError } from "./runner";
import { pageFileName, parsePageList } from "./pages";
import type { EngineResult } from "./types";

// PDF to JPG. PDF.js reads the file in its own worker, and each page is
// drawn on a canvas here, one at a time, with a pause between pages so the
// page stays responsive. PDF.js draws to an on-page canvas, so this part
// cannot run inside our own worker.

const MAX_PAGES = 100;
const MAX_PIXELS = 16_000_000;

export async function pdfToJpg(
  file: File,
  settings: Record<string, string>,
  signal: AbortSignal,
  onProgress: (value: number, note?: string) => void,
): Promise<EngineResult> {
  onProgress(0.02, "Loading the PDF reader");
  // This module also starts the PDF.js worker. It is loaded only now.
  const pdfjs = await import("pdfjs-dist/webpack.mjs");
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });

  let pdf: Awaited<typeof task.promise>;
  try {
    pdf = await task.promise;
  } catch (error) {
    await task.destroy();
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") {
      throw new EngineError(
        "This PDF is protected with a password.",
        "Remove the password in your PDF app, save a copy, then try again.",
      );
    }
    throw new EngineError(
      "This file could not be read as a PDF.",
      "It may be damaged. Open it in a PDF app, save a new copy, and try that.",
    );
  }

  try {
    const count = pdf.numPages;
    let pages: number[];
    const typed = (settings.pages ?? "").trim();
    if (typed === "") {
      pages = Array.from({ length: count }, (_, index) => index + 1);
    } else {
      const list = parsePageList(typed, count);
      if (!list.ok) throw new EngineError(list.message, "Fix the pages field and try again.");
      pages = list.pages;
    }
    if (pages.length > MAX_PAGES) {
      throw new EngineError(
        `That is ${pages.length} pages. Up to ${MAX_PAGES} can be converted at once.`,
        `Type a range in the Pages field, like 1-${MAX_PAGES}, and do the rest after.`,
      );
    }

    const dpi = Number(settings.dpi ?? 150);
    const outputs: { name: string; data: Uint8Array }[] = [];
    let shrunk = false;
    let single: Blob | null = null;

    for (let index = 0; index < pages.length; index++) {
      if (signal.aborted) throw new EngineCancelled();
      const number = pages[index];
      onProgress(index / pages.length, `Page ${index + 1} of ${pages.length}`);

      const page = await pdf.getPage(number);
      let scale = dpi / 72;
      let viewport = page.getViewport({ scale });
      const pixels = viewport.width * viewport.height;
      if (pixels > MAX_PIXELS) {
        scale *= Math.sqrt(MAX_PIXELS / pixels);
        viewport = page.getViewport({ scale });
        shrunk = true;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      // "print" draws the page as it would print, and does not wait for
      // animation frames, so a conversion keeps going in a background tab.
      await page.render({
        canvas,
        viewport,
        intent: "print",
        background: "#ffffff",
      }).promise;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      page.cleanup();
      // Frees the canvas memory now instead of waiting for the browser.
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) throw new EngineError("A page could not be saved as JPG.", "Try a lower resolution.");
      if (pages.length === 1) single = blob;
      else outputs.push({ name: pageFileName(number, "jpg"), data: new Uint8Array(await blob.arrayBuffer()) });

      // Give the page a moment to respond between pages.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const base = file.name.replace(/\.[^.]+$/, "") || "document";
    const details = [
      pages.length === 1
        ? `Page ${pages[0]} at ${dpi} DPI.`
        : `${pages.length} pages at ${dpi} DPI, in one ZIP file.`,
    ];
    if (shrunk) details.push("Some pages were reduced to stay under about 16 million pixels.");

    if (single) {
      return {
        blob: single,
        fileName: count === 1 ? `${base}.jpg` : `${base}-page-${pages[0]}.jpg`,
        details,
      };
    }
    const { zipStore } = await import("./pack");
    return {
      blob: new Blob([zipStore(outputs)], { type: "application/zip" }),
      fileName: `${base}-jpg.zip`,
      details,
    };
  } finally {
    // Ends the document and frees its memory in the PDF.js worker.
    await task.destroy();
  }
}
