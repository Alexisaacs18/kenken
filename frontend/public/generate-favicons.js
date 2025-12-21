/**
 * Node.js script to generate favicon files from SVG
 * 
 * Requirements:
 * npm install sharp
 * 
 * Usage:
 * node generate-favicons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

const publicDir = __dirname;
const svgPath = path.join(publicDir, 'favicon.svg');

async function generateFavicons() {
  console.log('Generating favicon files from SVG...');
  
  if (!fs.existsSync(svgPath)) {
    console.error('Error: favicon.svg not found in public directory');
    process.exit(1);
  }

  try {
    // Generate PNG files
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name);
      await sharp(svgPath)
        .resize(size, size, {
          background: { r: 247, g: 246, b: 243, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name}`);
    }

    // Generate ICO file (combine 16x16 and 32x32)
    // Note: sharp doesn't support ICO directly, so we'll skip it
    // Use an online tool or ImageMagick for ICO generation
    console.log('\n⚠ favicon.ico needs to be generated separately');
    console.log('  Use an online tool like realfavicongenerator.net or ImageMagick');
    
    console.log('\n✅ Favicon generation complete!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
