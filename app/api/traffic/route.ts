import { fetchTraffic } from "@/lib/traffic";

// Visitor totals for the live counts on the page. Cached at the edge for 5
// minutes, matching Pixelmoth's own cache, so its database is asked about
// once every 5 minutes however many people are on the site. Each ask reads
// every visitor row, which counts against Cloudflare's D1 daily limit.
export const revalidate = 300;

export async function GET() {
  const traffic = await fetchTraffic();
  return Response.json(traffic ?? {}, {
    headers: {
      // Explicit edge caching, in case the route is ever rendered dynamically.
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
      "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
