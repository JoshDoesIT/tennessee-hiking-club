import { describe, it, expect, vi } from "vitest";
import { notifyTrailAlert, type PushSender } from "./send";

const trail = { name: "Mount LeConte", slug: "mount-leconte" };
const alert = { level: "closure" as const, message: "Alum Cave closed." };

function dbWith(subs: Array<{ token: string; platform: string }>) {
  return { select: () => ({ from: async () => subs }) };
}

describe("notifyTrailAlert", () => {
  it("sends the built notification to every subscribed device", async () => {
    const send = vi.fn<PushSender>(async () => true);
    const result = await notifyTrailAlert({
      trail,
      alert,
      db: dbWith([
        { token: "a", platform: "ios" },
        { token: "b", platform: "android" },
      ]),
      send,
    });

    expect(result).toEqual({ recipients: 2, sent: 2, failed: 0 });
    expect(send).toHaveBeenCalledTimes(2);
    const [target, notification] = send.mock.calls[0];
    expect(target).toEqual({ token: "a", platform: "ios" });
    expect(notification.title).toBe("Closure: Mount LeConte");
    expect(notification.data.url).toBe("/trails/mount-leconte");
  });

  it("counts failures and keeps going (a bad token must not stop the rest)", async () => {
    const send = vi
      .fn<PushSender>()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error("bad token"))
      .mockResolvedValueOnce(true);
    const result = await notifyTrailAlert({
      trail,
      alert,
      db: dbWith([
        { token: "a", platform: "ios" },
        { token: "b", platform: "ios" },
        { token: "c", platform: "ios" },
      ]),
      send,
    });
    expect(result).toEqual({ recipients: 3, sent: 1, failed: 2 });
  });

  it("does nothing when there are no subscribers", async () => {
    const send = vi.fn<PushSender>(async () => true);
    const result = await notifyTrailAlert({ trail, alert, db: dbWith([]), send });
    expect(result).toEqual({ recipients: 0, sent: 0, failed: 0 });
    expect(send).not.toHaveBeenCalled();
  });
});
