import { unstable_cache } from "next/cache";
import { PIXELMOTH_SRC } from "./site";

// Visitor counts shown to advertisers. Read on the server; the keys never
// reach browsers.
//
// The main source is Vercel Web Analytics: a fixed baseline for the visitors
// before it was added, plus everyone it has counted since. The owner's
// Pixelmoth is the backup; its free Cloudflare D1 limit ran out on 2026-11-13
// and again on 2026-11-16, and it misses the visitors from those outages.

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

// Vercel's visitor count, optionally only within a time window.
async function vercelVisitors(
  window: { since?: string; until?: string } = {},
  revalidate = VERCEL_REFRESH_SECONDS,
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
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: Record<string, unknown> };
    return count(body.data?.visitors);
  } catch {
    return null;
  }
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

// Roughly when Vercel Web Analytics started counting. Visitors before it are
// covered by VERCEL_BASELINE.
const VERCEL_STARTED = Date.parse("2026-11-13T07:00:00Z");

// Vercel is the main source: it has counted without a gap since it was
// added, while Pixelmoth has gone down when its free D1 limit ran out.
async function fromVercel(): Promise<Traffic | null> {
  // Window starts rounded to the hour, so the cached API answers are reused.
  const now = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
  const windowCount = async (days: number) => {
    const start = now - days * DAY_MS;
    // Both ends are sent: an open-ended window was rejected for until alone.
    const until = Math.floor(Date.now() / (5 * 60_000)) * 5 * 60_000;
    const visitors = await vercelVisitors({
      since: String(Math.max(start, VERCEL_STARTED - DAY_MS)),
      until: String(until),
    });
    if (visitors === null) return null;
    // The baseline visitors came before Vercel started; count them while the
    // window still reaches back that far.
    return visitors + (start < VERCEL_STARTED ? VERCEL_BASELINE : 0);
  };
  const [allTime, last7Days, last30Days] = await Promise.all([
    vercelVisitors().then((visitors) => (visitors === null ? null : VERCEL_BASELINE + visitors)),
    windowCount(7),
    windowCount(30),
  ]);
  if (allTime === null || last7Days === null || last30Days === null) return null;
  return { allTime, last7Days, last30Days, source: "vercel" };
}

// Pixelmoth's first D1 outage ended at this time. Its visitors are added
// back when Pixelmoth stands in for Vercel.
const OUTAGE_END = "2026-11-14T00:00:00Z";
const PIXELMOTH_BACK_AT = Date.parse(OUTAGE_END);

// Visitors Pixelmoth never recorded in that outage: the owner's ~500 for the
// hours before Vercel Web Analytics was added, plus everyone Vercel counted
// until the reset. A closed window, so it is cached for an hour.
async function missedDuringOutage(): Promise<number> {
  // Timestamps in milliseconds, with a start before Vercel Web Analytics was
  // added. (An until date on its own was rejected.)
  const counted = await vercelVisitors(
    { since: String(Date.parse("2026-11-12T00:00:00Z")), until: String(PIXELMOTH_BACK_AT) },
    3600,
  );
  return VERCEL_BASELINE - PIXELMOTH_LAST_BEFORE_OUTAGE + (counted ?? 0);
}

// Pixelmoth's last answer before the outage (seen at 07:04 UTC on Nov 13).
// Subtracting it from the baseline leaves the owner's estimate for the gap,
// so the visitors Pixelmoth did record are not counted twice.
const PIXELMOTH_LAST_BEFORE_OUTAGE = 5135;

// Backup only. Misses any later Pixelmoth outages, so it reads low.
async function fromPixelmothWithOutage(): Promise<Traffic | null> {
  const pixelmoth = await fromPixelmoth();
  if (!pixelmoth) return null;
  const missed = await missedDuringOutage();
  const since = Date.now() - PIXELMOTH_BACK_AT;
  return {
    ...pixelmoth,
    allTime: pixelmoth.allTime + missed,
    last7Days: pixelmoth.last7Days + (since < 7 * DAY_MS ? missed : 0),
    last30Days: pixelmoth.last30Days + (since < 30 * DAY_MS ? missed : 0),
  };
}

export async function fetchTraffic(): Promise<Traffic | null> {
  // If both fail, the count is left off rather than guessed.
  return (await fromVercel()) ?? (await fromPixelmothWithOutage());
}

// Used when pages rebuild.
// The key changes when the source rules change, so an old cached count is not reused.
export const getTraffic = unstable_cache(fetchTraffic, ["traffic-v5"], {
  tags: ["traffic"],
  revalidate: TRAFFIC_REFRESH_SECONDS,
});

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
