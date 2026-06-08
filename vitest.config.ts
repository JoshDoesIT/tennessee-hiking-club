import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      // The offline launch bundle (served from `webDir` via errorPath) ships its
      // own vanilla JS; test it where it lives so the tested file is the one
      // that ships.
      "mobile/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    css: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/*.d.ts"],
    },
  },
});
