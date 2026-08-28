#!/usr/bin/env node

/**
 * Adds "SmartStock" text to iOS splash screens
 * Uses canvas to overlay text on existing splash images
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const SPLASH_DIR = path.join(__dirname, '../public/splash');
const TEXT = 'SmartStock';
const TEXT_COLOR = '#374151'; // Charcoal grey, matches the app icon label

// Must match the icon sizing ratio used in generate-splash-screens.js so the
// text lines up with the icon that's already been composited onto the image.
const ICON_SIZE_RATIO = 0.32;
const MAX_TEXT_WIDTH_RATIO = 0.7; // text should never exceed 70% of the screen width

async function addTextToImage(imagePath) {
  try {
    const filename = path.basename(imagePath);
    const [width, heightStr] = filename
      .replace('apple-splash-', '')
      .replace('.png', '')
      .split('x');

    const w = parseInt(width, 10);
    const h = parseInt(heightStr, 10);

    // Load the existing image
    const image = await loadImage(imagePath);

    // Create a canvas with the same dimensions
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Draw the existing image
    ctx.drawImage(image, 0, 0);

    // Figure out where the icon actually sits so the label can be placed
    // just below it, regardless of aspect ratio (phones vs. tablets).
    const iconSize = Math.round(Math.min(w, h) * ICON_SIZE_RATIO);
    const iconBottom = h / 2 + iconSize / 2;
    const gap = Math.round(iconSize * 0.09);

    // Start from a size proportional to the icon, then shrink to fit if the
    // word would otherwise run wider than MAX_TEXT_WIDTH_RATIO of the screen.
    let fontSize = Math.round(iconSize * 0.18);
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `600 ${fontSize}px Arial, sans-serif`;
    const maxWidth = w * MAX_TEXT_WIDTH_RATIO;
    const measuredWidth = ctx.measureText(TEXT).width;
    if (measuredWidth > maxWidth) {
      fontSize = Math.round(fontSize * (maxWidth / measuredWidth));
      ctx.font = `600 ${fontSize}px Arial, sans-serif`;
    }

    // Center the text vertically just below the icon, with a small gap.
    const textCenterY = Math.round(iconBottom + gap + fontSize * 0.5);

    ctx.fillText(TEXT, w / 2, textCenterY);

    // Save the result
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imagePath, buffer);

    console.log(`✓ Updated ${filename} (${w}x${h}, fontSize: ${fontSize}px)`);
  } catch (error) {
    console.error(`✗ Failed to update ${path.basename(imagePath)}:`, error.message);
  }
}

async function main() {
  console.log('Adding "SmartStock" text to splash screens...\n');

  try {
    const files = fs.readdirSync(SPLASH_DIR).filter((f) => f.endsWith('.png'));

    if (files.length === 0) {
      console.log('No PNG files found in public/splash/');
      process.exit(1);
    }

    console.log(`Found ${files.length} splash screen(s)\n`);

    for (const file of files) {
      const imagePath = path.join(SPLASH_DIR, file);
      await addTextToImage(imagePath);
    }

    console.log(`\n✓ Successfully updated all splash screens`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
