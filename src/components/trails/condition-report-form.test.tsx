import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConditionReportForm } from "./condition-report-form";

function setupFetch(session: unknown, { ok = true } = {}) {
  let postBody: unknown = null;
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/api/auth/session")) {
      return { ok: true, json: async () => session } as unknown as Response;
    }
    if (path.includes("/api/contributions/condition")) {
      postBody = init?.body ? JSON.parse(String(init.body)) : null;
      return {
        ok,
        status: ok ? 201 : 400,
        json: async () => (ok ? { ok: true, id: "c1" } : { error: "bad" }),
      } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { f, getPostBody: () => postBody };
}

afterEach(() => vi.unstubAllGlobals());

describe("ConditionReportForm", () => {
  it("does not render the form when signed out", async () => {
    const { f } = setupFetch({});
    render(<ConditionReportForm trailSlug="virgin-falls" trailName="Virgin Falls" />);
    await waitFor(() =>
      expect(
        f.mock.calls.some((c) => String(c[0]).includes("/api/auth/session")),
      ).toBe(true),
    );
    expect(screen.queryByLabelText(/^condition$/i)).toBeNull();
  });

  it("submits a condition report for the trail when signed in", async () => {
    const user = userEvent.setup();
    const { getPostBody } = setupFetch({ user: { id: "u1" } });
    render(<ConditionReportForm trailSlug="virgin-falls" trailName="Virgin Falls" />);

    await user.type(
      await screen.findByLabelText(/^condition$/i),
      "Muddy near the base",
    );
    await user.type(screen.getByLabelText(/note/i), "Bring poles.");
    await user.click(screen.getByRole("button", { name: /report/i }));

    await waitFor(() =>
      expect(getPostBody()).toMatchObject({
        trailSlug: "virgin-falls",
        status: "Muddy near the base",
        note: "Bring poles.",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/review/i);
  });

  it("shows an error when the report is rejected", async () => {
    const user = userEvent.setup();
    setupFetch({ user: { id: "u1" } }, { ok: false });
    render(<ConditionReportForm trailSlug="virgin-falls" trailName="Virgin Falls" />);

    await user.type(await screen.findByLabelText(/^condition$/i), "Open");
    await user.click(screen.getByRole("button", { name: /report/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/could not/i);
  });
});
