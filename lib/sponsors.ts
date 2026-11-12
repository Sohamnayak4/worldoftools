import DodoPayments from "dodopayments";
import { unstable_cache } from "next/cache";
import { AD_PLANS, MAX_SPONSORS, type Sponsor, TAKEN_DOWN } from "./ads";

// Current ads, read from Dodo Payments. A successful payment with ad
// details in its metadata is an ad. It runs for its plan's days from the
// moment it was paid. Refunded payments and TAKEN_DOWN ids are left out.
// No database: Dodo is the record.

export const SPONSORS_TAG = "sponsors";
const DAY = 24 * 60 * 60 * 1000;
// Longest plan, so older payments can be skipped.
const LOOKBACK_DAYS = Math.max(...AD_PLANS.map((plan) => plan.days)) + 1;

export function dodoClient(): DodoPayments | null {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) return null;
  return new DodoPayments({
    bearerToken: apiKey,
    environment:
      process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode" ? "test_mode" : "live_mode",
  });
}

async function fetchSponsors(): Promise<Sponsor[]> {
  const client = dodoClient();
  if (!client) return [];
  const now = Date.now();
  const since = new Date(now - LOOKBACK_DAYS * DAY).toISOString();

  const found: { sponsor: Sponsor; paidAt: number }[] = [];
  try {
    for await (const payment of client.payments.list({
      status: "succeeded",
      created_at_gte: since,
      page_size: 100,
    })) {
      const meta = payment.metadata ?? {};
      const plan = AD_PLANS.find((item) => item.id === meta.ad_plan);
      if (!plan || TAKEN_DOWN.includes(payment.payment_id)) continue;
      const paidAt = Date.parse(payment.created_at);
      const until = paidAt + plan.days * DAY;
      if (!(until > now)) continue;
      found.push({
        paidAt,
        sponsor: {
          id: payment.payment_id,
          name: String(meta.ad_name ?? "").slice(0, 30),
          url: String(meta.ad_url ?? ""),
          text: String(meta.ad_text ?? "").slice(0, 60),
          until: new Date(until).toISOString(),
        },
      });
    }

    // The list does not show refunds, so check each current ad.
    const live: typeof found = [];
    for (const item of found) {
      const payment = await client.payments.retrieve(item.sponsor.id);
      const refunded = (payment.refunds ?? []).some(
        (refund) => refund.status === "succeeded",
      );
      if (!refunded && item.sponsor.url.startsWith("https://")) live.push(item);
    }
    // First paid, first shown.
    return live
      .sort((a, b) => a.paidAt - b.paidAt)
      .slice(0, MAX_SPONSORS)
      .map((item) => item.sponsor);
  } catch {
    // If Dodo cannot be reached, the slots show as free rather than breaking
    // the page. The next refresh tries again.
    return [];
  }
}

// Shared by every page and refreshed every 10 minutes, or at once when the
// Dodo webhook reports a payment or refund.
export const getSponsors = unstable_cache(fetchSponsors, ["sponsors"], {
  tags: [SPONSORS_TAG],
  revalidate: 600,
});
