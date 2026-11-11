"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LimitGauge } from "./LimitGauge";
import { TrimFields, type TrimRange } from "./TrimFields";
import { createEngineWorker, isFakeEngine } from "@/lib/engines";
import {
  EngineCancelled,
  EngineError,
  type EngineRun,
  runEngine,
} from "@/lib/engines/runner";
import { KB, MB, formatBytes } from "@/lib/format";
import type { EngineJob } from "@/lib/engines/types";
import type { Engine, FileInput, Preset, ToolOption } from "@/lib/tools";

// The shared shell every file tool uses: pick a file, see it against the
// limit, run the engine in a worker, then download the result.

type ToolShellProps = {
  engine: Engine;
  input: FileInput;
  actionLabel: string;
  // What the tool does. Target-size presets also drive the gauge.
  preset: Preset;
  // Dropdowns shown after a file is picked.
  options?: ToolOption[];
  // Set when the visitor picks a start and end with a preview player.
  range?: { media: "video" | "audio" };
};

type Phase =
  | { name: "idle" }
  // `previewUrl` is set for tools that show the video, like trim.
  | { name: "picked"; file: File; note?: string; previewUrl?: string }
  | { name: "working"; file: File; progress: number; note?: string }
  | {
      name: "done";
      file: File;
      size: number;
      fileName: string;
      url: string;
      details: string[];
      seconds: number;
    }
  // `file` is kept when trying again with the same file makes sense.
  | { name: "error"; message: string; hint: string; file?: File };

type Problem = { message: string; hint: string };

// Phones get a lower cap. Long jobs drain the battery and the browser may
// stop a tab that works for too long.
function isPhone(): boolean {
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    Math.min(window.screen.width, window.screen.height) < 820
  );
}

function checkFile(file: File, input: FileInput): Problem | null {
  const name = file.name.toLowerCase();
  const typeOk =
    input.mimePrefixes.some((prefix) => file.type.startsWith(prefix)) ||
    input.extensions.some((extension) => name.endsWith(extension));
  if (!typeOk) {
    return {
      message: `That file is not ${input.article} ${input.noun}.`,
      hint: `Choose ${input.article} ${input.noun}, such as ${input.examples}.`,
    };
  }
  if (file.size === 0) {
    return {
      message: "That file is empty. It is 0 bytes.",
      hint: "It may not have finished downloading or saving. Choose a different file.",
    };
  }
  const phone = isPhone() && input.maxBytesPhone !== undefined;
  const cap = phone ? (input.maxBytesPhone as number) : input.maxBytes;
  if (file.size > cap) {
    return {
      message: `That file is ${formatBytes(file.size)}. This tool takes files up to ${formatBytes(cap)}${phone ? " on a phone" : ""}.`,
      hint: phone
        ? "Larger files take too long on a phone and the browser may stop the tab. Use a computer for this file, or choose a smaller one."
        : "Larger files take too long to process in a browser. Choose a smaller file.",
    };
  }
  return null;
}

