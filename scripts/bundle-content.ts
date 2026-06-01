/**
 * Post-build step: re-bundle the content script as a single self-contained
 * classic IIFE and point the manifest directly at it.
 *
 * Prevents the @crxjs dynamic import race condition on Brave.
 */
import { build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const ASSETS_DIR = resolve(root, 'dist/assets');
const MANIFEST = resolve(root, 'dist/manifest.json');
const OUT_NAME = 'content.js';
const MANIFEST_REF = `assets/${OUT_NAME}`;

async function bundleContent(): Promise<void> {
  await build({
    configFile: false,
    root,
    resolve: { alias: { '~': resolve(root, 'src') } },
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'warn',
    build: {
      outDir: ASSETS_DIR,
      emptyOutDir: false,
      target: 'es2022',
      minify: 'esbuild',
      cssCodeSplit: false,
      lib: {
        entry: resolve(root, 'src/content/index.ts'),
        formats: ['iife'],
        name: 'KickAdBlocker',
        fileName: () => OUT_NAME,
      },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
}

function patchManifest(): void {
  const mf = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
    content_scripts?: Array<{ js?: string[] }>;
  };
  const cs = mf.content_scripts?.[0];
  if (!cs) throw new Error('[bundle-content] manifest has no content_scripts to patch');
  cs.js = [MANIFEST_REF];
  writeFileSync(MANIFEST, `${JSON.stringify(mf, null, 2)}\n`);
}

function assertClassic(file: string): void {
  const src = readFileSync(file, 'utf8');
  if (/\bimport\s*\(/.test(src)) {
    throw new Error('[bundle-content] output still contains a dynamic import() — not classic');
  }
}

await bundleContent();
const out = resolve(ASSETS_DIR, OUT_NAME);
if (!existsSync(out)) throw new Error('[bundle-content] content bundle was not emitted');
assertClassic(out);
patchManifest();
const kb = (statSync(out).size / 1024).toFixed(1);
console.info(`[bundle-content] ${MANIFEST_REF} (${kb} KB, classic IIFE) — manifest repointed`);
