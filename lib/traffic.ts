import { unstable_cache } from "next/cache";
import { PIXELMOTH_SRC } from "./site";

// Visitor counts shown to advertisers. Read on the server; the keys never
// reach browsers.
//
// The source is the owner's Pixelmoth. When Pixelmoth cannot answer (its
// free Cloudflare D1 limit ran out on 2026-11-13), the count falls back to
// a fixed baseline plus the visitors Vercel Web Analytics has counted since
// it was added. As soon as Pixelmoth answers again, its number is used.

export type Traffic = {
  allTime: number;
  last7Days: number;
  last30Days: number;
  source: "pixelmoth" | "vercel";
};

// How often the count is refreshed, in seconds. Every Pixelmoth count reads
// all visitor rows, which counts against Cloudflare's daily D1 limit.
export const TRAFFIC_REFRESH_SECONDS = 1800;

// The owner's figure for visitors Pixelmoth had counted before Vercel Web
// Analytics was added on 2026-11-13. Pixelmoth's last answer was 4,951.
const VERCEL_BASELINE = 5000;

const TIMEOUT_MS = 4000;

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

async function fromPixelmoth(): Promise<Traffic | null> {
  const key = process.env.PIXELMOTH_API_KEY;
  if (!key) return null;
  try {
    // PIXELMOTH_HOST lets a local Pixelmoth stand in during development.
    const host = process.env.PIXELMOTH_HOST || PIXELMOTH_SRC;
    const response = await fetch(new URL("/api/v1/stats", host), {
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // A no-store fetch would make /api/traffic dynamic and uncached.
      next: { revalidate: TRAFFIC_REFRESH_SECONDS },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    const allTime = count(data.visitors_all_time);
    const last7Days = count(data.visitors_7d);
    const last30Days = count(data.visitors_30d);
    if (allTime === null || last7Days === null || last30Days === null) return null;
    return { allTime, last7Days, last30Days, source: "pixelmoth" };
  } catch {
    return null;
  }
}

async function fromVercel(): Promise<Traffic | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) return null;
  try {
    const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/count");
    // The API takes the project id or name. Vercel sets VERCEL_PROJECT_ID.
    url.searchParams.set("projectId", process.env.VERCEL_PROJECT_ID || "worldoftools");
    if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: TRAFFIC_REFRESH_SECONDS },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: Record<string, unknown> };
    const visitors = count(body.data?.visitors);
    if (visitors === null) return null;
    // Everyone so far arrived within the last week, so one total fits all three.
    const total = VERCEL_BASELINE + visitors;
    return { allTime: total, last7Days: total, last30Days: total, source: "vercel" };
  } catch {
    return null;
  }
}

export async function fetchTraffic(): Promise<Traffic | null> {
  // If both fail, the count is left off rather than guessed.
  return (await fromPixelmoth()) ?? (await fromVercel());
}

// Used when pages rebuild.
export const getTraffic = unstable_cache(fetchTraffic, ["traffic"], {
  tags: ["traffic"],
  revalidate: TRAFFIC_REFRESH_SECONDS,
});

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
