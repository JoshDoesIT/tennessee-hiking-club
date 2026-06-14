import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoSubmissionForm } from "./photo-submission-form";

function setupFetch(session: unknown, { ok = true } = {}) {
  const bodies: FormData[] = [];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/api/auth/session")) {
      return { ok: true, json: async () => session } as unknown as Response;
    }
    if (path.includes("/api/contributions/photo")) {
      bodies.push(init?.body as FormData);
      return {
        ok,
        status: ok ? 201 : 400,
        json: async () => (ok ? { ok: true, id: "p1" } : { error: "bad" }),
      } as unknown as Response;
    }
    return { ok: false, json: async () => ({}) } as unknown as Response;
  });
  vi.stubGlobal("fetch", f as unknown as typeof fetch);
  return { f, getBodies: () => bodies };
}

const file = (name = "falls.jpg") =>
  new File(["jpeg-bytes"], name, { type: "image/jpeg" });

afterEach(() => vi.unstubAllGlobals());

describe("PhotoSubmissionForm", () => {
  it("does not render the form when signed out", async () => {
    const { f } = setupFetch({});
    render(
      <PhotoSubmissionForm trailSlug="virgin-falls" trailName="Virgin Falls" />,
    );
    await waitFor(() =>
      expect(
        f.mock.calls.some((c) => String(c[0]).includes("/api/auth/session")),
      ).toBe(true),
    );
    expect(screen.queryByLabelText(/choose photos/i)).toBeNull();
  });

  it("submits each selected photo with its own alt text and the trail slug", async () => {
    const user = userEvent.setup();
    const { getBodies } = setupFetch({ user: { id: "u1" } });
    render(
      <PhotoSubmissionForm trailSlug="virgin-falls" trailName="Virgin Falls" />,
    );

    await user.upload(await screen.findByLabelText(/choose photos/i), [
      file("a.jpg"),
      file("b.jpg"),
    ]);
    await user.type(screen.getByLabelText(/describe photo 1/i), "First view");
    await user.type(screen.getByLabelText(/describe photo 2/i), "Second view");
    await user.click(screen.getByLabelText(/right to share/i));
    await user.click(screen.getByRole("button", { name: /add photo/i }));

    await waitFor(() => expect(getBodies()).toHaveLength(2));
    const bodies = getBodies();
    expect(bodies[0].get("trailSlug")).toBe("virgin-falls");
    expect(bodies[0].get("alt")).toBe("First view");
    expect(bodies[0].get("file")).toBeInstanceOf(File);
    expect(bodies[1].get("alt")).toBe("Second view");
    expect(await screen.findByRole("status")).toHaveTextContent(/review/i);
  });

  it("does not submit until every photo has alt text", async () => {
    const user = userEvent.setup();
    const { getBodies } = setupFetch({ user: { id: "u1" } });
    render(
      <PhotoSubmissionForm trailSlug="virgin-falls" trailName="Virgin Falls" />,
    );

    await user.upload(await screen.findByLabelText(/choose photos/i), [
      file("a.jpg"),
      file("b.jpg"),
    ]);
    await user.type(screen.getByLabelText(/describe photo 1/i), "Only one");
    await user.click(screen.getByLabelText(/right to share/i));
    await user.click(screen.getByRole("button", { name: /add photo/i }));

    expect(getBodies()).toHaveLength(0);
    expect(await screen.findByRole("status")).toHaveTextContent(/description/i);
  });

  it("does not submit until the rights box is checked", async () => {
    const user = userEvent.setup();
    const { getBodies } = setupFetch({ user: { id: "u1" } });
    render(
      <PhotoSubmissionForm trailSlug="virgin-falls" trailName="Virgin Falls" />,
    );

    await user.upload(await screen.findByLabelText(/choose photos/i), file());
    await user.type(screen.getByLabelText(/describe photo 1/i), "Alt");
    await user.click(screen.getByRole("button", { name: /add photo/i }));

    expect(getBodies()).toHaveLength(0);
  });
});
