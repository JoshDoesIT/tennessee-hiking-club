import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// Stripe is mocked so no live calls happen in CI.
const mocks = vi.hoisted(() => ({
  create: vi.fn(async () => ({
    id: "cs_test_123",
    url: "https://checkout.stripe.com/pay/cs_test_123",
  })),
}));
vi.mock("stripe", () => ({
  default: vi.fn(function () {
    return { checkout: { sessions: { create: mocks.create } } };
  }),
}));

import { POST } from "./route";

function formReq(fields: Record<string, string>) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
});

describe("POST /api/checkout", () => {
  it("builds a session with the server-side price and redirects to Stripe", async () => {
    const res = await POST(
      formReq({ slug: "trail-tee", size: "M", quantity: "2" }),
    );

    expect(mocks.create).toHaveBeenCalledTimes(1);
    const arg = (mocks.create as Mock).mock.calls[0][0];
    expect(arg.mode).toBe("payment");
    expect(arg.line_items[0].quantity).toBe(2);
    // Price comes from the validated server catalog, not the client.
    expect(arg.line_items[0].price_data.unit_amount).toBe(2400);
    expect(arg.line_items[0].price_data.currency).toBe("usd");
    expect(arg.success_url).toContain("/shop/success");
    expect(arg.cancel_url).toContain("/shop/cancel");
    expect(arg.metadata).toMatchObject({ slug: "trail-tee", size: "M" });

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "https://checkout.stripe.com/pay/cs_test_123",
    );
  });

  it("clamps quantity to a sane range", async () => {
    await POST(formReq({ slug: "trail-tee", quantity: "999" }));
    expect((mocks.create as Mock).mock.calls[0][0].line_items[0].quantity).toBe(
      10,
    );
  });

  it("returns 404 for an unknown product and never calls Stripe", async () => {
    const res = await POST(formReq({ slug: "does-not-exist", quantity: "1" }));
    expect(res.status).toBe(404);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 503 when Stripe is not configured", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await POST(formReq({ slug: "trail-tee", quantity: "1" }));
    expect(res.status).toBe(503);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
