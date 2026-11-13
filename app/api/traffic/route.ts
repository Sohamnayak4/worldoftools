import { fetchTraffic } from "@/lib/traffic";

// Visitor totals for the live counts on the page. Cached at the edge for 30
// minutes, so Pixelmoth (or Vercel's analytics API) is asked about twice an
// hour however many people are on the site. Must match
// TRAFFIC_REFRESH_SECONDS; a segment config has to be a literal number.
export const revalidate = 1800;

export async function GET() {
  const traffic = await fetchTraffic();
  return Response.json(traffic ?? {}, {
    headers: {
      // Explicit edge caching, in case the route is ever rendered dynamically.
      "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=300",
      "CDN-Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
    },
  });
}
