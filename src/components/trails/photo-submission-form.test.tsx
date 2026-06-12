import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoSubmissionForm } from "./photo-submission-form";

function setupFetch(session: unknown, { ok = true } = {}) {
  let body: FormData | null = null;
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/api/auth/session")) {
      return { ok: true, json: async () => session } as unknown as Response;
    }
    if (path.includes("/api/contributions/photo")) {
      body = init?.body as FormData;
      return {
        ok,
        status: ok ? 201 : 400,
        json: async () => (ok ? { ok: true, id: "p1" } : { error: "bad" }),
      } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { f, getBody: () => body };
}

const file = () =>
  new File(["jpeg-bytes"], "falls.jpg", { type: "image/jpeg" });

afterEach(() => vi.unstubAllGlobals());

describe("PhotoSubmissionForm", () => {
  it("does not render the form when signed out", async () => {
    const { f } = setupFetch({});
    render(<PhotoSubmissionForm trailSlug="virgin-falls" trailName="Virgin Falls" />);
    await waitFor(() =>
      expect(
        f.mock.calls.some((c) => String(c[0]).includes("/api/auth/session")),
      ).toBe(true),
    );
    expect(screen.queryByLabelText(/describe the photo/i)).toBeNull();
  });

  it("submits a photo with alt text and trail slug when signed in", async () => {
    const user = userEvent.setup();
    const { getBody } = setupFetch({ user: { id: "u1" } });
    render(<PhotoSubmissionForm trailSlug="virgin-falls" trailName="Virgin Falls" />);

    await user.upload(await screen.findByLabelText(/choose a photo/i), file());
    await user.type(
      screen.getByLabelText(/describe the photo/i),
      "The falls in spring flow",
    );
    await user.click(screen.getByLabelText(/right to share/i));
    await user.click(screen.getByRole("button", { name: /add photo/i }));

    await waitFor(() => expect(getBody()).not.toBeNull());
    const body = getBody()!;
    expect(body.get("trailSlug")).toBe("virgin-falls");
    expect(body.get("alt")).toBe("The falls in spring flow");
    expect(body.get("file")).toBeInstanceOf(File);
    expect(await screen.findByRole("status")).toHaveTextContent(/review/i);
  });

  it("does not submit until the rights box is checked", async () => {
    const user = userEvent.setup();
    const { f } = setupFetch({ user: { id: "u1" } });
    render(<PhotoSubmissionForm trailSlug="virgin-falls" trailName="Virgin Falls" />);

    await user.upload(await screen.findByLabelText(/choose a photo/i), file());
    await user.type(screen.getByLabelText(/describe the photo/i), "Alt");
    await user.click(screen.getByRole("button", { name: /add photo/i }));

    expect(
      f.mock.calls.some((c) => String(c[0]).includes("/api/contributions/photo")),
    ).toBe(false);
  });
});
