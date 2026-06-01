import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const ICONS_DIR = resolve(ROOT, 'public/icons');
const SVG_PATH = resolve(ICONS_DIR, 'icon.svg');
const SIZES = [16, 32, 48, 128];

async function main(): Promise<void> {
  if (!existsSync(ICONS_DIR)) await mkdir(ICONS_DIR, { recursive: true });
  if (!existsSync(SVG_PATH)) {
    console.error(`SVG not found at ${SVG_PATH}`);
    process.exit(1);
  }
  const svg = await readFile(SVG_PATH);
  for (const size of SIZES) {
    const out = resolve(ICONS_DIR, `icon${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.info(`Wrote ${out}`);
  }
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
