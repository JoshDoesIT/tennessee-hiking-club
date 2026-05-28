import { test, expect } from "@playwright/test";

test("logging a hike persists locally and shows on My hikes", async ({
  page,
}) => {
  await page.goto("/trails/fall-creek-falls");

  await page.getByRole("button", { name: /mark as hiked/i }).click();
  await expect(page.getByRole("button", { name: /^hiked$/i })).toBeVisible();

  await page.goto("/hikes");
  await expect(page.getByRole("heading", { name: /my hikes/i })).toBeVisible();
  // Target the My-hikes list link by its exact name. The stylized map also
  // renders a pin link for the trail, whose accessible name is the longer
  // "Fall Creek Falls, Middle Tennessee. Hiked." aria-label.
  await expect(
    page.getByRole("link", { name: "Fall Creek Falls", exact: true }),
  ).toBeVisible();
});

