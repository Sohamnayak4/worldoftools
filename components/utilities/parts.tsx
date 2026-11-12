"use client";

import { useState } from "react";

// Small shared pieces for the utility tools.

export const fieldClass =
  "mt-1 w-full rounded-ctl border border-line bg-bg px-3 py-2 text-base placeholder:text-muted";
export const areaClass = `${fieldClass} min-h-[160px] resize-y font-sans`;
export const primaryButton =
  "rounded-ctl bg-accent px-4 py-2.5 font-semibold text-on-accent hover:bg-text hover:text-bg disabled:bg-line disabled:text-muted";
export const secondaryButton =
  "rounded-ctl border border-line px-3 py-2 hover:text-accent-ink disabled:text-muted";
export const panelClass = "rounded-ctl border border-line bg-surface p-4";

// A button that copies text and says so in words, for screen readers too.
export function CopyButton({ text, label = "Copy text" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  return (
    <>
      <button
        type="button"
        className={secondaryButton}
        disabled={text === ""}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setState("done");
          } catch {
            setState("failed");
          }
          setTimeout(() => setState("idle"), 2500);
        }}
      >
        {label}
      </button>
      <span role="status" className="text-sm text-muted">
        {state === "done"
          ? "Copied."
          : state === "failed"
            ? "This browser blocked copying. Select the text and copy it by hand."
            : ""}
      </span>
    </>
  );
}
