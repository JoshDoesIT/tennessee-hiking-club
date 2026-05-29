import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StewardBadge } from "./steward-badge";
import { takePledge } from "@/lib/stewardship/pledge";

beforeEach(() => localStorage.clear());

describe("StewardBadge", () => {
  it("renders nothing when not pledged", () => {
    render(<StewardBadge />);
    expect(screen.queryByText(/trail steward/i)).toBeNull();
  });

  it("renders the badge once pledged", async () => {
    takePledge("2026-05-27");
    render(<StewardBadge />);
    expect(await screen.findByText(/trail steward/i)).toBeInTheDocument();
  });

  it("renders the badge for a contributor even without a pledge", () => {
    render(<StewardBadge contributionCount={1} />);
    expect(screen.getByText(/trail steward/i)).toBeInTheDocument();
  });

  it("renders nothing with no pledge and no contributions", () => {
    render(<StewardBadge contributionCount={0} />);
    expect(screen.queryByText(/trail steward/i)).toBeNull();
  });
});
