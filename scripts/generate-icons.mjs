/**
 * Generates PNG icon files from the Theatrelog navy SVG icon.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'brand', 'theatrelog-icon-navy.svg');
const publicDir = join(root, 'public');

const svgBuffer = readFileSync(svgPath);

const icons = [
  { name: 'favicon-16x16.png',       size: 16,  maskable: false },
  { name: 'favicon-32x32.png',       size: 32,  maskable: false },
  { name: 'apple-touch-icon.png',    size: 180, maskable: false },
  { name: 'pwa-192x192.png',         size: 192, maskable: false },
  { name: 'pwa-512x512.png',         size: 512, maskable: false },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true  },
];

for (const { name, size, maskable } of icons) {
  const outPath = join(publicDir, name);

  if (maskable) {
    // Maskable icons need ~10% padding (safe zone) with a navy background fill
    const padding = Math.round(size * 0.1);
    const iconSize = size - padding * 2;

    const iconBuf = await sharp(svgBuffer)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 11, g: 29, b: 58, alpha: 1 } })
      .png()
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 11, g: 29, b: 58, alpha: 1 } },
    })
      .composite([{ input: iconBuf, gravity: 'centre' }])
      .png()
      .toFile(outPath);
  } else {
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 11, g: 29, b: 58, alpha: 1 } })
      .png()
      .toFile(outPath);
  }

  console.log(`  ✓ ${name} (${size}×${size})`);
}

console.log('\nAll icons generated.');
