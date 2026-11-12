import { fetchTraffic } from "@/lib/traffic";

// Visitor totals for the live counts on the page. Cached at the edge and
// rebuilt at most every 30 seconds, so Pixelmoth sees one request per 30
// seconds however many people are on the site.
export const revalidate = 30;

export async function GET() {
  const traffic = await fetchTraffic();
  return Response.json(traffic ?? {});
}
