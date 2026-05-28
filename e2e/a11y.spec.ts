import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "home", path: "/" },
  { name: "explore", path: "/explore" },
  { name: "trail directory", path: "/trails" },
  { name: "trail detail", path: "/trails/mt-leconte-alum-cave" },
  { name: "contribute", path: "/contribute" },
  { name: "shop", path: "/shop" },
  { name: "product", path: "/shop/trail-tee" },
  { name: "my hikes", path: "/hikes" },
  { name: "credits", path: "/credits" },
  { name: "leaderboard", path: "/leaderboard" },
  { name: "leave no trace", path: "/leave-no-trace" },
];

for (const { name, path } of pages) {
  test(`${name} has no WCAG A/AA accessibility violations`, async ({
    page,
  }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // MapLibre injects its own (labeled) canvas/controls; the accessible
      // path is the trail list, so we scan our own markup.
      .exclude(".maplibregl-map")
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
