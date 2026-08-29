/**
 * Regenerate every committed native launcher icon and splash screen from the
 * brand-kit masters (docs/brand + assets/logo.png). Run after a logo or brand
 * color change, then `pnpm cap:sync` and rebuild the native apps.
 *
 *   node scripts/generate-native-assets.mjs [path-to-brand-kit]
 *
 * The optional argument points at the extracted brand kit's
 * `Tennessee_Hiking_Club_Brand_Kit` folder; without it the script falls back
 * to the badge assets committed in the repo (assets/logo.png + public/logo.png).
 *
 * Colors mirror src/app/globals.css: Evergreen #151F0A (icon ground, dark
 * splash uses the near-black night ground #0E1506), Trail Cream #F9F3D5
 * (light splash ground).
 */
import { createRequire } from "node:module";
import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// sharp ships with next; resolve it through next's dependency tree so the
// script needs no dependency of its own.
const sharp = require(
  require.resolve("sharp", {
    paths: [dirname(require.resolve("next/package.json"))],
  }),
);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const kit = process.argv[2] ?? null;

const EVERGREEN = { r: 21, g: 31, b: 10 }; // #151F0A
const TRAIL_CREAM = { r: 249, g: 243, b: 213 }; // #F9F3D5
const NIGHT = { r: 14, g: 21, b: 6 }; // #0E1506 (dark --color-cream)

/** Transparent circular badge (adaptive foreground, splash art). */
const BADGE = kit
  ? join(kit, "01_Logos/Web_Sizes/thc_logo_2048.png")
  : join(root, "public/logo.png");
/** Square app icon art (already framed for icon use). */
const APP_ICON = kit
  ? join(kit, "01_Logos/Primary/app_icon_1024.png")
  : join(root, "assets/logo.png");

const flatten = (input, background) =>
  sharp(input).flatten({ background }).removeAlpha();

async function circleMask(input, size) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${
      size / 2
    }" r="${size / 2}" fill="#fff"/></svg>`,
  );
  return sharp(await input.resize(size, size).png().toBuffer())
    .composite([{ input: mask, blend: "dest-in" }])
    .png();
}

async function splash(width, height, background, out) {
  const badgeSize = Math.round(Math.min(width, height) * 0.4);
  const badge = await sharp(BADGE)
    .resize(badgeSize, badgeSize)
    .png()
    .toBuffer();
  await sharp({
    create: { width, height, channels: 3, background },
  })
    .composite([{ input: badge, gravity: "center" }])
    .png()
    .toFile(out);
}

// ---------------------------------------------------------------- Android
const res = join(root, "android/app/src/main/res");
const LAUNCHER = {
  ldpi: 36,
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};
// Adaptive layer canvases are 1.5x the legacy icon per density (108dp grid).
const ADAPTIVE = {
  ldpi: 81,
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

for (const [density, size] of Object.entries(LAUNCHER)) {
  const dir = join(res, `mipmap-${density}`);
  const flat = flatten(APP_ICON, EVERGREEN).resize(size, size);
  await flat.clone().png().toFile(join(dir, "ic_launcher.png"));
  const round = await circleMask(flatten(APP_ICON, EVERGREEN), size);
  await round.toFile(join(dir, "ic_launcher_round.png"));

  const layer = ADAPTIVE[density];
  // Foreground: transparent badge centered on the adaptive canvas; the
  // mipmap-anydpi-v26 XML insets it 16.7%, which supplies the safe area.
  const fg = await sharp(BADGE)
    .resize(Math.round(layer * 0.72), Math.round(layer * 0.72))
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: layer,
      height: layer,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fg, gravity: "center" }])
    .png()
    .toFile(join(dir, "ic_launcher_foreground.png"));
  await sharp({
    create: { width: layer, height: layer, channels: 3, background: EVERGREEN },
  })
    .png()
    .toFile(join(dir, "ic_launcher_background.png"));
}
console.log("android launchers: 6 densities x 4 files");

let splashCount = 0;
for (const entry of readdirSync(res)) {
  if (!entry.startsWith("drawable")) continue;
  const file = join(res, entry, "splash.png");
  let meta;
  try {
    statSync(file);
    meta = await sharp(file).metadata();
  } catch {
    continue;
  }
  const ground = entry.includes("night") ? NIGHT : TRAIL_CREAM;
  await splash(meta.width, meta.height, ground, file);
  splashCount++;
}
console.log(`android splashes: ${splashCount}`);

// -------------------------------------------------------------------- iOS
const xc = join(root, "ios/App/App/Assets.xcassets");
// App Store icons must carry no alpha.
await flatten(APP_ICON, EVERGREEN)
  .resize(1024, 1024)
  .png()
  .toFile(join(xc, "AppIcon.appiconset/AppIcon-512@2x.png"));

const splashDir = join(xc, "Splash.imageset");
for (const entry of readdirSync(splashDir)) {
  if (!entry.endsWith(".png")) continue;
  const ground = entry.includes("-dark") ? NIGHT : TRAIL_CREAM;
  await splash(2732, 2732, ground, join(splashDir, entry));
}
console.log("ios: app icon + 9 splashes");
