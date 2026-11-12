import { fetchTraffic } from "@/lib/traffic";

// Visitor totals for the live counts on the page. Cached at the edge for 30
// seconds, so Pixelmoth sees about one request per 30 seconds however many
// people are on the site.
export const revalidate = 30;

export async function GET() {
  const traffic = await fetchTraffic();
  return Response.json(traffic ?? {}, {
    headers: {
      // Explicit edge caching, in case the route is ever rendered dynamically.
      "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=30",
      "CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
    },
  });
}
