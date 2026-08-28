// Generates iOS PWA startup images ("splash screens") for the common
// iPhone/iPad viewport + pixel-ratio combinations Apple looks up via
// <link rel="apple-touch-startup-image">. Each image is the app icon
// centered on a solid background that matches the manifest/theme
// background color, so iOS shows branded artwork instead of a black
// flash while the PWA boots from the home screen.
//
// Run with: node scripts/generate-splash-screens.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const svgPath = path.join(__dirname, "icon-source.svg");
const outDir = path.join(__dirname, "..", "public", "splash");

// Matches manifest.json's background_color/theme_color and the
// viewport.themeColor set in app/layout.tsx.
const BACKGROUND_COLOR = "#ffffff";

// width/height are in device pixels (the file's pixel dimensions).
// media matches the values Apple/WebKit expects for each device.
const SPLASH_SCREENS = [
  { width: 640, height: 1136, dpr: 2, deviceWidth: 320, deviceHeight: 568, orientation: "portrait" },
  { width: 1136, height: 640, dpr: 2, deviceWidth: 320, deviceHeight: 568, orientation: "landscape" },
  { width: 750, height: 1334, dpr: 2, deviceWidth: 375, deviceHeight: 667, orientation: "portrait" },
  { width: 1334, height: 750, dpr: 2, deviceWidth: 375, deviceHeight: 667, orientation: "landscape" },
  { width: 1125, height: 2436, dpr: 3, deviceWidth: 375, deviceHeight: 812, orientation: "portrait" },
  { width: 2436, height: 1125, dpr: 3, deviceWidth: 375, deviceHeight: 812, orientation: "landscape" },
  { width: 828, height: 1792, dpr: 2, deviceWidth: 414, deviceHeight: 896, orientation: "portrait" },
  { width: 1792, height: 828, dpr: 2, deviceWidth: 414, deviceHeight: 896, orientation: "landscape" },
  { width: 1242, height: 2688, dpr: 3, deviceWidth: 414, deviceHeight: 896, orientation: "portrait" },
  { width: 2688, height: 1242, dpr: 3, deviceWidth: 414, deviceHeight: 896, orientation: "landscape" },
  { width: 1242, height: 2208, dpr: 3, deviceWidth: 414, deviceHeight: 736, orientation: "portrait" },
  { width: 2208, height: 1242, dpr: 3, deviceWidth: 414, deviceHeight: 736, orientation: "landscape" },
  { width: 1536, height: 2048, dpr: 2, deviceWidth: 768, deviceHeight: 1024, orientation: "portrait" },
  { width: 2048, height: 1536, dpr: 2, deviceWidth: 768, deviceHeight: 1024, orientation: "landscape" },
  { width: 1668, height: 2224, dpr: 2, deviceWidth: 834, deviceHeight: 1112, orientation: "portrait" },
  { width: 2224, height: 1668, dpr: 2, deviceWidth: 834, deviceHeight: 1112, orientation: "landscape" },
  { width: 1668, height: 2388, dpr: 2, deviceWidth: 834, deviceHeight: 1194, orientation: "portrait" },
  { width: 2388, height: 1668, dpr: 2, deviceWidth: 834, deviceHeight: 1194, orientation: "landscape" },
  { width: 2048, height: 2732, dpr: 2, deviceWidth: 1024, deviceHeight: 1366, orientation: "portrait" },
  { width: 2732, height: 2048, dpr: 2, deviceWidth: 1024, deviceHeight: 1366, orientation: "landscape" },

  // iPhone 12 mini / 13 mini
  { width: 1080, height: 2340, dpr: 3, deviceWidth: 360, deviceHeight: 780, orientation: "portrait" },
  { width: 2340, height: 1080, dpr: 3, deviceWidth: 360, deviceHeight: 780, orientation: "landscape" },
  // iPhone 12 / 12 Pro / 13 / 13 Pro / 14
  { width: 1170, height: 2532, dpr: 3, deviceWidth: 390, deviceHeight: 844, orientation: "portrait" },
  { width: 2532, height: 1170, dpr: 3, deviceWidth: 390, deviceHeight: 844, orientation: "landscape" },
  // iPhone 14 Pro / 15 / 15 Pro / 16
  { width: 1179, height: 2556, dpr: 3, deviceWidth: 393, deviceHeight: 852, orientation: "portrait" },
  { width: 2556, height: 1179, dpr: 3, deviceWidth: 393, deviceHeight: 852, orientation: "landscape" },
  // iPhone 16 Pro
  { width: 1206, height: 2622, dpr: 3, deviceWidth: 402, deviceHeight: 874, orientation: "portrait" },
  { width: 2622, height: 1206, dpr: 3, deviceWidth: 402, deviceHeight: 874, orientation: "landscape" },
  // iPhone 12 Pro Max / 13 Pro Max / 14 Plus / 15 Plus / 15 Pro Max
  { width: 1284, height: 2778, dpr: 3, deviceWidth: 428, deviceHeight: 926, orientation: "portrait" },
  { width: 2778, height: 1284, dpr: 3, deviceWidth: 428, deviceHeight: 926, orientation: "landscape" },
  // iPhone 14 Pro Max / 16 Plus
  { width: 1290, height: 2796, dpr: 3, deviceWidth: 430, deviceHeight: 932, orientation: "portrait" },
  { width: 2796, height: 1290, dpr: 3, deviceWidth: 430, deviceHeight: 932, orientation: "landscape" },
  // iPhone 16 Pro Max
  { width: 1320, height: 2868, dpr: 3, deviceWidth: 440, deviceHeight: 956, orientation: "portrait" },
  { width: 2868, height: 1320, dpr: 3, deviceWidth: 440, deviceHeight: 956, orientation: "landscape" },
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const svgBuffer = fs.readFileSync(svgPath);

  for (const screen of SPLASH_SCREENS) {
    const { width, height } = screen;
    const iconSize = Math.round(Math.min(width, height) * 0.32);
    const icon = await sharp(svgBuffer, { density: (72 * iconSize) / 512 })
      .resize(iconSize, iconSize)
      .png()
      .toBuffer();

    const outPath = path.join(outDir, `apple-splash-${width}x${height}.png`);
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: BACKGROUND_COLOR,
      },
    })
      .composite([
        {
          input: icon,
          left: Math.round((width - iconSize) / 2),
          top: Math.round((height - iconSize) / 2),
        },
      ])
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    console.log(`Generated ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
