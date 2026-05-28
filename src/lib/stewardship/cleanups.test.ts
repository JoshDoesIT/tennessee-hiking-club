import { describe, it, expect } from "vitest";
import { logCleanup, getCleanups, replaceCleanups } from "./cleanups";

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

describe("cleanup log", () => {
  it("starts empty", () => {
    expect(getCleanups(memStorage())).toEqual([]);
  });

  it("records cleanups in order", () => {
    const s = memStorage();
    logCleanup("2026-05-27", s);
    logCleanup("2026-05-28", s);
    expect(getCleanups(s)).toEqual([
      { loggedOn: "2026-05-27" },
      { loggedOn: "2026-05-28" },
    ]);
  });

  it("returns an empty list for corrupt storage", () => {
    const s = memStorage();
    s.setItem("thc:cleanups", "{bad");
    expect(getCleanups(s)).toEqual([]);
  });

  it("logs at most one cleanup per day", () => {
    const s = memStorage();
    logCleanup("2026-05-27", s);
    logCleanup("2026-05-27", s);
    expect(getCleanups(s)).toEqual([{ loggedOn: "2026-05-27" }]);
  });

  it("replaceCleanups swaps the whole log (used by account sync)", () => {
    const s = memStorage();
    logCleanup("2026-05-27", s);
    replaceCleanups([{ loggedOn: "2026-01-01" }, { loggedOn: "2026-02-02" }], s);
    expect(getCleanups(s)).toEqual([
      { loggedOn: "2026-01-01" },
      { loggedOn: "2026-02-02" },
    ]);
  });
});
