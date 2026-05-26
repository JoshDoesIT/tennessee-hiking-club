import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getProductBySlug } from "@/lib/shop";
import { SITE_URL } from "@/lib/site";

const MAX_QUANTITY = 10;

/**
 * Create a Stripe Checkout session for a single product and redirect to the
 * hosted checkout. The amount is taken from the server-validated catalog, never
 * from the client. The secret key comes only from the environment; with no key
 * configured the route returns 503 so the storefront degrades gracefully.
 */
export async function POST(req: Request): Promise<Response> {
  const form = await req.formData();
  const slug = String(form.get("slug") ?? "");
  const size = form.get("size") ? String(form.get("size")) : undefined;
  const color = form.get("color") ? String(form.get("color")) : undefined;

  const rawQty = Number(form.get("quantity") ?? 1);
  const quantity = Math.min(
    Math.max(Number.isFinite(rawQty) ? Math.floor(rawQty) : 1, 1),
    MAX_QUANTITY,
  );

  const product = getProductBySlug(slug);
  if (!product || !product.available) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Checkout is not configured" },
      { status: 503 },
    );
  }

  const stripe = new Stripe(key);
  const variant = [size, color].filter(Boolean).join(" / ");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity,
        price_data: {
          currency: product.currency.toLowerCase(),
          unit_amount: product.priceCents,
          product_data: {
            name: variant ? `${product.name} (${variant})` : product.name,
            images: [`${SITE_URL}${product.image.src}`],
          },
        },
      },
    ],
    success_url: `${SITE_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/shop/cancel`,
    metadata: { slug: product.slug, size: size ?? "", color: color ?? "" },
  });

  return NextResponse.redirect(session.url ?? `${SITE_URL}/shop/cancel`, 303);
}
