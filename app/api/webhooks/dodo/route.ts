import { revalidatePath, revalidateTag } from "next/cache";
import { SPONSORS_TAG, dodoClient } from "@/lib/sponsors";

// Dodo Payments calls this when a payment or refund happens. A paid ad then
// shows within seconds, and a refunded one disappears, instead of waiting
// for the 10 minute refresh. The request is checked with the webhook secret.

const REFRESH_ON = new Set([
  "payment.succeeded",
  "refund.succeeded",
  "dispute.opened",
  "dispute.lost",
]);

export async function POST(request: Request) {
  const key = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  const client = dodoClient();
  if (!key || !client) {
    return Response.json({ error: "Webhook is not set up." }, { status: 503 });
  }

  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  let type: string;
  try {
    type = client.webhooks.unwrap(body, { headers, key }).type;
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  if (REFRESH_ON.has(type)) {
    revalidateTag(SPONSORS_TAG, { expire: 0 });
    revalidatePath("/", "layout");
  }
  return Response.json({ received: true });
}
