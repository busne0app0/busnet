/**
 * One-time asset preparation for the BUSNET UA hero.
 *
 *   npm install --save-dev sharp
 *   node scripts/prepare-busnet-hero.mjs
 *
 * Output (AVIF + WebP + JPEG each):
 *   busnet-europe-{800,1400,2400}.*            2:1 landscape  (desktop)
 *   busnet-europe-portrait-{600,900,1200}.*    3:4 portrait   (mobile)
 *
 * Options (environment variables):
 *   HERO_SOURCE_FILE=/path/to/original.jpg   use a local file instead of downloading
 *   HERO_OUT_DIR=/custom/output/dir          default: apps/landing/public/images
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const outputDir = process.env.HERO_OUT_DIR
  ? path.resolve(process.env.HERO_OUT_DIR)
  : path.join(repoRoot, 'apps', 'landing', 'public', 'images');

// No server-side crop: we crop ourselves so the focal point is under our control.
const SOURCE_URL = 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=3200&q=92&fm=jpg';
const SOURCE_CREDIT = 'Unsplash photo-1614730321146-b6fa6a46bcb4 (add photographer name here)';

// focal = where the interesting part of the photo is (0..1). Keep in sync with
// --fx / --fy in HeroSection.css for the desktop variant.
const VARIANTS = [
  { prefix: '', ratio: 2, widths: [800, 1400, 2400], focal: { x: 0.64, y: 0.56 } },
  { prefix: 'portrait-', ratio: 3 / 4, widths: [600, 900, 1200], focal: { x: 0.74, y: 0.52 } },
];

/** Largest crop of the given ratio, positioned like CSS object-position. */
function cropRect(srcW, srcH, ratio, fx, fy) {
  let width = srcW;
  let height = Math.round(srcW / ratio);
  if (height > srcH) {
    height = srcH;
    width = Math.round(srcH * ratio);
  }
  const left = Math.max(0, Math.min(srcW - width, Math.round((srcW - width) * fx)));
  const top = Math.max(0, Math.min(srcH - height, Math.round((srcH - height) * fy)));
  return { left, top, width, height };
}

async function loadSource() {
  if (process.env.HERO_SOURCE_FILE) {
    console.log(`Reading local source: ${process.env.HERO_SOURCE_FILE}`);
    return readFile(process.env.HERO_SOURCE_FILE);
  }
  console.log('Downloading source image…');
  const response = await fetch(SOURCE_URL, { headers: { Accept: 'image/jpeg,image/*' } });
  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Expected an image, received: ${contentType || 'unknown content type'}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

await mkdir(outputDir, { recursive: true });

const sourceBuffer = await loadSource();
if (sourceBuffer.length < 10_000) {
  throw new Error(`Source image is suspiciously small (${sourceBuffer.length} bytes).`);
}

// Apply EXIF rotation once, so metadata and crops use the real orientation.
const oriented = await sharp(sourceBuffer).rotate().toBuffer();
const { width: srcW, height: srcH } = await sharp(oriented).metadata();
console.log(`Source: ${srcW}×${srcH}`);

for (const { prefix, ratio, widths, focal } of VARIANTS) {
  const rect = cropRect(srcW, srcH, ratio, focal.x, focal.y);
  const cropped = await sharp(oriented).extract(rect).toBuffer();
  const label = prefix ? 'portrait' : 'landscape';
  console.log(`${label}: crop ${rect.width}×${rect.height} at (${rect.left}, ${rect.top})`);

  for (const width of widths) {
    if (rect.width < width) {
      console.warn(`  ! ${label} ${width}w: source crop is only ${rect.width}px wide, file will be smaller than its name.`);
    }
    const name = `busnet-europe-${prefix}${width}`;
    const resized = await sharp(cropped).resize({ width, withoutEnlargement: true }).toBuffer();
    await sharp(resized).webp({ quality: 80, effort: 4 }).toFile(path.join(outputDir, `${name}.webp`));
    await sharp(resized).jpeg({ quality: 82, progressive: true }).toFile(path.join(outputDir, `${name}.jpg`));
    try {
      await sharp(resized).avif({ quality: 55, effort: 2 }).toFile(path.join(outputDir, `${name}.avif`));
    } catch (e) {
      console.warn(`  avif failed for ${name}, webp and jpg are ready:`, e.message);
    }
    console.log(`  created ${name}.{webp,jpg,avif}`);
  }
}

const manifest = {
  source: process.env.HERO_SOURCE_FILE ?? SOURCE_URL,
  credit: SOURCE_CREDIT,
  generatedAt: new Date().toISOString(),
  variants: VARIANTS.map(({ prefix, ratio, widths, focal }) => ({
    name: prefix ? 'portrait' : 'landscape',
    aspectRatio: ratio,
    widths,
    focal,
  })),
  formats: ['avif', 'webp', 'jpg'],
};
await writeFile(path.join(outputDir, 'busnet-hero-assets.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Done. Assets are in ${outputDir}`);
