import { describe, it, expect } from "vitest";
import { getPledge, takePledge, clearPledge } from "./pledge";

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

describe("steward pledge", () => {
  it("starts unpledged", () => {
    expect(getPledge(memStorage())).toBeNull();
  });

  it("records and clears a pledge", () => {
    const s = memStorage();
    takePledge("2026-05-27", s);
    expect(getPledge(s)).toEqual({ pledgedOn: "2026-05-27" });
    clearPledge(s);
    expect(getPledge(s)).toBeNull();
  });

  it("returns null for corrupt storage", () => {
    const s = memStorage();
    s.setItem("thc:steward-pledge", "{bad");
    expect(getPledge(s)).toBeNull();
  });
});
