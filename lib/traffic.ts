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
// Vercel's analytics API does not touch D1, so its count can refresh faster.
export const VERCEL_REFRESH_SECONDS = 300;

// Visitors before Vercel Web Analytics was added on 2026-11-13. Pixelmoth's
// last answer was 4,951; the owner adds about 500 for the hours between
// Pixelmoth stopping and Vercel starting, judged from the launch post's
// view trend. An estimate, used only while Pixelmoth is down.
const VERCEL_BASELINE = 5500;

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

// HTTP statuses of the last Vercel calls, for /api/traffic?diag=1. Holds no
// counts, tokens or visitor data.
export const vercelDiag: Record<string, number | string> = {};

// Vercel's visitor count, optionally only within a time window.
async function vercelVisitors(
  window: { since?: string; until?: string } = {},
  revalidate = VERCEL_REFRESH_SECONDS,
  label = "total",
): Promise<number | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) return null;
  try {
    const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/count");
    // The API takes the project id or name. Vercel sets VERCEL_PROJECT_ID.
    url.searchParams.set("projectId", process.env.VERCEL_PROJECT_ID || "worldoftools");
    if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
    if (window.since) url.searchParams.set("since", window.since);
    if (window.until) url.searchParams.set("until", window.until);
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate },
    });
    vercelDiag[label] = response.status;
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: Record<string, unknown> };
    return count(body.data?.visitors);
  } catch (error) {
    vercelDiag[label] = error instanceof Error ? error.name : "error";
    return null;
  }
}

async function fromVercel(): Promise<Traffic | null> {
  const visitors = await vercelVisitors();
  if (visitors === null) return null;
  // Everyone so far arrived within the last week, so one total fits all three.
  const total = VERCEL_BASELINE + visitors;
  return { allTime: total, last7Days: total, last30Days: total, source: "vercel" };
}

// Pixelmoth's D1 limit ran out on 2026-11-13 and reset at this time. Until
// then the count came from Vercel only.
const OUTAGE_END = "2026-11-14T00:00:00Z";
const PIXELMOTH_BACK_AT = Date.parse(OUTAGE_END);
const DAY_MS = 86_400_000;

// Visitors Pixelmoth never recorded: the owner's ~500 for the hours before
// Vercel Web Analytics was added, plus everyone Vercel counted until the
// reset. The Vercel part is a closed window, so it is cached for a day.
async function missedDuringOutage(): Promise<number> {
  // The docs accept a timestamp in milliseconds or a date string; try both,
  // with a start date before Vercel Web Analytics was added.
  const endMs = String(Date.parse(OUTAGE_END));
  const sinceMs = String(Date.parse("2026-11-12T00:00:00Z"));
  const counted =
    (await vercelVisitors({ since: sinceMs, until: endMs }, 3600, "outage-ms")) ??
    (await vercelVisitors({ since: "2026-11-12T00:00:00Z", until: OUTAGE_END }, 3600, "outage-iso")) ??
    (await vercelVisitors({ since: "2026-11-12", until: "2026-11-14" }, 3600, "outage-day"));
  return VERCEL_BASELINE - PIXELMOTH_LAST_BEFORE_OUTAGE + (counted ?? 0);
}

// Pixelmoth's last answer before the outage (seen at 07:04 UTC on Nov 13).
// Subtracting it from the baseline leaves the owner's estimate for the gap,
// so the visitors Pixelmoth did record are not counted twice.
const PIXELMOTH_LAST_BEFORE_OUTAGE = 5135;

export async function fetchTraffic(): Promise<Traffic | null> {
  if (Date.now() < PIXELMOTH_BACK_AT) return fromVercel();
  const pixelmoth = await fromPixelmoth();
  // If both fail, the count is left off rather than guessed.
  if (!pixelmoth) return fromVercel();
  // Add back the outage visitors, and drop them from the 7 and 30 day counts
  // once the outage falls outside those windows.
  const missed = await missedDuringOutage();
  const since = Date.now() - PIXELMOTH_BACK_AT;
  return {
    ...pixelmoth,
    allTime: pixelmoth.allTime + missed,
    last7Days: pixelmoth.last7Days + (since < 7 * DAY_MS ? missed : 0),
    last30Days: pixelmoth.last30Days + (since < 30 * DAY_MS ? missed : 0),
  };
}

// Used when pages rebuild.
// The key changes when the source rules change, so an old cached count is not reused.
export const getTraffic = unstable_cache(fetchTraffic, ["traffic-v4"], {
  tags: ["traffic"],
  revalidate: TRAFFIC_REFRESH_SECONDS,
});

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
