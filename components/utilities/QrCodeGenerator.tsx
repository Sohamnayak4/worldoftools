"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { encode } from "uqr";
import { fieldClass, panelClass, primaryButton, secondaryButton } from "./parts";

type Level = "L" | "M" | "Q" | "H";
const LEVELS: [Level, string][] = [
  ["L", "Low, 7 percent can be damaged"],
  ["M", "Medium, 15 percent"],
  ["Q", "Quartile, 25 percent"],
  ["H", "High, 30 percent"],
];
const SIZES = [256, 512, 1024];
// The QR standard asks for a blank margin four modules wide.
const QUIET_ZONE = 4;
const PREVIEW_PX = 220;

function toSvg(data: boolean[][], size: number): string {
  const count = data.length;
  let path = "";
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      if (data[y][x]) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${count} ${count}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${count}" height="${count}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}

function draw(canvas: HTMLCanvasElement, data: boolean[][], size: number) {
  const count = data.length;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.fillStyle = "#000000";
  const cell = size / count;
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      if (data[y][x]) {
        // Rounded edges avoid hairline gaps between modules.
        const left = Math.round(x * cell);
        const top = Math.round(y * cell);
        context.fillRect(left, top, Math.round((x + 1) * cell) - left, Math.round((y + 1) * cell) - top);
      }
    }
  }
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function QrCodeGenerator() {
  const [text, setText] = useState("");
  const [level, setLevel] = useState<Level>("M");
  const [size, setSize] = useState(512);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textId = useId();
  const levelId = useId();
  const sizeId = useId();

  const result = useMemo(() => {
    if (text === "") return { ok: false as const, message: "Type a link or some text to make a QR code." };
    try {
      const qr = encode(text, { ecc: level, border: QUIET_ZONE });
      return { ok: true as const, data: qr.data, version: qr.version };
    } catch {
      return {
        ok: false as const,
        message: "This is too much text for one QR code at this error correction level. Shorten the text or choose Low.",
      };
    }
  }, [text, level]);

  useEffect(() => {
    if (result.ok && canvasRef.current) draw(canvasRef.current, result.data, PREVIEW_PX * 2);
  }, [result]);

  return (
    <div className={panelClass}>
      <label htmlFor={textId} className="block text-sm text-muted">
        Link or text
      </label>
      <textarea
        id={textId}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        placeholder="https://example.com"
        className={`${fieldClass} resize-y`}
      />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
        <div>
          <label htmlFor={levelId} className="block text-sm text-muted">
            Error correction
          </label>
          <select
            id={levelId}
            value={level}
            onChange={(event) => setLevel(event.target.value as Level)}
            className={fieldClass}
          >
            {LEVELS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={sizeId} className="block text-sm text-muted">
            Download size
          </label>
          <select
            id={sizeId}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
            className={fieldClass}
          >
            {SIZES.map((value) => (
              <option key={value} value={value}>
                {value} by {value} pixels
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex h-[220px] items-center">
        {result.ok ? (
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`QR code for: ${text}`}
            style={{ width: PREVIEW_PX, height: PREVIEW_PX }}
          />
        ) : (
          <p role="status" className={`text-sm ${text === "" ? "text-muted" : "text-over"}`}>
            {result.message}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className={primaryButton}
          disabled={!result.ok}
          data-pm-goal="file_download"
          data-pm-goal-tool="qr-code-generator"
          data-pm-goal-format="png"
          onClick={() => {
            if (!result.ok) return;
            const canvas = document.createElement("canvas");
            draw(canvas, result.data, size);
            canvas.toBlob((blob) => blob && save(blob, "qr-code.png"), "image/png");
          }}
        >
          Download PNG
        </button>
        <button
          type="button"
          className={secondaryButton}
          disabled={!result.ok}
          data-pm-goal="file_download"
          data-pm-goal-tool="qr-code-generator"
          data-pm-goal-format="svg"
          onClick={() => {
            if (!result.ok) return;
            save(new Blob([toSvg(result.data, size)], { type: "image/svg+xml" }), "qr-code.svg");
          }}
        >
          Download SVG
        </button>
      </div>
    </div>
  );
}
