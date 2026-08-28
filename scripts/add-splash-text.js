#!/usr/bin/env node

/**
 * Adds "SmartStock" text to iOS splash screens
 * Uses canvas to overlay text on existing splash images
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');

const SPLASH_DIR = path.join(__dirname, '../public/splash');
const TEXT = 'SmartStock';
const TEXT_COLOR = '#1f2937'; // Dark gray matching brand
const FONT_SIZE = 52;

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

    // Set up text properties
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `500 ${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate position (centered horizontally, 120px from bottom)
    const textY = h - 120;

    // Draw text
    ctx.fillText(TEXT, w / 2, textY);

    // Save the result
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imagePath, buffer);

    console.log(`✓ Updated ${filename}`);
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
