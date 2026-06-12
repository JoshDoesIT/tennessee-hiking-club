import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestWaypointForm } from "./suggest-waypoint-form";

function setupFetch(session: unknown, { ok = true } = {}) {
  let body: FormData | null = null;
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/api/auth/session")) {
      return { ok: true, json: async () => session } as unknown as Response;
    }
    if (path.includes("/api/contributions/waypoint")) {
      body = init?.body as FormData;
      return {
        ok,
        status: ok ? 201 : 400,
        json: async () => (ok ? { ok: true, id: "w1" } : { error: "bad" }),
      } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { f, getBody: () => body };
}

afterEach(() => vi.unstubAllGlobals());

describe("SuggestWaypointForm", () => {
  it("does not render the form when signed out", async () => {
    const { f } = setupFetch({});
    render(
      <SuggestWaypointForm trailSlug="virgin-falls" trailName="Virgin Falls" />,
    );
    await waitFor(() =>
      expect(
        f.mock.calls.some((c) => String(c[0]).includes("/api/auth/session")),
      ).toBe(true),
    );
    expect(screen.queryByLabelText(/landmark name/i)).toBeNull();
  });

  it("submits a suggestion with the trail slug and typed fields when signed in", async () => {
    const user = userEvent.setup();
    const { getBody } = setupFetch({ user: { id: "u1" } });
    render(
      <SuggestWaypointForm trailSlug="virgin-falls" trailName="Virgin Falls" />,
    );

    await user.type(
      await screen.findByLabelText(/landmark name/i),
      "Big Branch Falls",
    );
    await user.selectOptions(screen.getByLabelText(/landmark type/i), "waterfall");
    await user.type(screen.getByLabelText(/latitude/i), "35.83");
    await user.type(screen.getByLabelText(/longitude/i), "-85.29");
    await user.click(screen.getByRole("button", { name: /suggest/i }));

    await waitFor(() => expect(getBody()).not.toBeNull());
    const body = getBody()!;
    expect(body.get("trailSlug")).toBe("virgin-falls");
    expect(body.get("name")).toBe("Big Branch Falls");
    expect(body.get("type")).toBe("waterfall");
    expect(body.get("lat")).toBe("35.83");
    expect(body.get("lng")).toBe("-85.29");
    expect(await screen.findByRole("status")).toHaveTextContent(/review/i);
  });
});
