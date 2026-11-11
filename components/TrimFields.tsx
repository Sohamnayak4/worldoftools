"use client";

import { useId, useRef, useState } from "react";

// Start and end fields for the trim tools, with a small player to find the
// right moments. Reports the chosen range in seconds, or null while the
// fields do not make a valid range.

export type TrimRange = { start: number; end: number };

// Reads "1:23", "1:23.5", "1:02:03" or plain seconds like "83.5".
export function parseClock(text: string): number | null {
  const clean = text.trim().replace(",", ".");
  if (clean === "") return null;
  const parts = clean.split(":");
  if (parts.length > 3 || parts.some((part) => part === "")) return null;
  let seconds = 0;
  for (const part of parts) {
    const value = Number(part);
    if (!Number.isFinite(value) || value < 0) return null;
    seconds = seconds * 60 + value;
  }
  return seconds;
}

export function formatClock(seconds: number): string {
  const tenths = Math.round(seconds * 10);
  const whole = Math.floor(tenths / 10);
  const text = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  return tenths % 10 === 0 ? text : `${text}.${tenths % 10}`;
}

const fieldClass = "mt-1 w-24 rounded-ctl border bg-bg px-3 py-2 text-base";
const smallButton =
  "rounded-ctl border border-line px-3 py-1.5 text-sm hover:text-accent-ink";

export function TrimFields({
  url,
  media,
  onChange,
}: {
  url: string;
  media: "video" | "audio";
  onChange: (range: TrimRange | null) => void;
}) {
  const [startText, setStartText] = useState("0:00");
  const [endText, setEndText] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [playerFailed, setPlayerFailed] = useState(false);
  const playerRef = useRef<HTMLMediaElement | null>(null);
  const startId = useId();
  const endId = useId();
  const errorId = useId();

  function problem(start: number | null, end: number | null, length: number | null) {
    if (start === null) return "Type the start as minutes and seconds, like 0:05.";
    if (end === null) return "Type the end as minutes and seconds, like 0:20.";
    if (end <= start) return "The end must be after the start.";
    if (length !== null && start >= length) {
      return `The start is past the end, which is ${formatClock(length)} long.`;
    }
    return null;
  }

  function update(nextStart: string, nextEnd: string, length: number | null) {
    setStartText(nextStart);
    setEndText(nextEnd);
    const start = parseClock(nextStart);
    const end = parseClock(nextEnd);
    onChange(
      problem(start, end, length) === null
        ? { start: start as number, end: end as number }
        : null,
    );
  }

  function loaded(length: number) {
    if (!Number.isFinite(length)) return;
    setDuration(length);
    update(startText, endText === "" ? formatClock(length) : endText, length);
  }

  const boxHeight = media === "audio" ? "h-[64px]" : "h-[180px]";
  const waiting = endText === "" && duration === null && !playerFailed;
  const error = waiting
    ? null
    : problem(parseClock(startText), parseClock(endText), duration);

  return (
    <div className="mt-3">
      {playerFailed ? (
        <p className={`flex ${boxHeight} items-center bg-bg px-3 text-sm text-muted`}>
          This browser cannot preview this file. You can still type the start
          and end times.
        </p>
      ) : media === "audio" ? (
        <div className={`flex ${boxHeight} items-center`}>
          <audio
            ref={(element) => {
              playerRef.current = element;
            }}
            src={url}
            controls
            preload="metadata"
            className="w-full"
            onLoadedMetadata={(event) => loaded(event.currentTarget.duration)}
            onError={() => setPlayerFailed(true)}
          />
        </div>
      ) : (
        <video
          ref={(element) => {
            playerRef.current = element;
          }}
          src={url}
          controls
          muted
          playsInline
          preload="metadata"
          className={`${boxHeight} w-full bg-bg object-contain`}
          onLoadedMetadata={(event) => loaded(event.currentTarget.duration)}
          onError={() => setPlayerFailed(true)}
        />
      )}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
        <div>
          <label htmlFor={startId} className="block text-sm text-muted">
            Start
          </label>
          <input
            id={startId}
            type="text"
            inputMode="decimal"
            value={startText}
            onChange={(event) => update(event.target.value, endText, duration)}
            aria-describedby={error ? errorId : undefined}
            className={`${fieldClass} border-line`}
          />
        </div>
        <div>
          <label htmlFor={endId} className="block text-sm text-muted">
            End
          </label>
          <input
            id={endId}
            type="text"
            inputMode="decimal"
            value={endText}
            onChange={(event) => update(startText, event.target.value, duration)}
            aria-describedby={error ? errorId : undefined}
            className={`${fieldClass} border-line`}
          />
        </div>
      </div>
      {!playerFailed && (
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className={smallButton}
            onClick={() =>
              update(
                formatClock(playerRef.current?.currentTime ?? 0),
                endText,
                duration,
              )
            }
          >
            Set start to player time
          </button>
          <button
            type="button"
            className={smallButton}
            onClick={() =>
              update(
                startText,
                formatClock(playerRef.current?.currentTime ?? 0),
                duration,
              )
            }
          >
            Set end to player time
          </button>
        </div>
      )}
      <p id={errorId} className="mt-2 min-h-5 text-sm text-over">
        {error}
      </p>
    </div>
  );
}
