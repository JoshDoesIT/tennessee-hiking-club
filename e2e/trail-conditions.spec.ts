import { test, expect } from "@playwright/test";

test("trail detail shows conditions, a pinned alert, and a report link", async ({
  page,
}) => {
  await page.goto("/trails/virgin-falls");

  await expect(
    page.getByRole("heading", { name: /trail conditions/i }),
  ).toBeVisible();

  // Pinned alert from the trail's front-matter.
  await expect(
    page.getByText(/creek crossings can be impassable/i),
  ).toBeVisible();

  // The recent condition report.
  await expect(page.getByText("Open", { exact: true })).toBeVisible();

  // Report link, deep-linked to the prefilled issue form.
  const link = page.getByRole("link", {
    name: /report current conditions/i,
  });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    "href",
    /template=trail_condition\.yml/,
  );
});
