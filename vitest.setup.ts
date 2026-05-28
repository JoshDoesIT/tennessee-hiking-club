import "@testing-library/jest-dom/vitest";
// Provide a working `indexedDB` under jsdom so the local photo store (and the
// components/transfer paths that use it) can be tested.
import "fake-indexeddb/auto";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Ensure the DOM is reset between component tests.
afterEach(() => {
  cleanup();
});
