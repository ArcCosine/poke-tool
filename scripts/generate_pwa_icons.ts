import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePwaIcons() {
  const svgPath = path.resolve(__dirname, '../public/favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const publicDir = path.resolve(__dirname, '../public');

  const targets = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'pwa-maskable-192x192.png', size: 192 },
    { name: 'pwa-maskable-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'assets/pokemon-sprites/0.png', size: 96 },
  ];

  console.log('Generating PWA icons from favicon.svg...');
  for (const target of targets) {
    const outputPath = path.join(publicDir, target.name);
    await sharp(svgBuffer)
      .resize(target.size, target.size)
      .png({ quality: 95, compressionLevel: 8 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(
      `Generated ${target.name} (${target.size}x${target.size}, ${(stats.size / 1024).toFixed(1)} KB)`
    );
  }
}

generatePwaIcons().catch((err) => {
  console.error('Failed to generate PWA icons:', err);
  process.exit(1);
});
