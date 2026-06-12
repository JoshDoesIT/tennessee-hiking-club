/**
 * Generate every raster brand asset from the Peak + Pin SVG source of truth
 * (spec 0010). The pin/peaks geometry is read from `src/components/logo.tsx`
 * so the React mark and the rasters can never drift apart.
 *
 *   node scripts/build-brand-assets.mjs
 *
 * Outputs:
 *   public/logo.png                 1024  transparent, deep-pine line mark
 *   src/app/icon.png                 512  deep-pine rounded tile, white mark
 *   src/app/apple-icon.png           180  full-bleed deep-pine tile
 *   src/app/favicon.ico        16/32/48  PNG-compressed ICO
 *   public/opengraph-image.png  1200×630  mark-led share card (no raster text,
 *   public/twitter-image.png    1200×630  so no font substitution)
 *   docs/brand/assets/peak-pin-mono-{forest,stone}.png  monochrome treatments
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
/* sharp is a transitive dependency (via next's image pipeline); resolve it
 * from the pnpm store so this script needs no extra install. */
const sharp = require(
  fs
    .readdirSync("node_modules/.pnpm")
    .filter((d) => d.startsWith("sharp@"))
    .map((d) => path.resolve("node_modules/.pnpm", d, "node_modules/sharp"))[0],
);

const DEEP_PINE = "#15352A";
const FOREST = "#1E4D3A";
const SAGE = "#8BA888";
const MIST = "#C7D2C1";
const ORANGE = "#F47C20";
const STONE = "#F5F6F3";

/* Pull the shared geometry out of the React component. */
const logoSource = fs.readFileSync("src/components/logo.tsx", "utf8");
const grab = (name) =>
  logoSource.match(new RegExp(name + ' =\\n?\\s*"([^"]+)"'))[1];
const PIN_OUTER = grab("PIN_OUTER");
const PIN_INNER = grab("PIN_INNER");
const PIN_CLIP = grab("PIN_CLIP");
const SCENE_PEAKS = grab("SCENE_PEAKS");
const SCENE_HILL = grab("SCENE_HILL");

/** The mark on a transparent 96×96 box: ring + solid tail (even-odd) with the
 *  mountain scene clipped to the ring's window. One color, like the sheet. */
let clipSeq = 0;
function mark(color) {
  const id = `pin-clip-${clipSeq++}`;
  return `
  <defs><clipPath id="${id}"><path d="${PIN_CLIP}" /></clipPath></defs>
  <g fill="${color}">
    <path fill-rule="evenodd" d="${PIN_OUTER} ${PIN_INNER}" />
    <g clip-path="url(#${id})">
      <path fill-rule="evenodd" d="${SCENE_PEAKS}" />
      <path d="${SCENE_HILL}" />
    </g>
  </g>`;
}

function svg(width, height, body) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
  );
}

async function png(buffer, out) {
  await sharp(buffer).png().toFile(out);
  const { width, height, size } = await sharp(out)
    .metadata()
    .then(async (m) => ({
      ...m,
      size: fs.statSync(out).size,
    }));
  console.log(`${out}  ${width}×${height}  ${(size / 1024).toFixed(0)}KB`);
}

/** Hand-rolled ICO container with PNG-compressed entries (valid since Vista). */
function writeIco(pngs, out) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + 16 * count;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0); // width
    e.writeUInt8(size === 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }
  fs.writeFileSync(
    out,
    Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]),
  );
  console.log(
    `${out}  ${pngs.map((p) => p.size).join("/")}px  ${(fs.statSync(out).size / 1024).toFixed(0)}KB`,
  );
}

/* Tile: deep-pine rounded square with the white solid mark (the app icon on
 * the brand sheet). `inset` keeps clear space around the pin. */
function tile(size, { radiusRatio = 0.22, inset = 0.16 } = {}) {
  const r = Math.round(size * radiusRatio);
  const markSize = size * (1 - inset * 2);
  const offset = (size - markSize) / 2;
  const scale = markSize / 96;
  return svg(
    size,
    size,
    `<rect width="${size}" height="${size}" rx="${r}" fill="${DEEP_PINE}" />
     <g transform="translate(${offset} ${offset}) scale(${scale})">
       ${mark(STONE)}
     </g>`,
  );
}

/* 1200×630 share card: deep-pine ground, faint contour rings, ridge band in
 * the brand greens, and the mark front and center with an orange ping. All
 * geometry — no rasterized wordmark, so no font substitution. */
function shareCard() {
  const w = 1200;
  const h = 630;
  const contour = (cx, cy, rs, color, op) =>
    rs
      .map(
        (r) =>
          `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="1.5" opacity="${op}" />`,
      )
      .join("");
  return svg(
    w,
    h,
    `<rect width="${w}" height="${h}" fill="${DEEP_PINE}" />
     ${contour(170, 120, [40, 80, 124, 172, 224], MIST, 0.1)}
     ${contour(1060, 470, [50, 100, 156, 216], MIST, 0.08)}
     <path d="M0 470 L190 410 L360 452 L560 384 L760 446 L960 376 L1130 436 L1200 408 L1200 630 L0 630 Z" fill="${FOREST}" opacity="0.55" />
     <path d="M0 522 L220 480 L440 520 L660 470 L880 522 L1080 478 L1200 512 L1200 630 L0 630 Z" fill="${SAGE}" opacity="0.5" />
     <path d="M0 568 L240 540 L480 572 L720 538 L960 574 L1200 548 L1200 630 L0 630 Z" fill="${DEEP_PINE}" />
     <ellipse cx="600" cy="468" rx="120" ry="26" fill="none" stroke="${ORANGE}" stroke-width="3" opacity="0.5" />
     <ellipse cx="600" cy="468" rx="64" ry="14" fill="none" stroke="${ORANGE}" stroke-width="3" opacity="0.8" />
     <g transform="translate(420 96) scale(3.75)">
       ${mark(STONE)}
     </g>`,
  );
}

const out = async () => {
  // Primary line mark, transparent (in-app, docs).
  await png(
    svg(1024, 1024, `<g transform="scale(10.6667)">${mark(DEEP_PINE)}</g>`),
    "public/logo.png",
  );

  // App icons.
  await png(tile(512), "src/app/icon.png");
  await png(
    tile(180, { radiusRatio: 0, inset: 0.18 }),
    "src/app/apple-icon.png",
  );

  // Favicon: simplified mark (peaks read better than the full pin at 16px).
  const favPngs = [];
  for (const size of [16, 32, 48]) {
    const buf = await sharp(tile(256, { radiusRatio: 0.22, inset: 0.1 }))
      .resize(size, size)
      .png()
      .toBuffer();
    favPngs.push({ size, data: buf });
  }
  writeIco(favPngs, "src/app/favicon.ico");

  // Social share cards.
  await png(shareCard(), "public/opengraph-image.png");
  fs.copyFileSync("public/opengraph-image.png", "public/twitter-image.png");
  console.log("public/twitter-image.png  (copy)");

  // Monochrome treatments for single-color contexts.
  fs.mkdirSync("docs/brand/assets", { recursive: true });
  await png(
    svg(512, 512, `<g transform="scale(5.3333)">${mark(FOREST)}</g>`),
    "docs/brand/assets/peak-pin-mono-forest.png",
  );
  await png(
    svg(512, 512, `<g transform="scale(5.3333)">${mark(STONE)}</g>`),
    "docs/brand/assets/peak-pin-mono-stone.png",
  );
};

out().catch((e) => {
  console.error(e);
  process.exit(1);
});
