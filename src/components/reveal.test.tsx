import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Reveal } from "./reveal";

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

let ioCallback: IOCallback | null = null;
const observe = vi.fn();
const disconnect = vi.fn();

beforeEach(() => {
  ioCallback = null;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IOCallback) {
        ioCallback = cb;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  observe.mockClear();
  disconnect.mockClear();
});

describe("Reveal", () => {
  it("starts hidden and reveals once it intersects", () => {
    render(<Reveal data-testid="r">peek</Reveal>);
    const el = screen.getByTestId("r");
    expect(el.dataset.revealed).toBe("false");

    act(() => ioCallback?.([{ isIntersecting: true }]));
    expect(el.dataset.revealed).toBe("true");

    // Reveals are one-shot: leaving the viewport must not re-hide content.
    act(() => ioCallback?.([{ isIntersecting: false }]));
    expect(el.dataset.revealed).toBe("true");
  });

  it("passes a stagger delay through as a CSS custom property", () => {
    render(
      <Reveal data-testid="r" delay={120}>
        peek
      </Reveal>,
    );
    expect(
      screen.getByTestId("r").style.getPropertyValue("--reveal-delay"),
    ).toBe("120ms");
  });
});
