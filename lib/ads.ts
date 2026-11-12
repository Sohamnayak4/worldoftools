// Sponsored placements. Ads are sold for a fixed number of days through Dodo
// Payments. A paid ad goes live by itself: its details travel in the payment
// metadata, and lib/sponsors.ts reads current ads straight from Dodo.

export type AdPlan = { id: "7d" | "30d"; days: number; price: string };

export const AD_PLANS: AdPlan[] = [
  { id: "7d", days: 7, price: "$6.99" },
  { id: "30d", days: 30, price: "$19.99" },
];

// Ad slots shown at once. Each paid ad takes one slot for its days.
export const MAX_SPONSORS = 4;

export type Sponsor = {
  // Dodo payment id. Used as the key and to take an ad down.
  id: string;
  name: string;
  // Where the ad links to.
  url: string;
  // One short line, 60 characters or fewer.
  text: string;
  // The sponsor site's icon as a data URL, fetched by the server. Null if
  // the site has none we can use.
  icon: string | null;
  // When the ad stops showing, as an ISO date and time.
  until: string;
};

// Payment ids of ads taken down by hand. Refunding a payment in Dodo also
// removes its ad, so this list is only needed when an ad must go without a
// refund.
export const TAKEN_DOWN: string[] = [];

// Limits on what an advertiser can send. Shared by the form and the server.
export const AD_LIMITS = { name: 30, text: 60, url: 200 };

export type AdRequest = { plan: AdPlan["id"]; name: string; url: string; text: string };

export function checkAdRequest(input: unknown):
  | { ok: true; ad: AdRequest }
  | { ok: false; message: string } {
  if (typeof input !== "object" || input === null) {
    return { ok: false, message: "The form could not be read. Reload the page and try again." };
  }
  const value = input as Record<string, unknown>;
  const plan = value.plan;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const text = typeof value.text === "string" ? value.text.trim() : "";
  const url = typeof value.url === "string" ? value.url.trim() : "";
  if (plan !== "7d" && plan !== "30d") return { ok: false, message: "Choose 7 or 30 days." };
  if (name === "" || name.length > AD_LIMITS.name) {
    return { ok: false, message: `Type a name of up to ${AD_LIMITS.name} characters.` };
  }
  if (text === "" || text.length > AD_LIMITS.text) {
    return { ok: false, message: `Type a line of up to ${AD_LIMITS.text} characters.` };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, message: "Type the full link, starting with https://" };
  }
  if (parsed.protocol !== "https:" || url.length > AD_LIMITS.url) {
    return { ok: false, message: "The link must start with https:// and be under 200 characters." };
  }
  return { ok: true, ad: { plan, name, url: parsed.toString(), text } };
}
