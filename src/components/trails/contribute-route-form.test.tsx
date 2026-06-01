import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContributeRouteForm } from "./contribute-route-form";

function setupFetch(session: unknown, { ok = true } = {}) {
  let body: FormData | null = null;
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/api/auth/session")) {
      return { ok: true, json: async () => session } as unknown as Response;
    }
    if (path.includes("/api/contributions/route")) {
      body = init?.body as FormData;
      return {
        ok,
        status: ok ? 201 : 400,
        json: async () => (ok ? { ok: true, id: "r1" } : { error: "bad" }),
      } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { f, getBody: () => body };
}

afterEach(() => vi.unstubAllGlobals());

describe("ContributeRouteForm", () => {
  it("does not render the form when signed out", async () => {
    const { f } = setupFetch({});
    render(
      <ContributeRouteForm trailSlug="grotto-falls" trailName="Grotto Falls" />,
    );
    await waitFor(() =>
      expect(
        f.mock.calls.some((c) => String(c[0]).includes("/api/auth/session")),
      ).toBe(true),
    );
    expect(screen.queryByLabelText(/gpx file/i)).toBeNull();
  });

  it("uploads the GPX with the trail slug when signed in", async () => {
    const user = userEvent.setup();
    const { getBody } = setupFetch({ user: { id: "u1" } });
    render(
      <ContributeRouteForm trailSlug="grotto-falls" trailName="Grotto Falls" />,
    );

    const file = new File(["<gpx></gpx>"], "hike.gpx", {
      type: "application/gpx+xml",
    });
    await user.upload(await screen.findByLabelText(/gpx file/i), file);
    await user.click(screen.getByRole("button", { name: /contribute/i }));

    await waitFor(() => expect(getBody()).not.toBeNull());
    const body = getBody()!;
    expect(body.get("trailSlug")).toBe("grotto-falls");
    expect(body.get("gpx")).toBeInstanceOf(File);
    expect(await screen.findByRole("status")).toHaveTextContent(/review/i);
  });
});
