import { test, expect } from "@playwright/test";

test("a trail with a route shows an elevation profile and a GPX download", async ({
  page,
}) => {
  await page.goto("/trails/mt-leconte-alum-cave");

  await expect(
    page.getByRole("heading", { name: /^elevation$/i }),
  ).toBeVisible();

  // Text summary (the accessible alternative to the chart).
  await expect(page.getByText(/2,763 ft of climbing/i)).toBeVisible();

  await expect(
    page.getByRole("button", { name: /download gpx/i }),
  ).toBeVisible();
});
