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
});
