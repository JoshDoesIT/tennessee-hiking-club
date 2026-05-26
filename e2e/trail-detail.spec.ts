import { test, expect } from "@playwright/test";

test("a known trail page loads with its stats and gallery", async ({
  page,
}) => {
  await page.goto("/trails/mt-leconte-alum-cave");

  await expect(
    page.getByRole("heading", { name: /Mount LeConte/i }),
  ).toBeVisible();
  await expect(page.getByText(/11 mi/).first()).toBeVisible();
  await expect(page.getByText(/strenuous/i).first()).toBeVisible();
  await expect(page.getByRole("img").first()).toBeVisible();

  // Open in Google Maps deep-links with the trailhead coordinates.
  await expect(
    page.getByRole("link", { name: /Open in Google Maps/i }),
  ).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/dir\//);
});

test("an unknown trail slug returns 404", async ({ page }) => {
  const res = await page.goto("/trails/does-not-exist");
  expect(res?.status()).toBe(404);
});
