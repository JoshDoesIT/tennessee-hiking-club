import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrailSubmissionForm } from "./trail-submission-form";

function setupFetch(session: unknown, { ok = true } = {}) {
  let postBody: unknown = null;
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/api/auth/session")) {
      return { ok: true, json: async () => session } as unknown as Response;
    }
    if (path.includes("/api/auth/providers")) {
      return { ok: true, json: async () => ({}) } as unknown as Response;
    }
    if (path.includes("/api/contributions/trail")) {
      postBody = init?.body ? JSON.parse(String(init.body)) : null;
      return {
        ok,
        status: ok ? 201 : 400,
        json: async () => (ok ? { ok: true, id: "sub1" } : { error: "bad" }),
      } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { f, getPostBody: () => postBody };
}

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error cleanup of the WebAuthn feature-detection global
  delete window.PublicKeyCredential;
});

describe("TrailSubmissionForm", () => {
  it("offers a passkey sign-in in the signed-out prompt when WebAuthn is supported", async () => {
    // @ts-expect-error minimal stub for feature detection
    window.PublicKeyCredential = function () {};
    setupFetch({});
    render(<TrailSubmissionForm />);
    expect(
      await screen.findByRole("button", { name: /sign in with a passkey/i }),
    ).toBeInTheDocument();
  });

  it("does not show the form when signed out", async () => {
    const { f } = setupFetch({});
    render(<TrailSubmissionForm />);
    await waitFor(() =>
      expect(
        f.mock.calls.some((c) => String(c[0]).includes("/api/auth/session")),
      ).toBe(true),
    );
    expect(screen.queryByLabelText(/trail name/i)).toBeNull();
  });

  it("submits a new-trail proposal with numeric coordinates when signed in", async () => {
    const user = userEvent.setup();
    const { getPostBody } = setupFetch({ user: { id: "u1" } });
    render(<TrailSubmissionForm />);

    await user.type(await screen.findByLabelText(/trail name/i), "Piney Falls");
    await user.selectOptions(screen.getByLabelText(/region/i), "East");
    await user.type(screen.getByLabelText(/area/i), "Piney Falls SNA");
    await user.type(screen.getByLabelText(/latitude/i), "35.7277");
    await user.type(screen.getByLabelText(/longitude/i), "-84.8556");
    await user.type(
      screen.getByLabelText(/description/i),
      "Short loop to a waterfall.",
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(getPostBody()).toMatchObject({
        name: "Piney Falls",
        region: "East",
        area: "Piney Falls SNA",
        lat: 35.7277,
        lng: -84.8556,
        description: "Short loop to a waterfall.",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/review/i);
  });

  it("shows an error message when the submission is rejected", async () => {
    const user = userEvent.setup();
    setupFetch({ user: { id: "u1" } }, { ok: false });
    render(<TrailSubmissionForm />);

    await user.type(await screen.findByLabelText(/trail name/i), "X");
    await user.selectOptions(screen.getByLabelText(/region/i), "East");
    await user.type(screen.getByLabelText(/area/i), "Y");
    await user.type(screen.getByLabelText(/latitude/i), "35.7");
    await user.type(screen.getByLabelText(/longitude/i), "-84.8");
    await user.type(screen.getByLabelText(/description/i), "Z");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/could not/i);
  });
});
