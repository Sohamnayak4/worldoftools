"use client";

import { useId, useRef, useState } from "react";
import { KB, formatBytes } from "@/lib/format";

// A crop box over a preview of the visitor's picture. In free mode the
// shape is open or one of a few ratios. In spec mode the shape and output
// size come from an official photo spec, or from sizes the visitor types.

export type CropArea = { x: number; y: number; width: number; height: number };

export type CropSpec = {
  id: string;
  label: string;
  requirement: string;
  outWidth: number;
  outHeight: number;
  minBytes: number;
  maxBytes: number;
};

export type CropValue = {
  crop: CropArea;
  output?: {
    width: number;
    height: number;
    minBytes?: number;
    maxBytes?: number;
  };
};

type Size = { width: number; height: number };

const SHAPES: { value: string; label: string; ratio: number | null }[] = [
  { value: "free", label: "Free", ratio: null },
  { value: "1:1", label: "1:1, square", ratio: 1 },
  { value: "4:3", label: "4:3", ratio: 4 / 3 },
  { value: "3:4", label: "3:4", ratio: 3 / 4 },
  { value: "16:9", label: "16:9, wide", ratio: 16 / 9 },
  { value: "9:16", label: "9:16, tall", ratio: 9 / 16 },
];

const fieldClass =
  "mt-1 w-24 rounded-ctl border border-line bg-bg px-3 py-2 text-base";
const selectClass =
  "mt-1 w-full max-w-xs rounded-ctl border border-line bg-bg px-3 py-2 text-base";
const PREVIEW_HEIGHT = 260;

