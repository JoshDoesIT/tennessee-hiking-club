import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StewardPledge } from "./steward-pledge";
import { getPledge } from "@/lib/stewardship/pledge";

beforeEach(() => localStorage.clear());

describe("StewardPledge", () => {
  it("takes the pledge and shows steward recognition", async () => {
    const user = userEvent.setup();
    render(<StewardPledge />);

    await user.click(
      await screen.findByRole("button", { name: /take the pledge/i }),
    );

    expect(screen.getByText(/trail steward/i)).toBeInTheDocument();
    expect(getPledge()).not.toBeNull();
  });

  it("can be withdrawn", async () => {
    const user = userEvent.setup();
    render(<StewardPledge />);

    await user.click(
      await screen.findByRole("button", { name: /take the pledge/i }),
    );
    await user.click(screen.getByRole("button", { name: /withdraw/i }));

    expect(
      screen.getByRole("button", { name: /take the pledge/i }),
    ).toBeInTheDocument();
    expect(getPledge()).toBeNull();
  });
});
