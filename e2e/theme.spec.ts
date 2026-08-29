import { test, expect, type Page } from "@playwright/test";

/**
 * The ridgeline hero crossfades a setting sun (day) into a crescent moon
 * (night). Regression guard for the sun staying lit at night: `animate-sun`
 * sets `opacity` from its keyframes, which overrides a plain `opacity:0` on the
 * same element, so the dark-mode fade-out must live on a separate wrapper.
 */
async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* ignore */
    }
  }, theme);
}

test("by day the hero shows the sun and hides the moon", async ({ page }) => {
  await setTheme(page, "light");
  await page.goto("/");
  await expect(page.locator('[data-celestial="sun"]')).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator('[data-celestial="moon"]')).toHaveCSS(
    "opacity",
    "0",
  );
});

test("at night the hero shows the moon and fully hides the sun", async ({
  page,
}) => {
  await setTheme(page, "dark");
  await page.goto("/");
  await expect(page.locator("html.dark")).toHaveCount(1);
  // The sun must be fully transparent at night, even though it animates.
  await expect(page.locator('[data-celestial="sun"]')).toHaveCSS(
    "opacity",
    "0",
  );
  await expect(page.locator('[data-celestial="moon"]')).toHaveCSS(
    "opacity",
    "1",
  );
});
