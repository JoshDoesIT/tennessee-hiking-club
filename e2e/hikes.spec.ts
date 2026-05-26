import { test, expect } from "@playwright/test";

test("logging a hike persists locally and shows on My hikes", async ({
  page,
}) => {
  await page.goto("/trails/fall-creek-falls");

  await page.getByRole("button", { name: /mark as hiked/i }).click();
  await expect(page.getByRole("button", { name: /^hiked$/i })).toBeVisible();

  await page.goto("/hikes");
  await expect(page.getByRole("heading", { name: /my hikes/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Fall Creek Falls/i }),
  ).toBeVisible();
});
