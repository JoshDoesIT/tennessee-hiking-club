import { test, expect } from "@playwright/test";

test("trail detail shows parking info with a directions-to-parking link", async ({
  page,
}) => {
  await page.goto("/trails/virgin-falls");

  await expect(page.getByText(/free gravel lot at the trailhead/i)).toBeVisible();
  await expect(page.getByText(/access road is rough/i)).toBeVisible();

  const link = page.getByRole("link", { name: /directions to parking/i });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", /maps\/dir/);
});

test("a trail with no declared parking shows the OSM fallback, attributed", async ({
  page,
}) => {
  // burgess-falls declares no parking; the cached OSM lot fills in (#141).
  await page.goto("/trails/burgess-falls");

  await expect(page.getByText(/nearest parking from openstreetmap/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /directions to parking/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /openstreetmap/i }),
  ).toHaveAttribute("href", /openstreetmap\.org/);
});