function formatSeconds(seconds: number): string {
  if (seconds < 1.5) return "1 second";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${Math.round(seconds - minutes * 60)} s`;
}

function typeLabel(file: File): string {
  const dot = file.name.lastIndexOf(".");
  return dot > 0 ? file.name.slice(dot + 1).toUpperCase() : "File";
}

const primaryButton =
  "rounded-ctl bg-accent px-4 py-2.5 font-semibold text-on-accent no-underline hover:bg-text hover:text-bg disabled:bg-line disabled:text-muted";
const secondaryButton =
  "rounded-ctl border border-line px-4 py-2.5 hover:text-accent-ink";

export function ToolShell({
  engine,
  input,
  actionLabel,
  preset,
  options = [],
  range,
}: ToolShellProps) {
  const presetTargetBytes =
    preset.kind === "target-size" ? preset.targetBytes : undefined;
  const userCanSetTarget =
    preset.kind === "target-size" && preset.userCanSetTarget;
  const wantsTrim = range !== undefined;
  const hasTarget = presetTargetBytes !== undefined;
  const unit = (presetTargetBytes ?? MB) >= MB ? MB : KB;
  const unitLabel = unit === MB ? "MB" : "KB";

  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [targetText, setTargetText] = useState(
    hasTarget ? String(presetTargetBytes / unit) : "",
  );
  const [dragOver, setDragOver] = useState(false);
  const [trim, setTrim] = useState<TrimRange | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((option) => [option.id, option.defaultValue])),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<EngineRun | null>(null);
  const urlRef = useRef<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const firstRender = useRef(true);
  const targetId = useId();
  const targetErrorId = useId();
  const optionId = useId();

  const targetNumber = Number(targetText.replace(",", "."));
  const targetValid =
    !hasTarget ||
    (targetText.trim() !== "" &&
      Number.isFinite(targetNumber) &&
      targetNumber > 0);
  const targetBytes = !hasTarget
    ? undefined
    : targetValid
      ? Math.round(targetNumber * unit)
      : presetTargetBytes;

  function clearPreview() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
  }

  function pickFile(file: File) {
    clearPreview();
    setTrim(null);
    const problem = checkFile(file, input);
    if (problem) {
      setPhase({ name: "error", ...problem });
      return;
    }
    if (wantsTrim) previewRef.current = URL.createObjectURL(file);
    setPhase({
      name: "picked",
      file,
      previewUrl: previewRef.current ?? undefined,
    });
  }

  function clearResultUrl() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }

  function startOver() {
    clearResultUrl();
    clearPreview();
    setTrim(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPhase({ name: "idle" });
  }

  function start(file: File) {
    const fakeFail =
      new URLSearchParams(window.location.search).get("fake") === "fail";
    const job: EngineJob = {
      preset,
      targetBytes,
      range: trim ?? undefined,
      settings,
      fakeFail,
    };
    const previewUrl = previewRef.current ?? undefined;
    const startedAt = performance.now();
    setPhase({ name: "working", file, progress: 0 });
    const run = runEngine(
      () => createEngineWorker(engine),
      file,
      job,
      (value, note) =>
        setPhase((current) =>
          current.name === "working"
            ? { ...current, progress: value, note }
            : current,
        ),
    );
    runRef.current = run;
    run.result
      .then(({ blob, fileName, details }) => {
        clearResultUrl();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setPhase({
          name: "done",
          file,
          size: blob.size,
          fileName,
          url,
          details,
          seconds: (performance.now() - startedAt) / 1000,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof EngineCancelled) {
          setPhase({
            name: "picked",
            file,
            note: "Cancelled. Your file was not changed.",
            previewUrl,
          });
        } else if (error instanceof EngineError) {
          setPhase({
            name: "error",
            message: error.message,
            hint: error.hint,
            file,
          });
        } else {
          setPhase({
            name: "error",
            message: "Something went wrong while working on your file.",
            hint: "Try again. If it keeps failing, reload the page.",
            file,
          });
        }
      })
      .finally(() => {
        if (runRef.current === run) runRef.current = null;
      });
  }

  // The paste listener calls the latest pickFile through this ref.
  const pickFileRef = useRef(pickFile);
  useEffect(() => {
    pickFileRef.current = pickFile;
  });

  // Paste a file from the clipboard while no file is picked.
  useEffect(() => {
    if (phase.name !== "idle") return;
    function onPaste(event: ClipboardEvent) {
      const file = event.clipboardData?.files[0];
      if (!file) return;
      event.preventDefault();
      pickFileRef.current(file);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [phase.name]);

  // Move keyboard focus to the panel when its content changes, so the next
  // action is one Tab away.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    panelRef.current?.focus({ preventScroll: true });
  }, [phase.name]);

  // Stop any running job and free the result when leaving the page.
  useEffect(() => {
    return () => {
      runRef.current?.cancel();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  // Fixed heights per layout, so nothing below the tool moves between steps.
  let panelHeight = "min-h-[332px]";
  if (range?.media === "video") {
    panelHeight = options.length > 0 ? "min-h-[680px]" : "min-h-[520px]";
  } else if (range?.media === "audio") {
    panelHeight = "min-h-[410px]";
  } else if (options.length > 0) {
    panelHeight = "min-h-[360px]";
  }

  const canDrop = phase.name !== "working";
  const file = "file" in phase ? phase.file : undefined;
  const shownSize = phase.name === "done" ? phase.size : file?.size;

  let status = "";
  if (phase.name === "picked") {
    status = `${phase.file.name} picked. ${formatBytes(phase.file.size)}.`;
  } else if (phase.name === "working") {
    status = phase.note ? `${phase.note}.` : "Working.";
  } else if (phase.name === "done") {
    status = `Done. The result is ${formatBytes(phase.size)}.`;
  } else if (phase.name === "error") {
    status = `${phase.message} ${phase.hint}`;
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={input.accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked) pickFile(picked);
        }}
      />
      <p role="status" className="sr-only">
        {status}
      </p>

      {targetBytes !== undefined && (
        <div className="mb-3">
          <LimitGauge
            limitBytes={targetBytes}
            sizeBytes={shownSize}
            scaleBytes={file?.size}
          />
        </div>
      )}

      <div
        ref={panelRef}
        tabIndex={-1}
        onDragOver={(event) => {
          if (!canDrop) return;
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          if (!canDrop) return;
          event.preventDefault();
          setDragOver(false);
          const dropped = event.dataTransfer.files[0];
          if (dropped) {
            clearResultUrl();
            pickFile(dropped);
          }
        }}
        className={`flex ${panelHeight} flex-col justify-center rounded-ctl border bg-surface p-4 ${
          dragOver ? "border-accent-ink" : "border-line"
        }`}
      >
        {phase.name === "idle" && (
          <>
            <div>
              <button
                type="button"
                className={primaryButton}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose {input.noun}
              </button>
            </div>
            <p className="mt-3">Or drop a file here. You can also paste one.</p>
            <p className="mt-1 text-sm text-muted">
              {input.maxBytesPhone !== undefined
                ? `Files up to ${formatBytes(input.maxBytes)} on a computer and ${formatBytes(input.maxBytesPhone)} on a phone. Larger files take too long to process in a browser.`
                : `Files up to ${formatBytes(input.maxBytes)}. Larger files take too long to process in a browser.`}
            </p>
          </>
        )}

        {file && phase.name !== "error" && (
          <p className="flex items-baseline gap-3">
            <span className="min-w-0 truncate font-semibold">{file.name}</span>
            <span className="shrink-0 text-sm text-muted">
              {typeLabel(file)}
            </span>
            <span className="ml-auto shrink-0">{formatBytes(file.size)}</span>
          </p>
        )}

        {phase.name === "picked" && (
          <>
            {hasTarget && userCanSetTarget && (
              <div className="mt-4">
                <label htmlFor={targetId} className="block text-sm text-muted">
                  Target size in {unitLabel}
                </label>
                <input
                  id={targetId}
                  type="text"
                  inputMode="decimal"
                  value={targetText}
                  onChange={(event) => setTargetText(event.target.value)}
                  aria-invalid={!targetValid}
                  aria-describedby={targetValid ? undefined : targetErrorId}
                  className={`mt-1 w-28 rounded-ctl border bg-bg px-3 py-2 text-base ${
                    targetValid ? "border-line" : "border-over"
                  }`}
                />
                {!targetValid && (
                  <p id={targetErrorId} className="mt-1 text-sm text-over">
                    Type a number above 0, for example 10.
                  </p>
                )}
              </div>
            )}
            {wantsTrim && phase.previewUrl && (
              <TrimFields
                key={phase.previewUrl}
                url={phase.previewUrl}
                media={range?.media ?? "video"}
                onChange={setTrim}
              />
            )}
            {options.map((option) => (
              <div key={option.id} className="mt-3">
                <label
                  htmlFor={`${optionId}-${option.id}`}
                  className="block text-sm text-muted"
                >
                  {option.label}
                </label>
                <select
                  id={`${optionId}-${option.id}`}
                  value={settings[option.id] ?? option.defaultValue}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      [option.id]: event.target.value,
                    }))
                  }
                  className="mt-1 w-full max-w-xs rounded-ctl border border-line bg-bg px-3 py-2 text-base"
                >
                  {option.choices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {targetBytes !== undefined && targetValid && (
              <p className="mt-3 text-sm text-muted">
                {phase.file.size > targetBytes
                  ? `This file is ${formatBytes(phase.file.size - targetBytes)} over the target.`
                  : "This file already fits the target."}
              </p>
            )}
            {phase.note && <p className="mt-3 text-sm">{phase.note}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryButton}
                disabled={!targetValid || (wantsTrim && trim === null)}
                onClick={() => start(phase.file)}
              >
                {actionLabel}
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={startOver}
              >
                Change file
              </button>
            </div>
          </>
        )}

        {phase.name === "working" && (
          <>
            <p className="mt-4">
              {phase.note ?? "Working"}: {Math.round(phase.progress * 100)}%
            </p>
            <div
              role="progressbar"
              aria-label="Progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(phase.progress * 100)}
              className="mt-2 h-2 border border-line bg-bg"
            >
              <div
                className="h-full bg-accent"
                style={{ width: `${phase.progress * 100}%` }}
              />
            </div>
            <div className="mt-4">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => runRef.current?.cancel()}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {phase.name === "done" && (
          <>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
              <dt className="text-muted">Original</dt>
              <dd>{formatBytes(phase.file.size)}</dd>
              {targetBytes !== undefined && (
                <>
                  <dt className="text-muted">Target</dt>
                  <dd>{formatBytes(targetBytes)}</dd>
                </>
              )}
              <dt className="text-muted">Result</dt>
              <dd className="font-semibold">{formatBytes(phase.size)}</dd>
            </dl>
            {targetBytes !== undefined &&
              (phase.size <= targetBytes ? (
                <p className="mt-2">The result fits under the target.</p>
              ) : (
                <p className="mt-2 text-over">
                  Still {formatBytes(phase.size - targetBytes)} over the
                  target. Try a larger target or a shorter file.
                </p>
              ))}
            <p className="mt-1 text-sm text-muted">
              {isFakeEngine(engine)
                ? "Test engine: it waits 3 seconds and returns the same file."
                : [...phase.details, `Took ${formatSeconds(phase.seconds)}.`].join(" ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={phase.url}
                download={phase.fileName}
                className={primaryButton}
              >
                Download file
              </a>
              <button
                type="button"
                className={secondaryButton}
                onClick={startOver}
              >
                Start over
              </button>
            </div>
          </>
        )}

        {phase.name === "error" && (
          <>
            <p className="font-semibold text-over">{phase.message}</p>
            <p className="mt-1">{phase.hint}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {phase.file && (
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => start(phase.file as File)}
                >
                  Try again
                </button>
              )}
              <button
                type="button"
                className={phase.file ? secondaryButton : primaryButton}
                onClick={startOver}
              >
                {phase.file ? "Start over" : `Choose a different file`}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
