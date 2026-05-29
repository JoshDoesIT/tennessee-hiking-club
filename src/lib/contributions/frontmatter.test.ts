import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import { yamlScalar, appendListItem } from "./frontmatter";

describe("yamlScalar", () => {
  it("double-quotes and escapes a value", () => {
    expect(yamlScalar('a "b" \\c')).toBe('"a \\"b\\" \\\\c"');
  });
});

describe("appendListItem", () => {
  const item = ['  - src: "/p.jpg"', '    alt: "A photo"'].join("\n");

  it("inserts under an existing key, preserving other front-matter", () => {
    const file = [
      "---",
      "slug: x",
      "photos:",
      '  - src: "/old.jpg"',
      "    alt: Old",
      "summary: s",
      "---",
      "",
      "Body.",
    ].join("\n");
    const out = appendListItem(file, "photos", item);
    const { data, content } = matter(out);
    expect(data.photos).toHaveLength(2);
    expect(data.photos).toContainEqual(
      expect.objectContaining({ src: "/p.jpg", alt: "A photo" }),
    );
    expect(data.summary).toBe("s");
    expect(content.trim()).toBe("Body.");
  });

  it("creates the key when absent", () => {
    const file = ["---", "slug: x", "---", "", "Body."].join("\n");
    const out = appendListItem(file, "photos", item);
    expect(matter(out).data.photos).toHaveLength(1);
  });

  it("handles an inline empty list", () => {
    const file = ["---", "slug: x", "photos: []", "---", "", "B."].join("\n");
    const out = appendListItem(file, "photos", item);
    expect(matter(out).data.photos).toHaveLength(1);
  });
});
