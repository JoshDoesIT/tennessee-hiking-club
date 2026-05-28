import type { Page } from "@playwright/test";

export type PageProblems = {
  consoleErrors: string[];
  pageErrors: string[];
};

/**
 * Records `console.error` messages and uncaught page exceptions for the
 * lifetime of the page. Call before navigating so nothing is missed during
 * load and hydration; read the arrays after the page has settled.
 */
export function watchForProblems(page: Page): PageProblems {
  const problems: PageProblems = { consoleErrors: [], pageErrors: [] };
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    problems.pageErrors.push(err.message);
  });
  return problems;
}
