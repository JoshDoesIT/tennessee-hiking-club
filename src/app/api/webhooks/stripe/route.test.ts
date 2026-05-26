import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  submit: vi.fn(async () => {}),
}));

vi.mock("stripe", () => ({
  default: vi.fn(function () {
    return { webhooks: { constructEvent: mocks.constructEvent } };
  }),
}));

vi.mock("@/lib/shop/fulfillment", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/shop/fulfillment")>();
  return { ...actual, submitToPrintful: mocks.submit };
});

import { POST } from "./route";

function evtReq(sig = "good") {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": sig },
    body: "{}",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
});

describe("POST /api/webhooks/stripe", () => {
  it("rejects a bad signature with 400 and does not fulfill", async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    const res = await POST(evtReq("bad"));
    expect(res.status).toBe(400);
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("fulfills checkout.session.completed once, ignoring replays", async () => {
    mocks.constructEvent.mockReturnValue({
      id: "evt_completed_1",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { slug: "trail-tee", size: "M" },
          customer_details: { email: "hiker@example.com" },
        },
      },
    });
    const res1 = await POST(evtReq());
    const res2 = await POST(evtReq()); // replay of the same event id

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    expect((mocks.submit as Mock).mock.calls[0][0]).toMatchObject({
      eventId: "evt_completed_1",
      slug: "trail-tee",
      size: "M",
    });
  });

  it("acks unrelated event types without fulfilling", async () => {
    mocks.constructEvent.mockReturnValue({
      id: "evt_other_1",
      type: "payment_intent.created",
      data: { object: {} },
    });
    const res = await POST(evtReq());
    expect(res.status).toBe(200);
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("returns 503 when the webhook secret is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(evtReq());
    expect(res.status).toBe(503);
  });
});
