import { describe, it, expect } from "vitest";
import { formatPrice, lineTotal } from "./price";

describe("formatPrice", () => {
  it("formats cents as USD currency", () => {
    expect(formatPrice(2400)).toBe("$24.00");
    expect(formatPrice(500)).toBe("$5.00");
    expect(formatPrice(0)).toBe("$0.00");
  });
});

describe("lineTotal", () => {
  it("multiplies the unit price by quantity", () => {
    expect(lineTotal(2400, 3)).toBe(7200);
    expect(lineTotal(500, 1)).toBe(500);
  });
});
