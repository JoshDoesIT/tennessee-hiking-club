export type OrderSummary = {
  eventId: string;
  slug?: string;
  size?: string;
  color?: string;
  email?: string | null;
};

/**
 * Per-instance record of handled Stripe event ids. Stripe delivers at least
 * once, so duplicates must be ignored. This Set is sufficient within a warm
 * Fluid Compute instance; back it with a durable store if order volume grows.
 */
const processed = new Set<string>();

/**
 * Run `submit` for an order at most once per Stripe event. Returns true if it
 * submitted, false if the event was already handled. `seen` is injectable for
 * tests.
 */
export async function fulfillOnce(
  order: OrderSummary,
  submit: (order: OrderSummary) => Promise<void>,
  seen: Set<string> = processed,
): Promise<boolean> {
  if (seen.has(order.eventId)) return false;
  seen.add(order.eventId);
  await submit(order);
  return true;
}

/**
 * Submit a paid order to Printful for print-on-demand fulfillment. No-ops with
 * a warning until `PRINTFUL_API_KEY` is set, so the webhook can ack Stripe even
 * before the store goes live. The slug→variant mapping and the recipient (from
 * the Stripe session's shipping details) are finalized at go-live (#28).
 */
export async function submitToPrintful(order: OrderSummary): Promise<void> {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) {
    console.warn(
      `[fulfillment] PRINTFUL_API_KEY not set; order for "${order.slug}" (event ${order.eventId}) was not submitted`,
    );
    return;
  }

  const res = await fetch("https://api.printful.com/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ external_id: order.eventId }),
  });
  if (!res.ok) {
    throw new Error(`Printful order submission failed: ${res.status}`);
  }
}
