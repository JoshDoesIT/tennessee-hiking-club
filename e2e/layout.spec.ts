import { test, expect, type Page } from "@playwright/test";

/**
 * Guard against horizontal overflow ("the page spills off to the right"). The
 * stylized Tennessee map's pin tooltips are absolutely positioned and
 * `whitespace-nowrap`, so a right-edge pin's label can push past the viewport.
 */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

for (const path of ["/", "/hikes"]) {
  test(`${path} has no horizontal overflow on a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}
