"use client";

import { useId, useState } from "react";

// Width and height fields for the resize tool, with a small preview.
// Reports the chosen size in pixels, or null while it is not valid.

export type PixelSize = { width: number; height: number };

const MAX_SIDE = 12000;
const fieldClass =
  "mt-1 w-28 rounded-ctl border border-line bg-bg px-3 py-2 text-base";
const smallButton =
  "rounded-ctl border border-line px-3 py-1.5 text-sm hover:text-accent-ink";

function parseSide(text: string): number | null {
  const value = Number(text.trim());
  return Number.isInteger(value) && value >= 1 && value <= MAX_SIDE
    ? value
    : null;
}

export function ResizeFields({
  url,
  onChange,
}: {
  url: string;
  onChange: (size: PixelSize | null) => void;
}) {
  const [original, setOriginal] = useState<PixelSize | null>(null);
  const [widthText, setWidthText] = useState("");
  const [heightText, setHeightText] = useState("");
  const [locked, setLocked] = useState(true);
  const [previewFailed, setPreviewFailed] = useState(false);
  const widthId = useId();
  const heightId = useId();
  const lockId = useId();
  const errorId = useId();

  function update(nextWidth: string, nextHeight: string) {
    setWidthText(nextWidth);
    setHeightText(nextHeight);
    const width = parseSide(nextWidth);
    const height = parseSide(nextHeight);
    onChange(width !== null && height !== null ? { width, height } : null);
  }

  function changeWidth(text: string) {
    const width = parseSide(text);
    if (locked && original && width !== null) {
      const height = Math.max(1, Math.round((width * original.height) / original.width));
      update(text, String(height));
    } else {
      update(text, heightText);
    }
  }

  function changeHeight(text: string) {
    const height = parseSide(text);
    if (locked && original && height !== null) {
      const width = Math.max(1, Math.round((height * original.width) / original.height));
      update(String(width), text);
    } else {
      update(widthText, text);
    }
  }

  function scaleTo(factor: number) {
    if (!original) return;
    update(
      String(Math.max(1, Math.round(original.width * factor))),
      String(Math.max(1, Math.round(original.height * factor))),
    );
  }

  const waiting = original === null && !previewFailed;
  const invalid =
    !waiting && (parseSide(widthText) === null || parseSide(heightText) === null);

  return (
    <div className="mt-3">
      {previewFailed ? (
        <p className="flex h-[120px] items-center bg-bg px-3 text-sm text-muted">
          This browser cannot preview this image. Type the width and height
          you want.
        </p>
      ) : (
        // A local preview of the visitor's own file. next/image does not apply.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Preview of your image"
          className="h-[120px] w-full bg-bg object-contain"
          onLoad={(event) => {
            const size = {
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            };
            if (size.width === 0 || size.height === 0) {
              setPreviewFailed(true);
              return;
            }
            setOriginal(size);
            update(String(size.width), String(size.height));
          }}
          onError={() => setPreviewFailed(true)}
        />
      )}
      <p className="mt-2 text-sm text-muted">
        {original
          ? `Original size: ${original.width} by ${original.height} pixels.`
          : "Reading the image size."}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
        <div>
          <label htmlFor={widthId} className="block text-sm text-muted">
            Width in pixels
          </label>
          <input
            id={widthId}
            type="text"
            inputMode="numeric"
            value={widthText}
            onChange={(event) => changeWidth(event.target.value)}
            aria-describedby={invalid ? errorId : undefined}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={heightId} className="block text-sm text-muted">
            Height in pixels
          </label>
          <input
            id={heightId}
            type="text"
            inputMode="numeric"
            value={heightText}
            onChange={(event) => changeHeight(event.target.value)}
            aria-describedby={invalid ? errorId : undefined}
            className={fieldClass}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label htmlFor={lockId} className="flex items-center gap-2 text-sm">
          <input
            id={lockId}
            type="checkbox"
            checked={locked}
            onChange={(event) => setLocked(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Keep proportions
        </label>
        <button type="button" className={smallButton} onClick={() => scaleTo(0.5)}>
          Half size
        </button>
        <button type="button" className={smallButton} onClick={() => scaleTo(0.25)}>
          Quarter size
        </button>
      </div>
      <p id={errorId} className="mt-2 min-h-5 text-sm text-over">
        {invalid
          ? `Type whole numbers from 1 to ${MAX_SIDE} for both sides.`
          : null}
      </p>
    </div>
  );
}
