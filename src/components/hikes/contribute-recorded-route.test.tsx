import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContributeRecordedRoute } from "./contribute-recorded-route";

const points = [
  { lat: 35.6, lng: -83.45, elevationFt: 1000 },
  { lat: 35.62, lng: -83.44, elevationFt: 1200 },
  { lat: 35.63, lng: -83.43, elevationFt: 1150 },
];

type PostCall = { url: string; body: FormData };
const postCalls: PostCall[] = [];

function mockFetch(opts: { signedIn: boolean; postOk?: boolean }) {
  postCalls.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/auth/session")) {
        return {
          ok: true,
          json: async () => (opts.signedIn ? { user: { id: "u1" } } : {}),
        } as unknown as Response;
      }
      postCalls.push({ url, body: init?.body as FormData });
      return {
        ok: opts.postOk ?? true,
        json: async () => ({}),
      } as unknown as Response;
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("ContributeRecordedRoute", () => {
  it("renders nothing for signed-out members", async () => {
    mockFetch({ signedIn: false });
    const { container } = render(
      <ContributeRecordedRoute
        trailSlug="grotto-falls"
        trailName="Grotto Falls"
        points={points}
      />,
    );
    await new Promise((r) => setTimeout(r));
    expect(container).toBeEmptyDOMElement();
  });

  it("posts the recorded track as a GPX route contribution when signed in", async () => {
    mockFetch({ signedIn: true });
    render(
      <ContributeRecordedRoute
        trailSlug="grotto-falls"
        trailName="Grotto Falls"
        points={points}
      />,
    );

    const button = await screen.findByRole("button", {
      name: /contribute.*route/i,
    });
    fireEvent.click(button);

    await waitFor(() => expect(postCalls).toHaveLength(1));
    const call = postCalls[0];
    expect(call.url).toBe("/api/contributions/route");
    expect(call.body).toBeInstanceOf(FormData);
    expect(call.body.get("trailSlug")).toBe("grotto-falls");
    const gpx = call.body.get("gpx");
    expect(gpx).toBeInstanceOf(Blob);
    expect((gpx as File).size).toBeGreaterThan(0);
    // It really is GPX built from the recorded points.
    expect(await (gpx as File).text()).toContain("<trkpt");

    // On success the button gives way to a confirmation.
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /contribute.*route/i }),
      ).toBeNull(),
    );
    expect(screen.getByText(/queue for review/i)).toBeInTheDocument();
  });

  it("keeps the button and shows an error when the upload fails", async () => {
    mockFetch({ signedIn: true, postOk: false });
    render(
      <ContributeRecordedRoute
        trailSlug="grotto-falls"
        trailName="Grotto Falls"
        points={points}
      />,
    );

    const button = await screen.findByRole("button", {
      name: /contribute.*route/i,
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(screen.getByText(/could not send/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /contribute.*route/i }),
    ).toBeInTheDocument();
  });

  it("renders nothing for a track with fewer than two points", async () => {
    mockFetch({ signedIn: true });
    const { container } = render(
      <ContributeRecordedRoute
        trailSlug="grotto-falls"
        trailName="Grotto Falls"
        points={[points[0]]}
      />,
    );
    await new Promise((r) => setTimeout(r));
    expect(container).toBeEmptyDOMElement();
  });
});
