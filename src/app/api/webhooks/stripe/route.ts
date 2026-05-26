import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  fulfillOnce,
  submitToPrintful,
  type OrderSummary,
} from "@/lib/shop/fulfillment";

/**
 * Stripe webhook: verifies the signature, then on `checkout.session.completed`
 * submits the order to Printful exactly once (Stripe delivers at least once, so
 * duplicates are ignored). Keys come only from the environment; with none set
 * the route returns 503. The customer's order confirmation is Stripe Checkout's
 * built-in receipt (enabled on the Stripe account at go-live, #28).
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  const stripe = new Stripe(key);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const order: OrderSummary = {
      eventId: event.id,
      slug: session.metadata?.slug,
      size: session.metadata?.size || undefined,
      color: session.metadata?.color || undefined,
      email: session.customer_details?.email ?? null,
    };
    try {
      await fulfillOnce(order, submitToPrintful);
    } catch (err) {
      console.error("[webhook] fulfillment error", err);
      return NextResponse.json(
        { error: "Fulfillment failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
