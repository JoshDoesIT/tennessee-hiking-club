# 0004 — Merch store (Stripe + print-on-demand)

- **Status:** Draft
- **Milestone:** M7 (checkout) → M8 (fulfillment)
- **Issue:** TBD

## Problem

A small merch shop (tees, stickers, hats) to help fund hosting and the domain —
with **no inventory, no monthly fees**, fully within the free tier.

## User stories

- As a supporter, I want to buy club merch in a few clicks.
- As a maintainer, I want orders printed and shipped automatically, holding no
  stock and paying no monthly fee.

## Acceptance criteria (M7 — catalog & checkout)

- [ ] `/shop` lists products (title, image, price) from a typed, validated
      product catalog (Zod, mirroring spec 0001's pattern).
- [ ] `/shop/[product]` shows details and variants (size/color).
- [ ] "Buy" creates a **Stripe Checkout** session via a route handler
      (`/api/checkout`) and redirects to Stripe; success/cancel routes exist.
- [ ] Secret keys come from environment variables only (never committed); Stripe
      is mocked in tests (MSW) — no live calls in CI.
- [ ] Prices/inventory are server-validated (no client-trusted amounts).

## Acceptance criteria (M8 — fulfillment)

- [ ] On `checkout.session.completed`, a verified Stripe webhook
      (`/api/webhooks/stripe`) submits the order to Printful/Printify.
- [ ] Webhook signature is verified; replay/duplicate events are idempotent.
- [ ] Customer receives an order confirmation.

## Non-goals

- Accounts/login, subscriptions, discount codes (later, if ever).

## Technical approach

- Stripe Checkout (hosted) to avoid handling card data/PCI. Printful/Printify
  API for print-on-demand. Both have no monthly fee. Vercel env vars for keys;
  OIDC where supported.

## Test plan

- Unit: catalog schema validation; price calculation.
- Integration: checkout route builds the correct session payload (Stripe mocked).
- Integration: webhook rejects bad signatures and is idempotent.

> Depends on you creating Stripe and Printful/Printify accounts (see README /
> ONBOARDING). No work starts here until M6 (v1) has shipped.
