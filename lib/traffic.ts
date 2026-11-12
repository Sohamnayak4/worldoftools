import { unstable_cache } from "next/cache";
import { PIXELMOTH_SRC } from "./site";

// Real visitor counts from the owner's Pixelmoth, shown to advertisers.
// Read on the server with the site's API key, which never reaches browsers.

export type Traffic = {
  allTime: number;
  last7Days: number;
  last30Days: number;
};

export async function fetchTraffic(): Promise<Traffic | null> {
  const key = process.env.PIXELMOTH_API_KEY;
  if (!key) return null;
  try {
    // PIXELMOTH_HOST lets a local Pixelmoth stand in during development.
    const host = process.env.PIXELMOTH_HOST || PIXELMOTH_SRC;
    const response = await fetch(new URL("/api/v1/stats", host), {
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    const count = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
    const allTime = count(data.visitors_all_time);
    const last7Days = count(data.visitors_7d);
    const last30Days = count(data.visitors_30d);
    if (allTime === null || last7Days === null || last30Days === null) return null;
    return { allTime, last7Days, last30Days };
  } catch {
    // Analytics down or slow: the count is left off rather than guessed.
    return null;
  }
}

// Refreshed with the pages, every 10 minutes.
export const getTraffic = unstable_cache(fetchTraffic, ["traffic"], {
  tags: ["traffic"],
  revalidate: 600,
});

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
