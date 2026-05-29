import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import { validateConditionSubmission, generateConditionEntry } from "./condition";

describe("validateConditionSubmission", () => {
  const valid = { trailSlug: "virgin-falls", status: "Muddy near the base" };

  it("accepts a slug and a status, with an optional note", () => {
    expect(validateConditionSubmission(valid).success).toBe(true);
    expect(
      validateConditionSubmission({ ...valid, note: "Bring poles." }).success,
    ).toBe(true);
  });

  it("rejects a missing trail slug or status", () => {
    expect(validateConditionSubmission({ status: "Open" }).success).toBe(false);
    expect(
      validateConditionSubmission({ trailSlug: "virgin-falls" }).success,
    ).toBe(false);
  });

  it("rejects an empty status", () => {
    expect(
      validateConditionSubmission({ ...valid, status: "   " }).success,
    ).toBe(false);
  });
});

describe("generateConditionEntry", () => {
  const report = {
    date: "2026-05-29",
    status: "Muddy: slick near the base",
    note: "Bring poles.",
    by: "trail-ann",
  };

  it("produces a conditionReports YAML entry that round-trips through the schema", () => {
    const entry = generateConditionEntry(report);
    expect(entry.valid).toBe(true);

    const doc = matter(`---\nconditionReports:\n${entry.yaml}\n---\n`);
    expect(doc.data.conditionReports[0]).toMatchObject({
      date: "2026-05-29",
      status: "Muddy: slick near the base",
      note: "Bring poles.",
      by: "trail-ann",
    });
  });

  it("omits an absent note", () => {
    const entry = generateConditionEntry({ date: "2026-05-29", status: "Open" });
    expect(entry.yaml).not.toContain("note:");
    expect(entry.valid).toBe(true);
  });
});