// The largest box of a shape that fits the picture, centered, a bit inset.
function startBox(image: Size, ratio: number | null): CropArea {
  let width = image.width * 0.9;
  let height = image.height * 0.9;
  if (ratio !== null) {
    if (width / height > ratio) width = height * ratio;
    else height = width / ratio;
  }
  return {
    x: Math.round((image.width - width) / 2),
    y: Math.round((image.height - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function clamp(box: CropArea, image: Size, ratio: number | null): CropArea {
  let width = Math.max(8, Math.min(box.width, image.width));
  let height = Math.max(8, Math.min(box.height, image.height));
  if (ratio !== null) {
    height = width / ratio;
    if (height > image.height) {
      height = image.height;
      width = height * ratio;
    }
  }
  const x = Math.max(0, Math.min(box.x, image.width - width));
  const y = Math.max(0, Math.min(box.y, image.height - height));
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function wholeNumber(text: string, max: number): number | null {
  const value = Number(text.trim());
  return Number.isInteger(value) && value >= 1 && value <= max ? value : null;
}

export function CropFields({
  url,
  specs,
  onChange,
}: {
  url: string;
  // Set for the photo spec tools. Leave out for a free crop.
  specs?: CropSpec[];
  onChange: (value: CropValue | null) => void;
}) {
  const [image, setImage] = useState<Size | null>(null);
  const [box, setBox] = useState<CropArea | null>(null);
  const [shape, setShape] = useState("free");
  const [specId, setSpecId] = useState(specs?.[0]?.id ?? "custom");
  const [custom, setCustom] = useState({ width: "600", height: "600", maxKb: "100" });
  const [failed, setFailed] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    mode: "move" | "size";
    startX: number;
    startY: number;
    box: CropArea;
  } | null>(null);
  const shapeId = useId();
  const specSelectId = useId();
  const fieldsId = useId();
  const helpId = useId();

  const spec = specs?.find((item) => item.id === specId);

  function outputFor(id: string, typed: typeof custom): CropValue["output"] | null {
    if (!specs) return undefined;
    const chosen = specs.find((item) => item.id === id);
    if (chosen) {
      return {
        width: chosen.outWidth,
        height: chosen.outHeight,
        minBytes: chosen.minBytes,
        maxBytes: chosen.maxBytes,
      };
    }
    const width = wholeNumber(typed.width, 6000);
    const height = wholeNumber(typed.height, 6000);
    const maxKb = wholeNumber(typed.maxKb, 50000);
    if (width === null || height === null || maxKb === null) return null;
    return { width, height, maxBytes: maxKb * KB };
  }

  function ratioFor(
    nextShape: string,
    output: CropValue["output"] | null,
  ): number | null {
    if (specs) return output ? output.width / output.height : 1;
    return SHAPES.find((item) => item.value === nextShape)?.ratio ?? null;
  }

  // Every change goes through here, so the parent always has the latest.
  function apply(
    nextBox: CropArea | null,
    output: CropValue["output"] | null,
  ) {
    setBox(nextBox);
    if (nextBox === null || output === null) onChange(null);
    else onChange({ crop: nextBox, output });
  }

  const currentOutput = outputFor(specId, custom);
  const ratio = ratioFor(shape, currentOutput);

  function moveBox(next: CropArea) {
    if (!image) return;
    apply(clamp(next, image, ratio), currentOutput);
  }

  function onPointerDown(event: React.PointerEvent, mode: "move" | "size") {
    if (!box) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { mode, startX: event.clientX, startY: event.clientY, box };
  }

  function onPointerMove(event: React.PointerEvent) {
    const state = drag.current;
    const frame = frameRef.current;
    if (!state || !frame || !image) return;
    // Screen pixels to picture pixels.
    const scale = image.width / frame.clientWidth;
    const dx = (event.clientX - state.startX) * scale;
    const dy = (event.clientY - state.startY) * scale;
    if (state.mode === "move") {
      moveBox({ ...state.box, x: state.box.x + dx, y: state.box.y + dy });
    } else {
      const width = Math.min(state.box.width + dx, image.width - state.box.x);
      const height = Math.min(state.box.height + dy, image.height - state.box.y);
      moveBox({
        ...state.box,
        width: ratio === null ? width : Math.min(width, height * ratio),
        height,
      });
    }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!box || !image) return;
    const step = Math.max(1, Math.round(image.width * (event.shiftKey ? 0.05 : 0.01)));
    const grow = Math.max(2, Math.round(image.width * 0.02));
    let next: CropArea | null = null;
    if (event.key === "ArrowLeft") next = { ...box, x: box.x - step };
    else if (event.key === "ArrowRight") next = { ...box, x: box.x + step };
    else if (event.key === "ArrowUp") next = { ...box, y: box.y - step };
    else if (event.key === "ArrowDown") next = { ...box, y: box.y + step };
    else if (event.key === "+" || event.key === "=") {
      next = { ...box, width: box.width + grow, height: box.height + grow };
    } else if (event.key === "-" || event.key === "_") {
      next = { ...box, width: box.width - grow, height: box.height - grow };
    }
    if (next) {
      event.preventDefault();
      moveBox(next);
    }
  }

  function typedBox(field: keyof CropArea, text: string) {
    if (!box) return;
    const value = Math.max(0, Math.round(Number(text) || 0));
    moveBox({ ...box, [field]: value });
  }

  if (failed) {
    return (
      <p className="mt-3 flex h-[260px] items-center bg-bg px-3 text-sm text-muted">
        This browser cannot show this image, so it cannot be cropped here. If
        it is a HEIC photo, convert it to JPG first.
      </p>
    );
  }

  const percent = (part: number, whole: number) => `${(part / whole) * 100}%`;
  const customBad = specs !== undefined && !spec && currentOutput === null;

  return (
    <div className="mt-3">
      {specs && (
        <div>
          <label htmlFor={specSelectId} className="block text-sm text-muted">
            Size
          </label>
          <select
            id={specSelectId}
            value={specId}
            onChange={(event) => {
              const id = event.target.value;
              setSpecId(id);
              const output = outputFor(id, custom);
              apply(
                image ? startBox(image, ratioFor(shape, output)) : null,
                output,
              );
            }}
            className={selectClass}
          >
            {specs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="custom">Custom size</option>
          </select>
          {spec ? (
            <p className="mt-1 text-sm text-muted">
              Official rule: {spec.requirement}. This tool makes{" "}
              {spec.outWidth} by {spec.outHeight} pixels.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  ["width", "Width in pixels"],
                  ["height", "Height in pixels"],
                  ["maxKb", "Max size in KB"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label
                    htmlFor={`${fieldsId}-${key}`}
                    className="block text-sm text-muted"
                  >
                    {label}
                  </label>
                  <input
                    id={`${fieldsId}-${key}`}
                    type="text"
                    inputMode="numeric"
                    value={custom[key]}
                    onChange={(event) => {
                      const typed = { ...custom, [key]: event.target.value };
                      setCustom(typed);
                      const output = outputFor("custom", typed);
                      apply(
                        image && output
                          ? startBox(image, output.width / output.height)
                          : box,
                        output,
                      );
                    }}
                    className={fieldClass}
                  />
                </div>
              ))}
            </div>
          )}
          {customBad && (
            <p className="mt-1 text-sm text-over">
              Type whole numbers for the width, height and maximum size.
            </p>
          )}
        </div>
      )}

      {!specs && (
        <div>
          <label htmlFor={shapeId} className="block text-sm text-muted">
            Shape
          </label>
          <select
            id={shapeId}
            value={shape}
            onChange={(event) => {
              setShape(event.target.value);
              apply(
                image
                  ? startBox(image, ratioFor(event.target.value, undefined))
                  : null,
                undefined,
              );
            }}
            className={selectClass}
          >
            {SHAPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        ref={frameRef}
        className="relative mt-3 overflow-hidden bg-bg"
        style={
          image
            ? {
                width: `min(100%, ${(PREVIEW_HEIGHT * image.width) / image.height}px)`,
                aspectRatio: `${image.width} / ${image.height}`,
              }
            : { height: PREVIEW_HEIGHT }
        }
      >
        {/* A local preview of the visitor's own file. next/image does not apply. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Your image, with the crop box over it"
          draggable={false}
          className="block h-full w-full select-none"
          onLoad={(event) => {
            const size = {
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            };
            if (size.width === 0 || size.height === 0) {
              setFailed(true);
              onChange(null);
              return;
            }
            setImage(size);
            apply(startBox(size, ratio), currentOutput);
          }}
          onError={() => {
            setFailed(true);
            onChange(null);
          }}
        />
        {image && box && (
          <div
            role="group"
            tabIndex={0}
            aria-label="Crop box"
            aria-describedby={helpId}
            onPointerDown={(event) => onPointerDown(event, "move")}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={onKeyDown}
            className="absolute cursor-move touch-none border-2 border-accent"
            style={{
              left: percent(box.x, image.width),
              top: percent(box.y, image.height),
              width: percent(box.width, image.width),
              height: percent(box.height, image.height),
              // Darkens everything outside the box.
              boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)",
            }}
          >
            <span
              onPointerDown={(event) => onPointerDown(event, "size")}
              onPointerMove={onPointerMove}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              className="absolute -bottom-0.5 -right-0.5 h-7 w-7 cursor-nwse-resize touch-none bg-accent"
            />
          </div>
        )}
      </div>
      <p id={helpId} className="mt-2 text-sm text-muted">
        Drag the box to move it. Drag the yellow corner to resize it. With a
        keyboard, arrow keys move it and plus and minus resize it.
      </p>

      {!specs && box && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {(
            [
              ["x", "Left"],
              ["y", "Top"],
              ["width", "Width"],
              ["height", "Height"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label
                htmlFor={`${fieldsId}-${key}`}
                className="block text-sm text-muted"
              >
                {label}
              </label>
              <input
                id={`${fieldsId}-${key}`}
                type="text"
                inputMode="numeric"
                value={String(box[key])}
                onChange={(event) => typedBox(key, event.target.value)}
                className={fieldClass}
              />
            </div>
          ))}
        </div>
      )}
      {specs && box && currentOutput && (
        <p className="mt-1 text-sm text-muted">
          Cropping {box.width} by {box.height} pixels of your photo
          {currentOutput.maxBytes !== undefined
            ? `, then saving under ${formatBytes(currentOutput.maxBytes)}.`
            : "."}
        </p>
      )}
    </div>
  );
}
