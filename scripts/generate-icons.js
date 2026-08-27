// Generates the Smart Stock PWA icons (public/icons/icon-192x192.png and
// icon-512x512.png) from the vector source at scripts/icon-source.svg.
//
// Run with: node scripts/generate-icons.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const svgPath = path.join(__dirname, "icon-source.svg");
const outDir = path.join(__dirname, "..", "public", "icons");
const publicDir = path.join(__dirname, "..", "public");

const sizes = [192, 512];

// iOS uses this exact file/size (no maskable padding assumptions) for the
// home screen icon via <link rel="apple-touch-icon">.
const APPLE_TOUCH_ICON_SIZE = 180;

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    const outPath = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer, { density: (72 * size) / 512 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }

  const appleTouchIconPath = path.join(publicDir, "apple-touch-icon.png");
  await sharp(svgBuffer, {
    density: (72 * APPLE_TOUCH_ICON_SIZE) / 512,
  })
    .resize(APPLE_TOUCH_ICON_SIZE, APPLE_TOUCH_ICON_SIZE)
    .flatten({ background: "#ffffff" })
    .png({ compressionLevel: 9 })
    .toFile(appleTouchIconPath);
  console.log(`Generated ${appleTouchIconPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
