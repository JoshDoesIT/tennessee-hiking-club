import { describe, it, expect } from "vitest";
import {
  STALE_AFTER_DAYS,
  isStaleReport,
  sortReportsByDateDesc,
  conditionReportUrl,
  highestAlertLevel,
  ALERT_LABEL,
} from "./conditions";

describe("highestAlertLevel", () => {
  it("returns null when there are no alerts", () => {
    expect(highestAlertLevel([])).toBeNull();
  });

  it("returns the most severe level present", () => {
    expect(
      highestAlertLevel([
        { level: "info" },
        { level: "closure" },
        { level: "caution" },
      ]),
    ).toBe("closure");
    expect(highestAlertLevel([{ level: "info" }, { level: "caution" }])).toBe(
      "caution",
    );
    expect(highestAlertLevel([{ level: "info" }])).toBe("info");
  });
});

describe("ALERT_LABEL", () => {
  it("labels each alert level", () => {
    expect(ALERT_LABEL.closure).toBe("Closure");
    expect(ALERT_LABEL.caution).toBe("Caution");
    expect(ALERT_LABEL.info).toBe("Notice");
  });
});

describe("isStaleReport", () => {
  const now = new Date("2026-05-28T12:00:00Z");

  it("treats a recent report as fresh", () => {
    expect(isStaleReport("2026-05-20", now)).toBe(false);
  });

  it("treats a report older than the threshold as stale", () => {
    expect(isStaleReport("2026-01-01", now)).toBe(true);
  });

  it("uses a 30-day threshold", () => {
    expect(STALE_AFTER_DAYS).toBe(30);
  });
});

describe("sortReportsByDateDesc", () => {
  it("orders newest first without mutating the input", () => {
    const reports = [
      { date: "2026-01-01", status: "Open" },
      { date: "2026-03-01", status: "Muddy" },
      { date: "2026-02-01", status: "Caution" },
    ];
    const sorted = sortReportsByDateDesc(reports);
    expect(sorted.map((r) => r.date)).toEqual([
      "2026-03-01",
      "2026-02-01",
      "2026-01-01",
    ]);
    expect(reports[0].date).toBe("2026-01-01");
  });
});

describe("conditionReportUrl", () => {
  it("links to the prefilled condition-report issue form", () => {
    const url = conditionReportUrl({
      slug: "virgin-falls",
      name: "Virgin Falls",
    });
    expect(url).toContain("/issues/new");
    expect(url).toContain("template=trail_condition.yml");
    expect(url).toContain("trail=Virgin+Falls");
  });
});
