import { cookies } from "next/headers";
import { AD_PLANS, MAX_SPONSORS, checkAdRequest } from "@/lib/ads";
import { dodoClient, getSponsors } from "@/lib/sponsors";

// Starts a Dodo Payments checkout for an ad. Receives only the short ad
// details from the advertise form, never a file.

const PRODUCTS: Record<string, string | undefined> = {
  "7d": process.env.DODO_PRODUCT_AD_7_DAYS,
  "30d": process.env.DODO_PRODUCT_AD_30_DAYS,
};

const fail = (message: string, status: number) =>
  Response.json({ error: message }, { status });

export async function POST(request: Request) {
  const client = dodoClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("The form could not be read. Reload the page and try again.", 400);
  }
  const checked = checkAdRequest(body);
  if (!checked.ok) return fail(checked.message, 400);
  const { ad } = checked;

  const productId = PRODUCTS[ad.plan];
  if (!client || !productId) {
    return fail("Ad checkout is not set up yet. Try again later.", 503);
  }
  if ((await getSponsors()).length >= MAX_SPONSORS) {
    return fail("All ad slots are taken right now. Try again in a few days.", 409);
  }

  // Pixelmoth's visitor and session ids, so the sale is credited to the page
  // and source that brought the advertiser here.
  const jar = await cookies();
  const origin = new URL(request.url).origin;
  const plan = AD_PLANS.find((item) => item.id === ad.plan);

  try {
    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: `${origin}/advertise/thanks`,
      cancel_url: `${origin}/advertise`,
      metadata: {
        ad_plan: ad.plan,
        ad_days: plan?.days ?? 0,
        ad_name: ad.name,
        ad_url: ad.url,
        ad_text: ad.text,
        pm_visitor_id: jar.get("pm_vid")?.value ?? "",
        pm_session_id: jar.get("pm_sid")?.value ?? "",
      },
    });
    if (!session.checkout_url) {
      return fail("The payment page could not be opened. Try again.", 502);
    }
    return Response.json({ url: session.checkout_url });
  } catch {
    return fail("The payment page could not be opened. Try again in a minute.", 502);
  }
}
