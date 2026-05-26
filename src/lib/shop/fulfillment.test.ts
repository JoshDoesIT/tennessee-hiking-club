import { describe, it, expect, vi } from "vitest";
import { fulfillOnce } from "./fulfillment";

describe("fulfillOnce", () => {
  it("submits once and skips duplicate events (idempotent)", async () => {
    const submit = vi.fn(async () => {});
    const seen = new Set<string>();
    const order = { eventId: "evt_1", slug: "trail-tee" };

    expect(await fulfillOnce(order, submit, seen)).toBe(true);
    expect(await fulfillOnce(order, submit, seen)).toBe(false);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("submits distinct events", async () => {
    const submit = vi.fn(async () => {});
    const seen = new Set<string>();

    await fulfillOnce({ eventId: "evt_1", slug: "a" }, submit, seen);
    await fulfillOnce({ eventId: "evt_2", slug: "b" }, submit, seen);
    expect(submit).toHaveBeenCalledTimes(2);
  });
});
