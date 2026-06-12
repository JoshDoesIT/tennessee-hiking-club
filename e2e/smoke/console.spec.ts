import { test, expect } from "@playwright/test";
import { watchForProblems } from "./console-guard";

/**
 * Console-error gate (issue #24). The guard records `console.error` output and
 * uncaught exceptions; the core routes must produce neither. The first test
 * proves the guard actually captures problems, so a clean prod run means the
 * pages are clean rather than the guard being blind.
 */

test("guard captures console.error output and uncaught exceptions", async ({
  page,
}) => {
  const problems = watchForProblems(page);
  await page.setContent(
    `<!doctype html><script>
       console.error("synthetic console error");
       throw new Error("synthetic uncaught error");
     </script>`,
  );
  await expect
    .poll(() => problems.consoleErrors.length + problems.pageErrors.length)
    .toBeGreaterThan(0);
  expect(problems.consoleErrors.join("\n")).toContain(
    "synthetic console error",
  );
  expect(problems.pageErrors.join("\n")).toContain("synthetic uncaught error");
});

const CORE_ROUTES = [
  "/",
  "/trails",
  "/leaderboard",
  "/trails/mt-leconte-alum-cave",
  "/hikes",
];

for (const route of CORE_ROUTES) {
  test(`no console errors or uncaught exceptions on ${route}`, async ({
    page,
  }) => {
    const problems = watchForProblems(page);
    const res = await page.goto(route, { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    expect(problems.pageErrors, `uncaught exceptions on ${route}`).toEqual([]);
    expect(problems.consoleErrors, `console errors on ${route}`).toEqual([]);
  });
}
