import { describe, it, expect } from "vitest";
import { trailAlertNotification } from "./payload";

const leconte = { name: "Mount LeConte", slug: "mount-leconte" };

describe("trailAlertNotification", () => {
  it("titles a closure with its label and the trail, and links to the trail", () => {
    const n = trailAlertNotification(leconte, {
      level: "closure",
      message: "Alum Cave Trail is closed for bridge repair.",
    });
    expect(n.title).toBe("Closure: Mount LeConte");
    expect(n.body).toBe("Alum Cave Trail is closed for bridge repair.");
    expect(n.data).toEqual({
      trailSlug: "mount-leconte",
      url: "/trails/mount-leconte",
    });
  });

  it("uses the human label for each level", () => {
    expect(
      trailAlertNotification(leconte, { level: "caution", message: "Ice." })
        .title,
    ).toBe("Caution: Mount LeConte");
    expect(
      trailAlertNotification(leconte, { level: "info", message: "Reroute." })
        .title,
    ).toBe("Notice: Mount LeConte");
  });
});
