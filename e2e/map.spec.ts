import { test, expect } from "@playwright/test";

test("a map pin links through to its trail page with directions", async ({
  page,
}) => {
  await page.goto("/explore");

  // Mt. LeConte appears as a map pin (and in the fallback list); click one.
  await page
    .getByRole("link", { name: /Mount LeConte/i })
    .first()
    .click();

  await expect(page).toHaveURL(/\/trails\/mt-leconte-alum-cave$/);
  await expect(
    page.getByRole("heading", { name: /Mount LeConte/i }),
  ).toBeVisible();

  // The "Open in Google Maps" button deep-links with the trailhead coordinates.
  await expect(
    page.getByRole("link", { name: /Open in Google Maps/i }),
  ).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/dir\//);
});

test("keyboard: focusing a trail and pressing Enter opens its page", async ({
  page,
}) => {
  await page.goto("/explore");

  // The trail list is the always-available, no-WebGL keyboard/SR path.
  const link = page
    .getByRole("region", { name: /All trails/i })
    .getByRole("link", { name: /Mount LeConte/i });

  await link.focus();
  await expect(link).toBeFocused();
  await link.press("Enter");

  await expect(page).toHaveURL(/\/trails\/mt-leconte-alum-cave$/);
});
