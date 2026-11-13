import { fetchTraffic, TRAFFIC_REFRESH_SECONDS } from "@/lib/traffic";

// Visitor totals for the live counts on the page. Runs on request, and
// Vercel's edge caches each answer: a real count for 30 minutes, so the
// analytics behind it is asked about twice an hour however many people are
// on the site, and an empty answer for only 1 minute, so a count that comes
// back (or a newly set key) shows up quickly.
export const dynamic = "force-dynamic";

const EMPTY_RETRY_SECONDS = 60;

export async function GET() {
  const traffic = await fetchTraffic();
  const seconds = traffic ? TRAFFIC_REFRESH_SECONDS : EMPTY_RETRY_SECONDS;
  const cache = `public, s-maxage=${seconds}, stale-while-revalidate=${Math.min(seconds, 300)}`;
  return Response.json(traffic ?? {}, {
    headers: {
      "Cache-Control": `public, max-age=0, ${cache.slice("public, ".length)}`,
      "CDN-Cache-Control": cache,
    },
  });
}
