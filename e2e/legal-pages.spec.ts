import { test, expect } from "@playwright/test";

test("privacy and accessibility pages render and are linked from the footer", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { level: 1, name: /privacy/i }),
  ).toBeVisible();
  await expect(page.getByText(/local-first/i)).toBeVisible();

  await page.goto("/accessibility");
  await expect(
    page.getByRole("heading", { level: 1, name: /accessibility/i }),
  ).toBeVisible();
  await expect(page.getByText(/WCAG 2\.2 AA/i)).toBeVisible();

  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("link", { name: /^privacy/i }),
  ).toHaveAttribute("href", "/privacy");
  await expect(
    footer.getByRole("link", { name: /^accessibility/i }),
  ).toHaveAttribute("href", "/accessibility");
});
