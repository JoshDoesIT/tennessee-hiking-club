import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import {
  validateConditionSubmission,
  generateConditionEntry,
  appendConditionReport,
} from "./condition";

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

describe("appendConditionReport", () => {
  const newReport = {
    date: "2026-05-29",
    status: "Muddy",
    note: "Slick.",
    by: "trail-ann",
  };

  it("appends to an existing conditionReports list, preserving entries", () => {
    const file = [
      "---",
      "slug: virgin-falls",
      "name: Virgin Falls",
      "conditionReports:",
      '  - date: "2026-05-24"',
      "    status: Open",
      "parking:",
      "  lat: 35.8270",
      "---",
      "",
      "Body text.",
    ].join("\n");

    const out = appendConditionReport(file, newReport);
    const { data, content } = matter(out);
    expect(data.conditionReports).toHaveLength(2);
    expect(data.conditionReports).toContainEqual(
      expect.objectContaining({ date: "2026-05-24", status: "Open" }),
    );
    expect(data.conditionReports).toContainEqual(
      expect.objectContaining({
        date: "2026-05-29",
        status: "Muddy",
        note: "Slick.",
        by: "trail-ann",
      }),
    );
    // Other front-matter and the body are untouched.
    expect(data.parking).toMatchObject({ lat: 35.827 });
    expect(content.trim()).toBe("Body text.");
  });

  it("creates the key when the trail has no condition reports yet", () => {
    const file = ["---", "slug: x", "name: X", "---", "", "Body."].join("\n");
    const out = appendConditionReport(file, newReport);
    const { data } = matter(out);
    expect(data.conditionReports).toHaveLength(1);
    expect(data.conditionReports[0]).toMatchObject({ status: "Muddy" });
  });

  it("handles an inline empty list", () => {
    const file = [
      "---",
      "slug: x",
      "name: X",
      "conditionReports: []",
      "---",
      "",
      "Body.",
    ].join("\n");
    const out = appendConditionReport(file, newReport);
    const { data } = matter(out);
    expect(data.conditionReports).toHaveLength(1);
  });
});
