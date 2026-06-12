import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Sample the settled page: reduce motion so an entrance animation (e.g. the hero
// buttons' `animate-rise`, which fades opacity 0->1) is not caught mid-flight,
// where the half-transparent button lets the decorative ridgeline behind it show
// through and trips a false color-contrast violation.
async function settled(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
}

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
    await settled(page, path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // MapLibre injects its own (labeled) canvas/controls; the accessible
      // path is the trail list, so we scan our own markup.
      .exclude(".maplibregl-map")
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

// Dark mode must also meet AA contrast (#167). Cover a representative subset.
const darkPages = pages.filter((p) =>
  [
    "home",
    "trail directory",
    "trail detail",
    "leaderboard",
    "leave no trace",
  ].includes(p.name),
);

for (const { name, path } of darkPages) {
  test(`${name} has no WCAG A/AA violations in dark mode`, async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {
        /* ignore */
      }
    });
    await settled(page, path);
    await expect(page.locator("html.dark")).toHaveCount(1);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude(".maplibregl-map")
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
