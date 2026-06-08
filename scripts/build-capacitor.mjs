// Build the static export bundled into the native app (spec 0009, phase 1).
//
// `output: "export"` cannot contain API route handlers, the OG/sitemap/robots
// route handlers, or pages that render with request-time server features. Those
// live on the server and are not needed in the bundle (the app calls the
// production API over the network when online). Next has no per-route exclusion,
// so this temporarily moves them out of the tree, runs the export, and always
// moves them back. The Vercel build is untouched and keeps every route.
//
// Pages whose request-time work is not yet client-side are excluded here too and
// tracked as follow-ups; until phase 3 wires `webDir` to the export, the bundle
// is built but not yet loaded, so an excluded page has no effect on the app.

import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const STASH = join(root, ".capacitor-build-stash");

const EXCLUDE = [
  "src/app/api", // 26 API route handlers: live on the server
  "src/app/sitemap.ts", // route handler, server-only
  "src/app/robots.ts", // route handler, server-only
  "src/app/trails/[slug]/opengraph-image.tsx", // OG image route, not needed in-app
  "src/app/admin", // force-dynamic + DB; admins use the website
  // Pages with request-time server work, client-convert pending (#308):
  "src/app/share", // dynamic OG + catch-all without generateStaticParams
];

const moved = [];

/** Move a path into the stash, mirroring its relative location. */
function stashOut(rel) {
  const from = join(root, rel);
  if (!existsSync(from)) return;
  const to = join(STASH, rel);
  mkdirSync(dirname(to), { recursive: true });
  renameSync(from, to);
  moved.push(rel);
}

/** Move every stashed path back to where it came from. Idempotent. */
function restoreAll(rels) {
  for (const rel of rels) {
    const from = join(STASH, rel);
    const to = join(root, rel);
    if (!existsSync(from)) continue;
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);
  }
}

/** Recover source files a previous crashed/killed build may have left stashed. */
function recoverPriorStash() {
  if (!existsSync(STASH)) return;
  restoreAll(EXCLUDE);
  rmSync(STASH, { recursive: true, force: true });
}

let restored = false;
function cleanup() {
  if (restored) return;
  restored = true;
  restoreAll([...moved].reverse());
  if (existsSync(STASH) && readdirSync(STASH).length === 0) {
    rmSync(STASH, { recursive: true, force: true });
  } else if (existsSync(STASH)) {
    rmSync(STASH, { recursive: true, force: true });
  }
}

// A hard interrupt still restores the tree so source files are never stranded.
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});

try {
  recoverPriorStash();
  for (const rel of EXCLUDE) stashOut(rel);

  const result = spawnSync("pnpm", ["exec", "next", "build"], {
    stdio: "inherit",
    env: { ...process.env, CAPACITOR_BUILD: "1" },
  });
  process.exitCode = result.status ?? 1;
} finally {
  cleanup();
}
