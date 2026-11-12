import { pageFileName, parsePageList } from "./pages";
import type { EngineJob, EngineMessage, EngineRequest } from "./types";

// Merge and split PDFs. Pages are copied as they are, so text stays
// selectable and nothing is redrawn. PDF to JPG runs on the page instead,
// see pdfRender.ts.

const post = (message: EngineMessage) => self.postMessage(message);

class Stop extends Error {
  hint: string;
  constructor(message: string, hint: string) {
    super(message);
    this.hint = hint;
  }
}

const MAX_MERGE_FILES = 50;

async function load(file: File) {
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    const text = error instanceof Error ? `${error.name} ${error.message}` : "";
    if (/encrypt/i.test(text)) {
      throw new Stop(
        `${file.name} is protected with a password.`,
        "Remove the password in your PDF app, save a copy, then try again.",
      );
    }
    throw new Stop(
      `${file.name} could not be read as a PDF.`,
      "It may be damaged. Open it in a PDF app, save a new copy, and try that.",
    );
  }
}

const baseName = (file: File) => file.name.replace(/\.[^.]+$/, "") || "document";

async function merge(files: File[]) {
  if (files.length < 2) {
    throw new Stop("Add at least one more PDF to merge.", "Press Add more files.");
  }
  if (files.length > MAX_MERGE_FILES) {
    throw new Stop(
      `You picked ${files.length} PDFs. Up to ${MAX_MERGE_FILES} can be merged at once.`,
      "Remove some files, or merge in two rounds.",
    );
  }
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const merged = await PDFDocument.create();
  for (let index = 0; index < files.length; index++) {
    post({
      type: "progress",
      value: index / files.length,
      note: `Adding file ${index + 1} of ${files.length}`,
    });
    const source = await load(files[index]);
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }
  post({ type: "progress", value: 0.97, note: "Writing the PDF" });
  const bytes = await merged.save();
  post({
    type: "done",
    blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    fileName: "merged.pdf",
    details: [
      `${files.length} files joined into ${merged.getPageCount()} pages.`,
      "Pages were copied as they are, so text stays selectable.",
    ],
  });
}

async function split(file: File, mode: string, pageText: string) {
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  post({ type: "progress", value: 0.05, note: "Reading the PDF" });
  const source = await load(file);
  const count = source.getPageCount();

  if (mode === "pick") {
    const list = parsePageList(pageText, count);
    if (!list.ok) throw new Stop(list.message, "Fix the pages field and try again.");
    const out = await PDFDocument.create();
    const pages = await out.copyPages(
      source,
      list.pages.map((page) => page - 1),
    );
    for (const page of pages) out.addPage(page);
    const bytes = await out.save();
    post({
      type: "done",
      blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
      fileName: `${baseName(file)}-selected.pdf`,
      details: [
        `${list.pages.length} of ${count} pages kept, in the order typed.`,
      ],
    });
    return;
  }

  if (count < 2) {
    throw new Stop(
      "This PDF has only one page, so there is nothing to split.",
      "Choose a PDF with more than one page.",
    );
  }
  const { zipStore } = await import("./pack");
  const files: { name: string; data: Uint8Array }[] = [];
  for (let index = 0; index < count; index++) {
    post({
      type: "progress",
      value: index / count,
      note: `Page ${index + 1} of ${count}`,
    });
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(source, [index]);
    out.addPage(page);
    files.push({ name: pageFileName(index + 1, "pdf"), data: await out.save() });
  }
  post({
    type: "done",
    blob: new Blob([zipStore(files)], { type: "application/zip" }),
    fileName: `${baseName(file)}-pages.zip`,
    details: [`${count} PDFs, one per page, in one ZIP file.`],
  });
}

async function run(file: File, files: File[], job: EngineJob) {
  const { preset, settings } = job;
  if (preset.kind !== "pdf") {
    throw new Error(`The PDF engine has no job called ${preset.kind}.`);
  }
  if (preset.operation === "merge") return merge(files);
  if (preset.operation === "split") {
    return split(file, settings.mode ?? "each", settings.pages ?? "");
  }
  throw new Error(`The PDF engine cannot do ${preset.operation}.`);
}

self.addEventListener("unhandledrejection", (event) => {
  const reason: unknown = event.reason;
  post({
    type: "error",
    message: "The tool stopped because of an unexpected problem.",
    hint: `Reload the page and try again. Technical detail: ${reason instanceof Error ? reason.message : String(reason)}`,
  });
});

self.onmessage = (event: MessageEvent<EngineRequest>) => {
  const { file, files, job } = event.data;
  run(file, files ?? [file], job).catch((error: unknown) => {
    if (error instanceof Stop) {
      post({ type: "error", message: error.message, hint: error.hint });
      return;
    }
    const detail = error instanceof Error ? error.message : String(error);
    post({
      type: "error",
      message: "The PDF could not be processed.",
      hint: `Try again, or try a different browser. Technical detail: ${detail}`,
    });
  });
};

export {};
