import { fetchTraffic, TRAFFIC_REFRESH_SECONDS, VERCEL_REFRESH_SECONDS, vercelDiag } from "@/lib/traffic";

// Visitor totals for the live counts on the page. Runs on request, and
// Vercel's edge caches each answer, however many people are on the site:
// - a Pixelmoth count for 30 minutes, to spare its D1 database,
// - a Vercel count for 5 minutes, since that API does not touch D1,
// - an empty answer for 1 minute, so a count that comes back shows quickly.
export const dynamic = "force-dynamic";

const EMPTY_RETRY_SECONDS = 60;

export async function GET(request: Request) {
  const traffic = await fetchTraffic();
  // Temporary: shows only the HTTP statuses of the Vercel calls, uncached.
  if (new URL(request.url).searchParams.get("diag") === "1") {
    return Response.json({ vercel: vercelDiag, source: traffic?.source ?? null }, {
      headers: { "Cache-Control": "no-store" },
    });
  }
  const seconds = !traffic
    ? EMPTY_RETRY_SECONDS
    : traffic.source === "vercel"
      ? VERCEL_REFRESH_SECONDS
      : TRAFFIC_REFRESH_SECONDS;
  const cache = `public, s-maxage=${seconds}, stale-while-revalidate=${Math.min(seconds, 300)}`;
  return Response.json(traffic ?? {}, {
    headers: {
      "Cache-Control": `public, max-age=0, ${cache.slice("public, ".length)}`,
      "CDN-Cache-Control": cache,
    },
  });
}
