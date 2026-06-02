import { test, expect } from "@playwright/test";

test("logging a hike persists locally and shows on My hikes", async ({
  page,
}) => {
  await page.goto("/trails/fall-creek-falls");

  await page.getByRole("button", { name: /mark as hiked/i }).click();
  await expect(
    page.getByRole("button", { name: /log another hike/i }),
  ).toBeVisible();

  await page.goto("/hikes");
  await expect(page.getByRole("heading", { name: /my hikes/i })).toBeVisible();
  // Target the My-hikes list link by its exact name. The stylized map also
  // renders a pin link for the trail, whose accessible name is the longer
  // "Fall Creek Falls, Middle Tennessee. Hiked." aria-label.
  await expect(
    page.getByRole("link", { name: "Fall Creek Falls", exact: true }),
  ).toBeVisible();
});

// A 1x1 PNG so the browser's createImageBitmap/canvas pipeline has a real
// image to compress; the thumbnail is sized by CSS, not the intrinsic pixels.
const PNG_1x1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/IAAAAAASUVORK5CYII=";

test("logging a hike with a photo shows a thumbnail on My hikes (signed out)", async ({
  page,
}) => {
  await page.goto("/trails/fall-creek-falls");

  await page.getByRole("button", { name: /add a date/i }).click();
  await page.getByLabel(/photo/i).setInputFiles({
    name: "trail.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_1x1, "base64"),
  });
  await page.getByRole("button", { name: /mark as hiked/i }).click();
  await expect(
    page.getByRole("button", { name: /log another hike/i }),
  ).toBeVisible();

  await page.goto("/hikes");
  await expect(
    page.getByRole("img", {
      name: "Photo from your hike of Fall Creek Falls",
    }),
  ).toBeVisible();
});

