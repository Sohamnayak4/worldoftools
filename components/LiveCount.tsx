"use client";

import { useEffect, useState } from "react";

type Field = "allTime" | "last7Days" | "last30Days";

// The number behind it changes every 30 minutes. Checks hit Vercel's cache,
// never the analytics database.
const REFRESH_MS = 60_000;

// A visitor count that starts with the number in the server HTML (if any)
// and refreshes every minute while the tab is visible. Null until a
// number is known.
export function useLiveCount(initial: number | null, field: Field = "allTime"): number | null {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    let stopped = false;
    async function refresh() {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/traffic");
        if (!response.ok) return;
        const data = (await response.json()) as Partial<Record<Field, unknown>>;
        const next = data[field];
        // Counts only go up; an older cached copy never makes them drop.
        if (!stopped && typeof next === "number" && Number.isFinite(next)) {
          setValue((current) => Math.max(current ?? 0, Math.floor(next)));
        }
      } catch {
        // Offline or blocked: keep the last number shown.
      }
    }
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    void refresh();
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [field]);

  return value;
}

// Shows nothing, not even the prefix and suffix, until a number is known.
export function LiveCount({
  initial,
  field = "allTime",
  prefix = "",
  suffix = "",
}: {
  initial: number | null;
  field?: Field;
  prefix?: string;
  suffix?: string;
}) {
  const value = useLiveCount(initial, field);
  if (value === null) return null;
  return (
    <>
      {prefix}
      {value.toLocaleString("en-US")}
      {suffix}
    </>
  );
}
